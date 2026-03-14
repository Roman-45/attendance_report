package com.auca.attendance.service;

import com.auca.attendance.dto.request.ForgotPasswordRequest;
import com.auca.attendance.dto.request.ResetPasswordRequest;
import com.auca.attendance.entity.PasswordResetToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.repository.PasswordResetTokenRepository;
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
public class PasswordResetService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    /**
     * Generates a 6-digit OTP, hashes it, saves it and sends it by email.
     * Always returns success (even for unknown emails) to prevent user enumeration.
     */
    @Transactional
    public void requestReset(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            // Invalidate any existing unused tokens
            tokenRepository.invalidateAllByUserId(user.getId());

            String otp = generateOtp();
            String otpHash = passwordEncoder.encode(otp);

            PasswordResetToken token = PasswordResetToken.builder()
                    .user(user)
                    .otpHash(otpHash)
                    .expiresAt(OffsetDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                    .build();
            tokenRepository.save(token);

            sendOtpEmail(user, otp);
        });
    }

    /**
     * Verifies the OTP and updates the user's password.
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));

        PasswordResetToken token = tokenRepository
                .findActiveTokenByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired OTP"));

        if (token.isExpired()) {
            throw new IllegalArgumentException("OTP has expired. Please request a new one");
        }

        if (!passwordEncoder.matches(request.getOtp(), token.getOtpHash())) {
            throw new IllegalArgumentException("Invalid OTP");
        }

        // Mark token as used
        token.setUsed(true);
        tokenRepository.save(token);

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private String generateOtp() {
        int otp = 100_000 + SECURE_RANDOM.nextInt(900_000); // always 6 digits
        return String.valueOf(otp);
    }

    private void sendOtpEmail(User user, String otp) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(user.getEmail());
            mail.setSubject("[AUCA] Password Reset OTP");
            mail.setText(String.format(
                    "Hi %s,\n\n" +
                    "Your password reset OTP is: %s\n\n" +
                    "This code expires in %d minutes.\n" +
                    "If you did not request this, please ignore this email.\n\n" +
                    "AUCA Attendance System",
                    user.getName(), otp, OTP_EXPIRY_MINUTES
            ));
            mailSender.send(mail);
        } catch (Exception e) {
            log.warn("Failed to send OTP email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
