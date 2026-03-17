package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.security.RateLimitService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for the RateLimitFilter.
 *
 * Bucket exhaustion logic (capacity, blocking, isolation) is fully tested
 * in RateLimitServiceTest (7 pure unit tests, sub-second execution).
 *
 * These integration tests verify:
 * 1. The filter bean is injected and accessible from the Spring context.
 * 2. GET endpoints are never rate-limited (filter skips non-POST).
 * 3. Normal POST requests to rate-limited endpoints pass through when
 *    the bucket has capacity (filter doesn't false-positive block).
 */
@DisplayName("Rate Limiting — integration tests")
class RateLimitingTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired RateLimitService rateLimitService;

    @Test
    @DisplayName("RateLimitService bean is available in the application context")
    void rateLimitService_ShouldBeInjected() {
        assertThat(rateLimitService).isNotNull();
    }

    @Test
    @DisplayName("GET /actuator/health is never rate-limited regardless of request count")
    void actuatorHealth_ShouldNeverBe429() {
        for (int i = 0; i < 20; i++) {
            ResponseEntity<Map> resp = restTemplate.getForEntity("/actuator/health", Map.class);
            assertThat(resp.getStatusCode()).isNotEqualTo(HttpStatus.TOO_MANY_REQUESTS);
        }
    }

    @Test
    @DisplayName("POST /auth/verify-mfa goes through filter and returns 400 (not 429) when bucket has capacity")
    void verifyMfa_ShouldNotBe429_WhenBucketHasCapacity() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/verify-mfa",
                Map.of("email", "nobody@example.com", "otp", "123456"),
                Map.class);

        // 400 = reached the controller (rate limiter did not block)
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("POST /auth/forgot-password goes through filter and returns 200 when bucket has capacity")
    void forgotPassword_ShouldNotBe429_WhenBucketHasCapacity() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // Use a dedicated IP to avoid cross-test bucket contamination
        headers.set("X-Forwarded-For", "198.51.100.50");

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/forgot-password", HttpMethod.POST,
                new HttpEntity<>(Map.of("email", "nobody@example.com"), headers),
                Map.class);

        // 200 = reached the service (rate limiter did not block)
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
