package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
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
 * Verifies that @PreAuthorize rules and JWT security are enforced.
 * These tests protect against accidental misconfiguration of security rules.
 */
@DisplayName("Security — regression tests")
class SecurityRegressionTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private String adminToken;
    private String facilitatorToken;
    private String instructorToken;

    @BeforeEach
    void setupUsers() {
        adminToken       = tokenFor("sec_admin@auca.ac.rw",       Role.ADMIN);
        facilitatorToken = tokenFor("sec_facilitator@auca.ac.rw", Role.FACILITATOR);
        instructorToken  = tokenFor("sec_instructor@auca.ac.rw",  Role.INSTRUCTOR);
    }

    // ─── No token ────────────────────────────────────────────────────────

    @Test
    @DisplayName("Protected endpoints return 401/403 when no token is provided")
    void noToken_ShouldReturn401Or403_OnProtectedEndpoints() {
        assertUnauthorizedOrForbidden(HttpMethod.GET,    "/api/v1/students",  null);
        assertUnauthorizedOrForbidden(HttpMethod.GET,    "/api/v1/modules",   null);
        assertUnauthorizedOrForbidden(HttpMethod.GET,    "/api/v1/notifications", null);
    }

    // ─── Role enforcement ────────────────────────────────────────────────

    @Test
    @DisplayName("FACILITATOR cannot create a student (ADMIN only) — must return 403")
    void facilitator_CannotCreateStudent() {
        Map<String, Object> body = Map.of(
                "studentId", "STU999", "name", "Hacker",
                "email", "hacker@test.auca.ac.rw", "cohortYear", 2024, "program", "CS");

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/students",
                HttpMethod.POST,
                withToken(facilitatorToken, body),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("INSTRUCTOR cannot create a student (ADMIN only) — must return 403")
    void instructor_CannotCreateStudent() {
        Map<String, Object> body = Map.of(
                "studentId", "STU998", "name", "Hacker2",
                "email", "hacker2@test.auca.ac.rw", "cohortYear", 2024, "program", "CS");

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/students",
                HttpMethod.POST,
                withToken(instructorToken, body),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("FACILITATOR cannot access notifications (ADMIN only) — must return 403")
    void facilitator_CannotAccessNotifications() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/notifications",
                HttpMethod.GET,
                withToken(facilitatorToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("INSTRUCTOR cannot access notifications (ADMIN only) — must return 403")
    void instructor_CannotAccessNotifications() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/notifications",
                HttpMethod.GET,
                withToken(instructorToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("ADMIN cannot create an attendance session (FACILITATOR only) — must return 403")
    void admin_CannotCreateAttendanceSession() {
        Map<String, Object> body = Map.of(
                "moduleId", 1, "sessionDate", "2025-01-01",
                "startTime", "08:00", "endTime", "10:00", "period", "MORNING");

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/sessions",
                HttpMethod.POST,
                withToken(adminToken, body),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("FACILITATOR cannot manage mark columns (INSTRUCTOR only) — must return 403")
    void facilitator_CannotCreateMarkColumn() {
        Map<String, Object> body = Map.of(
                "moduleId", 1, "name", "Midterm", "type", "MIDTERM", "maxScore", 40);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/mark-columns",
                HttpMethod.POST,
                withToken(facilitatorToken, body),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ─── Public endpoints ─────────────────────────────────────────────────

    @Test
    @DisplayName("Login endpoint is public — no token required")
    void loginEndpoint_ShouldBePublic() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/login",
                Map.of("email", "nobody@auca.ac.rw", "password", "wrong"),
                Map.class);

        // 401 means the endpoint was reached (bad credentials), not 403 (blocked by security)
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("Forgot password endpoint is public — no token required")
    void forgotPasswordEndpoint_ShouldBePublic() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/auth/forgot-password",
                Map.of("email", "nobody@auca.ac.rw"),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ─── Tampered token ───────────────────────────────────────────────────

    @Test
    @DisplayName("Tampered JWT signature returns 403")
    void tamperedToken_ShouldReturn403() {
        String tampered = adminToken.substring(0, adminToken.length() - 5) + "XXXXX";

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/students",
                HttpMethod.GET,
                withToken(tampered, null),
                Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private String tokenFor(String email, Role role) {
        User user = userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Security Test " + role)
                        .email(email)
                        .password(passwordEncoder.encode("Admin@1234"))
                        .role(role)
                        .build()));
        return jwtService.generateToken(user);
    }

    private HttpEntity<?> withToken(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }

    private void assertUnauthorizedOrForbidden(HttpMethod method, String url, Object body) {
        ResponseEntity<Map> resp = restTemplate.exchange(url, method,
                new HttpEntity<>(body, new HttpHeaders()), Map.class);
        assertThat(resp.getStatusCode())
                .as("Expected 401 or 403 for %s %s without token", method, url)
                .isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }
}
