package com.auca.attendance.service;

import com.auca.attendance.entity.RefreshToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    @Value("${application.security.jwt.refresh-token.expiration}")
    private long refreshTokenExpirationMs;

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Create and persist a new refresh token for a user.
     * Uses UUID + timestamp to guarantee uniqueness.
     */
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Revoke any existing tokens for this user (single-session policy)
        refreshTokenRepository.revokeAllByUserId(user.getId());

        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString() + "-" + System.currentTimeMillis())
                .expiresAt(OffsetDateTime.now().plusNanos(refreshTokenExpirationMs * 1_000_000L))
                .build();

        return refreshTokenRepository.save(token);
    }

    /**
     * Find and validate a refresh token string.
     * Throws if not found, revoked, or expired.
     */
    @Transactional
    public RefreshToken verifyAndGet(String tokenString) {
        RefreshToken token = refreshTokenRepository.findByToken(tokenString)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        if (!token.isValid()) {
            throw new IllegalArgumentException(
                    token.getRevoked() ? "Refresh token has been revoked" : "Refresh token has expired");
        }

        return token;
    }

    /**
     * Revoke a single refresh token (user logout).
     */
    @Transactional
    public void revoke(String tokenString) {
        refreshTokenRepository.findByToken(tokenString).ifPresent(t -> {
            t.setRevoked(true);
            refreshTokenRepository.save(t);
        });
    }

    /**
     * Revoke all tokens for a user (logout from all devices).
     */
    @Transactional
    public void revokeAll(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }
}
