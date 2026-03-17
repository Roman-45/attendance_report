package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.RefreshTokenRepository;
import com.auca.attendance.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Auth API — regression tests")
class AuthApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired RefreshTokenRepository refreshTokenRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String BASE = "/api/v1/auth";
    private static final String PASSWORD = "Admin@1234";

    @BeforeEach
    void seedUser() {
        if (userRepository.findByEmail("authtest@auca.ac.rw").isEmpty()) {
            userRepository.save(User.builder()
                    .name("Auth Test Admin")
                    .email("authtest@auca.ac.rw")
                    .password(passwordEncoder.encode(PASSWORD))
                    .role(Role.ADMIN)
                    .build());
        }
    }

    // ─── Login ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Login with valid credentials returns access token AND refresh token")
    void login_ShouldReturnBothTokens_WhenCredentialsAreValid() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/login",
                loginBody("authtest@auca.ac.rw", PASSWORD),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<?, ?> data = (Map<?, ?>) ((Map<?, ?>) resp.getBody()).get("data");
        assertThat(data.get("token")).isNotNull();
        assertThat(data.get("refreshToken")).isNotNull();
        assertThat(data.get("role")).isEqualTo("ADMIN");
    }

    @Test
    @DisplayName("Login with wrong password returns 401")
    void login_ShouldReturn401_WhenPasswordIsWrong() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/login",
                loginBody("authtest@auca.ac.rw", "WrongPassword"),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(((Map<?, ?>) resp.getBody()).get("success")).isEqualTo(false);
    }

    @Test
    @DisplayName("Login with unknown email returns 401")
    void login_ShouldReturn401_WhenEmailNotFound() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/login",
                loginBody("nobody@auca.ac.rw", PASSWORD),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ─── Refresh token ───────────────────────────────────────────────────

    @Test
    @DisplayName("Refresh returns new token pair and rotates the refresh token")
    void refresh_ShouldReturnNewTokenPair() {
        String refreshToken = loginAndGetRefreshToken();

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/refresh",
                Map.of("refreshToken", refreshToken),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<?, ?> data = (Map<?, ?>) ((Map<?, ?>) resp.getBody()).get("data");
        assertThat(data.get("token")).isNotNull();
        assertThat(data.get("refreshToken")).isNotNull();
        // New refresh token must be different from the old one (rotation)
        assertThat(data.get("refreshToken")).isNotEqualTo(refreshToken);
    }

    @Test
    @DisplayName("Refresh with an invalid token string returns 400")
    void refresh_ShouldReturn400_WhenTokenIsInvalid() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/refresh",
                Map.of("refreshToken", "completely-fake-token"),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Refresh after logout returns 400 (token revoked)")
    void refresh_ShouldReturn400_AfterLogout() {
        String refreshToken = loginAndGetRefreshToken();

        // Logout
        restTemplate.postForEntity(BASE + "/logout",
                Map.of("refreshToken", refreshToken), Map.class);

        // Try to refresh with the now-revoked token
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/refresh",
                Map.of("refreshToken", refreshToken),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    // ─── Logout ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Logout returns 200 and revokes the token")
    void logout_ShouldReturn200_AndRevokeToken() {
        String refreshToken = loginAndGetRefreshToken();

        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/logout",
                Map.of("refreshToken", refreshToken),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        // Verify the token is actually revoked in the DB
        boolean revoked = refreshTokenRepository.findByToken(refreshToken)
                .map(t -> t.getRevoked()).orElse(true);
        assertThat(revoked).isTrue();
    }

    // ─── Forgot password ─────────────────────────────────────────────────
    // Use a class-specific IP so these 3 requests don't share the rate-limit
    // bucket with SecurityRegressionTest (which also sends 1 forgot-password
    // request from 127.0.0.1). Combined they would exceed the 3/hr limit.
    private static final String AUTH_TEST_IP = "10.0.2.1";

    @Test
    @DisplayName("Forgot password always returns 200 even for unknown emails (no user enumeration)")
    void forgotPassword_ShouldAlwaysReturn200() {
        ResponseEntity<Map> knownEmail = restTemplate.exchange(
                BASE + "/forgot-password", HttpMethod.POST,
                forgotPasswordBody("authtest@auca.ac.rw"), Map.class);

        ResponseEntity<Map> unknownEmail = restTemplate.exchange(
                BASE + "/forgot-password", HttpMethod.POST,
                forgotPasswordBody("nobody@auca.ac.rw"), Map.class);

        assertThat(knownEmail.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(unknownEmail.getStatusCode()).isEqualTo(HttpStatus.OK);
        // Both responses must be identical so attackers can't distinguish
        assertThat(knownEmail.getBody().get("message"))
                .isEqualTo(unknownEmail.getBody().get("message"));
    }

    @Test
    @DisplayName("Forgot password with invalid email format returns 400")
    void forgotPassword_ShouldReturn400_WhenEmailInvalid() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/forgot-password", HttpMethod.POST,
                forgotPasswordBody("not-an-email"), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private HttpEntity<Map<String, String>> forgotPasswordBody(String email) {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("X-Forwarded-For", AUTH_TEST_IP);
        return new HttpEntity<>(Map.of("email", email), h);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private HttpEntity<Map<String, String>> loginBody(String email, String password) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(Map.of("email", email, "password", password), headers);
    }

    @SuppressWarnings("unchecked")
    private String loginAndGetRefreshToken() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                BASE + "/login",
                loginBody("authtest@auca.ac.rw", PASSWORD),
                Map.class);
        return (String) ((Map<?, ?>) resp.getBody().get("data")).get("refreshToken");
    }
}
