package com.auca.attendance.repository;

import com.auca.attendance.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // Fetch the latest unused, unexpired token for a user
    @Query("""
        SELECT t FROM PasswordResetToken t
        WHERE t.user.id = :userId
          AND t.used = false
          AND t.expiresAt > CURRENT_TIMESTAMP
        ORDER BY t.createdAt DESC
        LIMIT 1
        """)
    Optional<PasswordResetToken> findActiveTokenByUserId(Long userId);

    // Invalidate all previous tokens for a user before issuing a new one
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user.id = :userId AND t.used = false")
    void invalidateAllByUserId(Long userId);
}
