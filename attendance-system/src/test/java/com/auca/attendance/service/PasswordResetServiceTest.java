package com.auca.attendance.service;

import com.auca.attendance.dto.request.ForgotPasswordRequest;
import com.auca.attendance.dto.request.ResetPasswordRequest;
import com.auca.attendance.entity.PasswordResetToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.PasswordResetTokenRepository;
import com.auca.attendance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordResetService — unit tests")
class PasswordResetServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository tokenRepository;
    @Mock JavaMailSender mailSender;

    // Use a real encoder so BCrypt hashing/matching works correctly in tests
    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    PasswordResetService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        service = new PasswordResetService(
                userRepository, tokenRepository, passwordEncoder, mailSender);

        testUser = User.builder()
                .id(1L)
                .name("Test Admin")
                .email("admin@auca.ac.rw")
                .password(passwordEncoder.encode("OldPassword@1"))
                .role(Role.ADMIN)
                .build();
    }

    // ─── forgotPassword ───────────────────────────────────────────────────

    @Test
    @DisplayName("Saves a hashed OTP token and sends an email when email is found")
    void requestReset_ShouldSaveToken_AndSendEmail_WhenEmailExists() {
        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("admin@auca.ac.rw");

        service.requestReset(req);

        verify(tokenRepository).invalidateAllByUserId(1L);

        ArgumentCaptor<PasswordResetToken> tokenCaptor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(tokenRepository).save(tokenCaptor.capture());
        PasswordResetToken saved = tokenCaptor.getValue();

        assertThat(saved.getOtpHash()).isNotBlank();
        assertThat(saved.getUsed()).isFalse();
        assertThat(saved.getExpiresAt()).isAfter(OffsetDateTime.now());

        verify(mailSender).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("Does nothing silently when email is not registered (no user enumeration)")
    void requestReset_ShouldDoNothing_WhenEmailNotFound() {
        when(userRepository.findByEmail(any())).thenReturn(Optional.empty());

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("unknown@auca.ac.rw");

        service.requestReset(req); // must not throw

        verifyNoInteractions(tokenRepository, mailSender);
    }

    // ─── resetPassword ───────────────────────────────────────────────────

    @Test
    @DisplayName("Updates password when OTP is correct and not expired")
    void resetPassword_ShouldUpdatePassword_WhenOtpIsValid() {
        String rawOtp = "123456";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .otpHash(passwordEncoder.encode(rawOtp))
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findActiveTokenByUserId(1L)).thenReturn(Optional.of(token));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("admin@auca.ac.rw");
        req.setOtp(rawOtp);
        req.setNewPassword("NewPassword@1");

        service.resetPassword(req);

        assertThat(token.getUsed()).isTrue();

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(passwordEncoder.matches("NewPassword@1", userCaptor.getValue().getPassword())).isTrue();
    }

    @Test
    @DisplayName("Throws when OTP is incorrect")
    void resetPassword_ShouldThrow_WhenOtpIsWrong() {
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .otpHash(passwordEncoder.encode("999999"))
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .used(false)
                .build();

        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findActiveTokenByUserId(1L)).thenReturn(Optional.of(token));

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("admin@auca.ac.rw");
        req.setOtp("000000");
        req.setNewPassword("NewPassword@1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid OTP");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Throws when OTP has expired")
    void resetPassword_ShouldThrow_WhenOtpIsExpired() {
        String rawOtp = "123456";
        PasswordResetToken token = PasswordResetToken.builder()
                .id(1L)
                .user(testUser)
                .otpHash(passwordEncoder.encode(rawOtp))
                .expiresAt(OffsetDateTime.now().minusMinutes(1)) // already expired
                .used(false)
                .build();

        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findActiveTokenByUserId(1L)).thenReturn(Optional.of(token));

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("admin@auca.ac.rw");
        req.setOtp(rawOtp);
        req.setNewPassword("NewPassword@1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("Throws when no active token exists (no request was made)")
    void resetPassword_ShouldThrow_WhenNoActiveToken() {
        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.findActiveTokenByUserId(1L)).thenReturn(Optional.empty());

        ResetPasswordRequest req = new ResetPasswordRequest();
        req.setEmail("admin@auca.ac.rw");
        req.setOtp("123456");
        req.setNewPassword("NewPassword@1");

        assertThatThrownBy(() -> service.resetPassword(req))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Invalidates previous tokens before issuing a new one")
    void requestReset_ShouldInvalidatePreviousTokens_BeforeSavingNew() {
        when(userRepository.findByEmail("admin@auca.ac.rw")).thenReturn(Optional.of(testUser));
        when(tokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ForgotPasswordRequest req = new ForgotPasswordRequest();
        req.setEmail("admin@auca.ac.rw");
        service.requestReset(req);

        // invalidate must be called BEFORE save
        var order = inOrder(tokenRepository);
        order.verify(tokenRepository).invalidateAllByUserId(1L);
        order.verify(tokenRepository).save(any());
    }
}
