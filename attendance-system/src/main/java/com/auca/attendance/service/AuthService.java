package com.auca.attendance.service;

import com.auca.attendance.dto.request.LoginRequest;
import com.auca.attendance.dto.request.RefreshTokenRequest;
import com.auca.attendance.dto.request.RegisterRequest;
import com.auca.attendance.dto.request.VerifyEmailRequest;
import com.auca.attendance.dto.request.VerifyMfaRequest;
import com.auca.attendance.dto.response.AuthResponse;
import com.auca.attendance.entity.RefreshToken;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.Map;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final MfaService mfaService;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${application.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Step 1 of login.
     * - If MFA is disabled → return full tokens immediately.
     * - If MFA is enabled  → send OTP email, return mfaRequired=true (no tokens yet).
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            mfaService.sendLoginOtp(user);
            return AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .mfaRequired(true)
                    .build();
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    /**
     * Step 2 of login when MFA is enabled.
     * Validates the OTP and returns full tokens.
     */
    @Transactional
    public AuthResponse verifyMfa(VerifyMfaRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!mfaService.verifyOtp(user, request.getOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    /**
     * Issue a new access token using a valid refresh token.
     * Old refresh token is revoked and a new one issued (rotation).
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken oldToken = refreshTokenService.verifyAndGet(request.getRefreshToken());
        User user = oldToken.getUser();

        // Rotate: revoke old, issue new pair
        refreshTokenService.revoke(request.getRefreshToken());
        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken.getToken());
    }

    /**
     * Revoke the provided refresh token (single-device logout).
     */
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.getRefreshToken());
    }

    // ─── Self-Service Registration ────────────────────────────────────────────

    /**
     * Register a new STUDENT or INSTRUCTOR account.
     * The account is inactive until the user verifies their email.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (request.getRole() != Role.STUDENT && request.getRole() != Role.INSTRUCTOR) {
            throw new IllegalArgumentException("Self-registration is only allowed for STUDENT and INSTRUCTOR roles");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("An account with that email already exists");
        }

        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(15);

        User user = userRepository.save(User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .emailVerified(false)
                .verificationToken(otp)
                .emailOtpExpiresAt(expiresAt)
                .build());

        // Auto-create linked Student entity for self-registered students
        if (request.getRole() == Role.STUDENT) {
            String studentId = "STU" + Year.now().getValue() + String.format("%04d",
                    (int)(Math.random() * 9000) + 1000);
            studentRepository.save(Student.builder()
                    .studentId(studentId)
                    .name(request.getName())
                    .email(request.getEmail())
                    .cohortYear(Year.now().getValue())
                    .account(user)
                    .build());
        }

        sendVerificationEmail(user, otp);

        return AuthResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .build();
    }

    /**
     * Verify email using a 6-digit OTP entered by the user.
     * The OTP expires 15 minutes after registration.
     */
    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or OTP"));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            return; // already verified — idempotent
        }

        if (user.getVerificationToken() == null || !user.getVerificationToken().equals(request.getOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        if (user.getEmailOtpExpiresAt() == null || LocalDateTime.now().isAfter(user.getEmailOtpExpiresAt())) {
            throw new IllegalArgumentException("The verification code has expired. Please sign up again.");
        }

        user.setEmailVerified(true);
        user.setVerificationToken(null);
        user.setEmailOtpExpiresAt(null);
        userRepository.save(user);
    }

    private void sendVerificationEmail(User user, String otp) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(user.getEmail());
        mail.setSubject("[AUCA] Your email verification code");
        mail.setText(String.format(
                "Hello %s,%n%n"
                + "Thank you for registering with the AUCA Attendance System.%n%n"
                + "Your email verification code is:%n%n"
                + "    %s%n%n"
                + "Enter this 6-digit code on the verification page to activate your account.%n"
                + "This code expires in 15 minutes.%n%n"
                + "If you did not create this account, you can safely ignore this email.%n%n"
                + "AUCA Attendance System",
                user.getName(), otp));
        try {
            mailSender.send(mail);
        } catch (Exception e) {
            // Log but don't fail — account is created; user can re-register if needed
            System.err.println("[WARN] Failed to send verification email to " + user.getEmail() + ": " + e.getMessage());
        }
    }

    // ─── Google OAuth ────────────────────────────────────────────────────────

    /**
     * Authenticate via Google ID token.
     * <ol>
     *   <li>Verifies the token with Google's tokeninfo endpoint.</li>
     *   <li>Finds or creates a local user linked to the Google account.</li>
     *   <li>Returns our own JWT pair; {@code profileIncomplete=true} for brand-new accounts.</li>
     * </ol>
     */
    @Transactional
    @SuppressWarnings("unchecked")
    public AuthResponse googleLogin(String credential) {
        // Verify the ID token with Google
        String url = "https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + credential;
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> info;
        try {
            info = restTemplate.getForObject(url, Map.class);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid Google token");
        }
        if (info == null || !"true".equals(String.valueOf(info.get("email_verified")))) {
            throw new IllegalArgumentException("Google account email is not verified");
        }

        String googleId = String.valueOf(info.get("sub"));
        String email    = String.valueOf(info.get("email"));
        String name     = info.containsKey("name") ? String.valueOf(info.get("name")) : email.split("@")[0];

        boolean profileIncomplete = false;

        // Look up by googleId first, fall back to email (merge existing account)
        User user = userRepository.findByGoogleId(googleId)
                .or(() -> userRepository.findByEmail(email))
                .orElse(null);

        if (user == null) {
            // Brand-new user — create account
            user = userRepository.save(User.builder()
                    .name(name)
                    .email(email)
                    .googleId(googleId)
                    .role(Role.STUDENT)
                    .emailVerified(true)
                    .build());

            // Auto-create linked Student record
            String studentId = "STU" + Year.now().getValue() + String.format("%04d",
                    (int)(Math.random() * 9000) + 1000);
            studentRepository.save(Student.builder()
                    .studentId(studentId)
                    .name(name)
                    .email(email)
                    .cohortYear(Year.now().getValue())
                    .account(user)
                    .build());

            profileIncomplete = true;
        } else if (user.getGoogleId() == null) {
            // Existing email-only account — link Google ID
            user.setGoogleId(googleId);
            userRepository.save(user);
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        String photoUrl = user.getProfilePhotoPath() != null ? "/api/v1/profile/photo" : null;
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken.getToken())
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(photoUrl)
                .profileIncomplete(profileIncomplete)
                .build();
    }

    // ─── Mapper ─────────────────────────────────────────────────────────────
    public AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        String photoUrl = user.getProfilePhotoPath() != null ? "/api/v1/profile/photo" : null;
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(photoUrl)
                .build();
    }
}
