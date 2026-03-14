package com.auca.attendance.service;

import com.auca.attendance.entity.RefreshToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.RefreshTokenRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("RefreshTokenService — unit tests")
class RefreshTokenServiceTest {

    @Mock RefreshTokenRepository refreshTokenRepository;

    @InjectMocks RefreshTokenService service;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Inject the expiration value (7 days in ms) — normally set by @Value
        ReflectionTestUtils.setField(service, "refreshTokenExpirationMs", 604_800_000L);

        testUser = User.builder()
                .id(1L)
                .name("Test User")
                .email("user@auca.ac.rw")
                .role(Role.ADMIN)
                .build();
    }

    // ─── createRefreshToken ───────────────────────────────────────────────

    @Test
    @DisplayName("Creates a new token with unique value and future expiry")
    void createRefreshToken_ShouldReturnTokenWithFutureExpiry() {
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        RefreshToken token = service.createRefreshToken(testUser);

        assertThat(token.getToken()).isNotBlank();
        assertThat(token.getExpiresAt()).isAfter(OffsetDateTime.now());
        assertThat(token.getRevoked()).isFalse();
    }

    @Test
    @DisplayName("Revokes all existing tokens before creating a new one (single-session policy)")
    void createRefreshToken_ShouldRevokeExistingTokens_First() {
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.createRefreshToken(testUser);

        var order = inOrder(refreshTokenRepository);
        order.verify(refreshTokenRepository).revokeAllByUserId(1L);
        order.verify(refreshTokenRepository).save(any());
    }

    // ─── verifyAndGet ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Returns token when it is valid")
    void verifyAndGet_ShouldReturn_WhenTokenIsValid() {
        RefreshToken token = validToken("abc-token");
        when(refreshTokenRepository.findByToken("abc-token")).thenReturn(Optional.of(token));

        RefreshToken result = service.verifyAndGet("abc-token");

        assertThat(result.getToken()).isEqualTo("abc-token");
    }

    @Test
    @DisplayName("Throws when token string is not found in DB")
    void verifyAndGet_ShouldThrow_WhenTokenNotFound() {
        when(refreshTokenRepository.findByToken(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.verifyAndGet("ghost-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid refresh token");
    }

    @Test
    @DisplayName("Throws when token is revoked")
    void verifyAndGet_ShouldThrow_WhenTokenIsRevoked() {
        RefreshToken token = validToken("abc-token");
        token.setRevoked(true);
        when(refreshTokenRepository.findByToken("abc-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.verifyAndGet("abc-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("revoked");
    }

    @Test
    @DisplayName("Throws when token is expired")
    void verifyAndGet_ShouldThrow_WhenTokenIsExpired() {
        RefreshToken token = validToken("abc-token");
        token.setExpiresAt(OffsetDateTime.now().minusHours(1)); // expired
        when(refreshTokenRepository.findByToken("abc-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> service.verifyAndGet("abc-token"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("expired");
    }

    // ─── revoke ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Marks token as revoked on logout")
    void revoke_ShouldSetRevokedTrue() {
        RefreshToken token = validToken("abc-token");
        when(refreshTokenRepository.findByToken("abc-token")).thenReturn(Optional.of(token));
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.revoke("abc-token");

        ArgumentCaptor<RefreshToken> captor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getRevoked()).isTrue();
    }

    @Test
    @DisplayName("Does nothing silently when token is not found on revoke")
    void revoke_ShouldDoNothing_WhenTokenNotFound() {
        when(refreshTokenRepository.findByToken(any())).thenReturn(Optional.empty());

        service.revoke("ghost-token"); // must not throw

        verify(refreshTokenRepository, never()).save(any());
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private RefreshToken validToken(String tokenStr) {
        return RefreshToken.builder()
                .id(1L)
                .user(testUser)
                .token(tokenStr)
                .revoked(false)
                .expiresAt(OffsetDateTime.now().plusDays(7))
                .build();
    }
}
