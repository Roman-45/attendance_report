package com.auca.attendance.service;

import com.auca.attendance.entity.MfaChallenge;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.MfaChallengeRepository;
import com.auca.attendance.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("MfaService — unit tests")
class MfaServiceTest {

    @Mock MfaChallengeRepository challengeRepo;
    @Mock UserRepository          userRepo;
    @Mock PasswordEncoder         passwordEncoder;
    @Mock JavaMailSender          mailSender;

    @InjectMocks MfaService mfaService;

    private User user() {
        return User.builder().id(1L).email("user@auca.ac.rw")
                .name("Test").role(Role.ADMIN).mfaEnabled(false).build();
    }

    @Test
    @DisplayName("sendLoginOtp: invalidates old challenges and saves a new hashed one")
    void sendLoginOtp_ShouldInvalidateOldAndSaveNew() {
        User u = user();
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        mfaService.sendLoginOtp(u);

        verify(challengeRepo).invalidateAllByUserId(1L);
        ArgumentCaptor<MfaChallenge> cap = ArgumentCaptor.forClass(MfaChallenge.class);
        verify(challengeRepo).save(cap.capture());
        assertThat(cap.getValue().getOtpHash()).isEqualTo("hashed");
        assertThat(cap.getValue().getExpiresAt()).isAfter(OffsetDateTime.now());
    }

    @Test
    @DisplayName("verifyOtp: returns true when OTP matches active challenge")
    void verifyOtp_ShouldReturnTrue_WhenOtpMatches() {
        User u = user();
        MfaChallenge challenge = MfaChallenge.builder()
                .id(1L).user(u).otpHash("hashed")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .used(false).build();

        when(challengeRepo.findActiveByUserId(1L)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("123456", "hashed")).thenReturn(true);

        boolean result = mfaService.verifyOtp(u, "123456");

        assertThat(result).isTrue();
        verify(challengeRepo).save(argThat(c -> c.getUsed().equals(true)));
    }

    @Test
    @DisplayName("verifyOtp: returns false when no active challenge exists")
    void verifyOtp_ShouldReturnFalse_WhenNoChallengeExists() {
        User u = user();
        when(challengeRepo.findActiveByUserId(1L)).thenReturn(Optional.empty());

        boolean result = mfaService.verifyOtp(u, "123456");

        assertThat(result).isFalse();
        verify(challengeRepo, never()).save(any());
    }

    @Test
    @DisplayName("verifyOtp: returns false when OTP does not match")
    void verifyOtp_ShouldReturnFalse_WhenOtpDoesNotMatch() {
        User u = user();
        MfaChallenge challenge = MfaChallenge.builder()
                .id(1L).user(u).otpHash("hashed")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .used(false).build();

        when(challengeRepo.findActiveByUserId(1L)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("999999", "hashed")).thenReturn(false);

        boolean result = mfaService.verifyOtp(u, "999999");

        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("enableMfa: sets mfa_enabled=true after correct OTP")
    void enableMfa_ShouldSetMfaEnabled_WhenOtpCorrect() {
        User u = user();
        MfaChallenge challenge = MfaChallenge.builder()
                .id(1L).user(u).otpHash("hashed")
                .expiresAt(OffsetDateTime.now().plusMinutes(5))
                .used(false).build();

        when(challengeRepo.findActiveByUserId(1L)).thenReturn(Optional.of(challenge));
        when(passwordEncoder.matches("123456", "hashed")).thenReturn(true);
        when(userRepo.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        mfaService.enableMfa(u, "123456");

        verify(userRepo).save(argThat(saved -> Boolean.TRUE.equals(saved.getMfaEnabled())));
    }

    @Test
    @DisplayName("enableMfa: throws IllegalArgumentException when OTP is wrong")
    void enableMfa_ShouldThrow_WhenOtpWrong() {
        User u = user();
        when(challengeRepo.findActiveByUserId(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> mfaService.enableMfa(u, "000000"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Invalid or expired OTP");
    }

    @Test
    @DisplayName("disableMfa: sets mfa_enabled=false and invalidates all challenges")
    void disableMfa_ShouldDisableAndInvalidate() {
        User u = user();
        u.setMfaEnabled(true);
        when(userRepo.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        mfaService.disableMfa(u);

        verify(userRepo).save(argThat(saved -> Boolean.FALSE.equals(saved.getMfaEnabled())));
        verify(challengeRepo).invalidateAllByUserId(1L);
    }
}
