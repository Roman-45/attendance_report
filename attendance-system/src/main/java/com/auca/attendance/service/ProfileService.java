package com.auca.attendance.service;

import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FileStorageService fileStorageService;
    private final JavaMailSender mailSender;

    // ─── Update display name ──────────────────────────────────────────────────

    @Transactional
    public void updateName(User user, String name) {
        user.setName(name);
        userRepository.save(user);
        // Sync to linked Student record if exists
        studentRepository.findByAccountId(user.getId()).ifPresent(s -> {
            s.setName(name);
            studentRepository.save(s);
        });
    }

    // ─── Profile photo ────────────────────────────────────────────────────────

    @Transactional
    public String uploadPhoto(User user, MultipartFile file) throws IOException {
        String path = fileStorageService.storeUserPhoto(user.getId(), file);
        user.setProfilePhotoPath(path);
        userRepository.save(user);
        // Sync photo to linked Student record if exists
        studentRepository.findByAccountId(user.getId()).ifPresent(s -> {
            s.setProfilePhotoPath(path);
            studentRepository.save(s);
        });
        return "/api/v1/profile/photo";
    }

    @Transactional(readOnly = true)
    public byte[] getOwnPhoto(User user) {
        if (user.getProfilePhotoPath() == null) {
            throw new ResourceNotFoundException("No profile photo set");
        }
        return fileStorageService.loadFile(user.getProfilePhotoPath());
    }

    @Transactional(readOnly = true)
    public byte[] getPhotoByUserId(Long userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (target.getProfilePhotoPath() == null) {
            throw new ResourceNotFoundException("No profile photo set");
        }
        return fileStorageService.loadFile(target.getProfilePhotoPath());
    }

    // ─── Email change (2-step OTP) ────────────────────────────────────────────

    @Transactional
    public void requestEmailChange(User user, String newEmail) {
        if (userRepository.existsByEmail(newEmail)) {
            throw new ConflictException("An account with that email already exists");
        }
        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        user.setPendingEmail(newEmail);
        user.setEmailChangeOtp(otp);
        user.setEmailChangeOtpExpiresAt(LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);
        sendEmailChangeOtp(user, newEmail, otp);
    }

    @Transactional
    public void confirmEmailChange(User user, String otp) {
        if (user.getPendingEmail() == null || user.getEmailChangeOtp() == null) {
            throw new IllegalArgumentException("No pending email change. Please request a code first.");
        }
        if (!otp.equals(user.getEmailChangeOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        if (user.getEmailChangeOtpExpiresAt() == null
                || LocalDateTime.now().isAfter(user.getEmailChangeOtpExpiresAt())) {
            throw new IllegalArgumentException("The code has expired. Please request a new one.");
        }
        String newEmail = user.getPendingEmail();
        user.setEmail(newEmail);
        user.setPendingEmail(null);
        user.setEmailChangeOtp(null);
        user.setEmailChangeOtpExpiresAt(null);
        userRepository.save(user);
        // Sync to linked Student record if exists
        studentRepository.findByAccountId(user.getId()).ifPresent(s -> {
            s.setEmail(newEmail);
            studentRepository.save(s);
        });
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void sendEmailChangeOtp(User user, String newEmail, String otp) {
        SimpleMailMessage mail = new SimpleMailMessage();
        mail.setTo(newEmail);
        mail.setSubject("[AUCA] Confirm your new email address");
        mail.setText(String.format(
                "Hello %s,%n%n"
                + "You requested to change your AUCA Attendance System email to this address.%n%n"
                + "Your confirmation code is:%n%n"
                + "    %s%n%n"
                + "Enter this 6-digit code to complete the change.%n"
                + "This code expires in 15 minutes.%n%n"
                + "If you did not request this change, you can safely ignore this email.%n%n"
                + "AUCA Attendance System",
                user.getName(), otp));
        try {
            mailSender.send(mail);
        } catch (Exception e) {
            System.err.println("[WARN] Failed to send email-change OTP to " + newEmail + ": " + e.getMessage());
        }
    }
}
