package com.auca.attendance.service;

import com.auca.attendance.security.RateLimitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for RateLimitService.
 * These run without Spring context — purely testing bucket logic.
 */
@DisplayName("RateLimitService — unit tests")
class RateLimitServiceTest {

    private RateLimitService service;

    @BeforeEach
    void setUp() {
        service = new RateLimitService();
    }

    // ─── Login bucket (capacity=10) ─────────────────────────────────────────

    @Test
    @DisplayName("Login: first 10 requests are allowed")
    void loginBucket_ShouldAllow10Requests() {
        String ip = "10.0.0.1";
        for (int i = 0; i < 10; i++) {
            assertThat(service.tryConsumeLogin(ip))
                    .as("Request %d should be allowed", i + 1)
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Login: 11th request from same IP is blocked")
    void loginBucket_ShouldBlock11thRequest() {
        String ip = "10.0.0.2";
        for (int i = 0; i < 10; i++) {
            service.tryConsumeLogin(ip);
        }
        assertThat(service.tryConsumeLogin(ip)).isFalse();
    }

    @Test
    @DisplayName("Login: different IPs get independent buckets")
    void loginBucket_DifferentIps_ShouldBeIndependent() {
        String ip1 = "10.0.0.3";
        String ip2 = "10.0.0.4";

        // Exhaust ip1
        for (int i = 0; i < 10; i++) {
            service.tryConsumeLogin(ip1);
        }
        assertThat(service.tryConsumeLogin(ip1)).isFalse();

        // ip2 should still be allowed
        assertThat(service.tryConsumeLogin(ip2)).isTrue();
    }

    // ─── MFA verify bucket (capacity=5) ─────────────────────────────────────

    @Test
    @DisplayName("MFA verify: first 5 requests are allowed, 6th is blocked")
    void mfaVerifyBucket_ShouldAllow5ThenBlock() {
        String ip = "10.0.1.1";
        for (int i = 0; i < 5; i++) {
            assertThat(service.tryConsumeMfaVerify(ip)).isTrue();
        }
        assertThat(service.tryConsumeMfaVerify(ip)).isFalse();
    }

    // ─── Forgot password bucket (capacity=3) ────────────────────────────────

    @Test
    @DisplayName("Forgot password: first 3 requests are allowed, 4th is blocked")
    void forgotPasswordBucket_ShouldAllow3ThenBlock() {
        String ip = "10.0.2.1";
        for (int i = 0; i < 3; i++) {
            assertThat(service.tryConsumeForgotPassword(ip)).isTrue();
        }
        assertThat(service.tryConsumeForgotPassword(ip)).isFalse();
    }

    // ─── MFA enable bucket (capacity=3) ─────────────────────────────────────

    @Test
    @DisplayName("MFA enable: first 3 requests are allowed, 4th is blocked")
    void mfaEnableBucket_ShouldAllow3ThenBlock() {
        String userId = "user-42";
        for (int i = 0; i < 3; i++) {
            assertThat(service.tryConsumeMfaEnable(userId)).isTrue();
        }
        assertThat(service.tryConsumeMfaEnable(userId)).isFalse();
    }

    // ─── Cross-bucket isolation ──────────────────────────────────────────────

    @Test
    @DisplayName("Different endpoint buckets for the same key are isolated")
    void differentBuckets_SameKey_ShouldBeIsolated() {
        String ip = "10.0.3.1";

        // Exhaust login bucket
        for (int i = 0; i < 10; i++) {
            service.tryConsumeLogin(ip);
        }
        assertThat(service.tryConsumeLogin(ip)).isFalse();

        // MFA verify bucket for same IP should still have tokens
        assertThat(service.tryConsumeMfaVerify(ip)).isTrue();

        // Forgot password bucket for same IP should still have tokens
        assertThat(service.tryConsumeForgotPassword(ip)).isTrue();
    }
}
