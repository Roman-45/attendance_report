package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.MfaChallengeRepository;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * API regression tests for the 2FA (MFA) flow.
 * Tests the enable → confirm → login-with-MFA → verify-mfa flow.
 */
@DisplayName("MFA — API regression tests")
class MfaApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate      restTemplate;
    @Autowired UserRepository        userRepository;
    @Autowired MfaChallengeRepository challengeRepo;
    @Autowired JwtService            jwtService;
    @Autowired PasswordEncoder       passwordEncoder;

    private User user;
    private String accessToken;

    @BeforeEach
    void setUp() {
        user = userRepository.findByEmail("mfa_test@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("MFA Test User")
                        .email("mfa_test@auca.ac.rw")
                        .password(passwordEncoder.encode("Admin@1234"))
                        .role(Role.FACILITATOR)
                        .mfaEnabled(false)
                        .build()));
        // Reset state
        user.setMfaEnabled(false);
        user = userRepository.save(user);
        challengeRepo.invalidateAllByUserId(user.getId());

        accessToken = jwtService.generateToken(user);
    }

    // ─── Enable MFA flow ─────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /auth/mfa/enable returns 200 for authenticated user")
    void initMfaEnable_ShouldReturn200() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/mfa/enable",
                HttpMethod.POST,
                withToken(accessToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody()).containsKey("message");
    }

    @Test
    @DisplayName("POST /auth/mfa/enable returns 401 when not authenticated")
    void initMfaEnable_ShouldReturn401_WhenNoToken() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/mfa/enable", null, Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    // ─── Confirm MFA (wrong OTP path) ────────────────────────────────────────

    @Test
    @DisplayName("POST /auth/mfa/confirm returns 400 when OTP is wrong")
    void confirmMfa_ShouldReturn400_WhenOtpWrong() {
        // First send the enable OTP so a challenge exists
        restTemplate.exchange("/api/v1/auth/mfa/enable", HttpMethod.POST,
                withToken(accessToken, null), Map.class);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/mfa/confirm",
                HttpMethod.POST,
                withToken(accessToken, Map.of("email", user.getEmail(), "otp", "000000")),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ─── Disable MFA ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /auth/mfa/disable returns 200 for authenticated user")
    void disableMfa_ShouldReturn200() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/mfa/disable",
                HttpMethod.POST,
                withToken(accessToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ─── verify-mfa (wrong OTP path) ─────────────────────────────────────────

    @Test
    @DisplayName("POST /auth/verify-mfa returns 400 when no challenge exists")
    void verifyMfa_ShouldReturn400_WhenNoChallengeExists() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/verify-mfa",
                Map.of("email", user.getEmail(), "otp", "123456"),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Login with MFA disabled returns tokens immediately (no mfaRequired)")
    void login_WithMfaDisabled_ShouldReturnTokensDirectly() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/login",
                Map.of("email", "mfa_test@auca.ac.rw", "password", "Admin@1234"),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).containsKey("token");
        assertThat(data.get("mfaRequired")).isEqualTo(false);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private HttpEntity<?> withToken(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
