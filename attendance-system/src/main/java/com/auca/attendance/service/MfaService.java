package com.auca.attendance.service;

import com.auca.attendance.entity.MfaChallenge;
import com.auca.attendance.entity.User;
import com.auca.attendance.repository.MfaChallengeRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class MfaService {

    private static final int OTP_EXPIRY_MINUTES = 5;

    private final MfaChallengeRepository challengeRepo;
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    /**
     * Send a login OTP to the user's email. Called during login when mfa_enabled=true.
     */
    @Transactional
    public void sendLoginOtp(User user) {
        // Invalidate any previous challenges
        challengeRepo.invalidateAllByUserId(user.getId());

        String otp = generateOtp();

        MfaChallenge challenge = MfaChallenge.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        challengeRepo.save(challenge);

        sendOtpEmail(user.getEmail(), otp, "Login Verification Code");
    }

    /**
     * Send an OTP to confirm enabling MFA. Called from /auth/mfa/enable.
     */
    @Transactional
    public void sendEnableOtp(User user) {
        challengeRepo.invalidateAllByUserId(user.getId());

        String otp = generateOtp();

        MfaChallenge challenge = MfaChallenge.builder()
                .user(user)
                .otpHash(passwordEncoder.encode(otp))
                .expiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        challengeRepo.save(challenge);

        sendOtpEmail(user.getEmail(), otp, "Enable Two-Factor Authentication");
    }

    /**
     * Verify a login OTP. Returns true if valid. Marks challenge as used.
     */
    @Transactional
    public boolean verifyOtp(User user, String rawOtp) {
        MfaChallenge challenge = challengeRepo.findActiveByUserId(user.getId()).orElse(null);

        if (challenge == null || !passwordEncoder.matches(rawOtp, challenge.getOtpHash())) {
            return false;
        }

        challenge.setUsed(true);
        challengeRepo.save(challenge);
        return true;
    }

    /**
     * Enable MFA for the user after verifying the OTP confirmation code.
     */
    @Transactional
    public void enableMfa(User user, String rawOtp) {
        if (!verifyOtp(user, rawOtp)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        user.setMfaEnabled(true);
        userRepo.save(user);
    }

    /**
     * Disable MFA — no OTP required, just authenticated intent.
     */
    @Transactional
    public void disableMfa(User user) {
        user.setMfaEnabled(false);
        userRepo.save(user);
        challengeRepo.invalidateAllByUserId(user.getId());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private String generateOtp() {
        return String.format("%06d", new SecureRandom().nextInt(1_000_000));
    }

    private void sendOtpEmail(String to, String otp, String subject) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setSubject("[AUCA] " + subject);
            mail.setText("Your verification code is: " + otp + "\n\nThis code expires in "
                    + OTP_EXPIRY_MINUTES + " minutes. Do not share it with anyone.");
            mailSender.send(mail);
        } catch (Exception e) {
            log.warn("Failed to send MFA OTP email to {}: {}", to, e.getMessage());
        }
    }
}
