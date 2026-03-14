package com.auca.attendance.repository;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.PasswordResetToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@DisplayName("PasswordResetTokenRepository — integration tests")
class PasswordResetTokenRepositoryTest extends BaseIntegrationTest {

    @Autowired PasswordResetTokenRepository tokenRepository;
    @Autowired UserRepository userRepository;

    private User user;

    @BeforeEach
    void setUp() {
        user = userRepository.save(User.builder()
                .name("Repo Test User")
                .email("repotestuser_prt@auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.ADMIN)
                .build());
    }

    @Test
    @DisplayName("findActiveTokenByUserId returns the valid active token")
    void findActiveToken_ShouldReturn_WhenValidTokenExists() {
        PasswordResetToken token = tokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .otpHash("hashedotp123")
                .expiresAt(OffsetDateTime.now().plusMinutes(10))
                .used(false)
                .build());

        Optional<PasswordResetToken> result = tokenRepository.findActiveTokenByUserId(user.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(token.getId());
    }

    @Test
    @DisplayName("findActiveTokenByUserId ignores expired tokens")
    void findActiveToken_ShouldIgnoreExpiredTokens() {
        tokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .otpHash("hashedotp")
                .expiresAt(OffsetDateTime.now().minusMinutes(1)) // expired
                .used(false)
                .build());

        Optional<PasswordResetToken> result = tokenRepository.findActiveTokenByUserId(user.getId());

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findActiveTokenByUserId ignores used tokens")
    void findActiveToken_ShouldIgnoreUsedTokens() {
        tokenRepository.save(PasswordResetToken.builder()
                .user(user)
                .otpHash("hashedotp")
                .expiresAt(OffsetDateTime.now().plusMinutes(10))
                .used(true) // already used
                .build());

        Optional<PasswordResetToken> result = tokenRepository.findActiveTokenByUserId(user.getId());

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findActiveTokenByUserId returns empty when no token exists")
    void findActiveToken_ShouldReturnEmpty_WhenNoToken() {
        Optional<PasswordResetToken> result = tokenRepository.findActiveTokenByUserId(user.getId());
        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("invalidateAllByUserId marks all unused tokens as used")
    void invalidateAll_ShouldMarkAllUnused_AsUsed() {
        tokenRepository.save(PasswordResetToken.builder()
                .user(user).otpHash("hash1")
                .expiresAt(OffsetDateTime.now().plusMinutes(10)).used(false).build());
        tokenRepository.save(PasswordResetToken.builder()
                .user(user).otpHash("hash2")
                .expiresAt(OffsetDateTime.now().plusMinutes(10)).used(false).build());

        tokenRepository.invalidateAllByUserId(user.getId());

        // After invalidation, no active token should be found
        Optional<PasswordResetToken> active = tokenRepository.findActiveTokenByUserId(user.getId());
        assertThat(active).isEmpty();
    }

    @Test
    @DisplayName("invalidateAllByUserId does not affect tokens of other users")
    void invalidateAll_ShouldNotAffectOtherUsers() {
        User otherUser = userRepository.save(User.builder()
                .name("Other User")
                .email("otheruser_prt@auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.ADMIN)
                .build());

        tokenRepository.save(PasswordResetToken.builder()
                .user(otherUser).otpHash("otherhash")
                .expiresAt(OffsetDateTime.now().plusMinutes(10)).used(false).build());

        tokenRepository.invalidateAllByUserId(user.getId()); // only invalidate main user

        Optional<PasswordResetToken> otherActive = tokenRepository.findActiveTokenByUserId(otherUser.getId());
        assertThat(otherActive).isPresent(); // other user's token untouched
    }
}
