package com.auca.attendance.repository;

import com.auca.attendance.entity.MfaChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface MfaChallengeRepository extends JpaRepository<MfaChallenge, Long> {

    /**
     * Fetch the single active (unexpired + unused) challenge for a user.
     */
    @Query("""
        SELECT c FROM MfaChallenge c
        WHERE c.user.id = :userId
          AND c.used   = false
          AND c.expiresAt > CURRENT_TIMESTAMP
        ORDER BY c.createdAt DESC
        LIMIT 1
        """)
    Optional<MfaChallenge> findActiveByUserId(@Param("userId") Long userId);

    /** Invalidate all previous challenges for a user before issuing a new one. */
    @Modifying
    @Transactional
    @Query("UPDATE MfaChallenge c SET c.used = true WHERE c.user.id = :userId")
    void invalidateAllByUserId(@Param("userId") Long userId);
}
