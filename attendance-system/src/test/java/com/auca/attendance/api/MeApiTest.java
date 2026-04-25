package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.User;
import com.auca.attendance.entity.UserPreferences;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.UserPreferencesRepository;
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
 * API regression tests for the /me/* endpoints (password change + notification preferences).
 */
@DisplayName("Me — API regression tests")
class MeApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate           restTemplate;
    @Autowired UserRepository             userRepository;
    @Autowired UserPreferencesRepository  preferencesRepository;
    @Autowired JwtService                 jwtService;
    @Autowired PasswordEncoder            passwordEncoder;

    private User user;
    private String accessToken;
    private static final String INITIAL_PW = "Admin@1234";

    @BeforeEach
    void setUp() {
        user = userRepository.findByEmail("me_test@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Me Test User")
                        .email("me_test@auca.ac.rw")
                        .password(passwordEncoder.encode(INITIAL_PW))
                        .role(Role.FACILITATOR)
                        .build()));
        // Always reset to the known initial password between tests
        user.setPassword(passwordEncoder.encode(INITIAL_PW));
        user = userRepository.save(user);

        // Wipe any preferences row so each test starts from a known state
        preferencesRepository.findByUserId(user.getId()).ifPresent(preferencesRepository::delete);

        accessToken = jwtService.generateToken(user);
    }

    // ─── /me/password ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /me/password with correct current + valid new password returns 200")
    void changePassword_HappyPath() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/password",
                HttpMethod.POST,
                withToken(accessToken, Map.of(
                        "currentPassword", INITIAL_PW,
                        "newPassword", "NewPass@9876")),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);

        User refreshed = userRepository.findById(user.getId()).orElseThrow();
        assertThat(passwordEncoder.matches("NewPass@9876", refreshed.getPassword())).isTrue();
    }

    @Test
    @DisplayName("POST /me/password with wrong current password returns 401")
    void changePassword_WrongCurrent_Returns401() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/password",
                HttpMethod.POST,
                withToken(accessToken, Map.of(
                        "currentPassword", "WrongPass1!",
                        "newPassword", "NewPass@9876")),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("POST /me/password with short new password returns 400")
    void changePassword_ShortNew_Returns400() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/password",
                HttpMethod.POST,
                withToken(accessToken, Map.of(
                        "currentPassword", INITIAL_PW,
                        "newPassword", "short")),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("POST /me/password with no auth returns 401/403")
    void changePassword_NoAuth_Returns401() {
        ResponseEntity<Map> resp = restTemplate.postForEntity(
                "/api/v1/me/password",
                Map.of("currentPassword", INITIAL_PW, "newPassword", "NewPass@9876"),
                Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    // ─── /me/preferences ─────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/preferences first call returns defaults and persists them")
    @SuppressWarnings("unchecked")
    void getPreferences_FirstTime_ReturnsDefaultsAndPersists() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/preferences",
                HttpMethod.GET,
                withToken(accessToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("emailEnabled")).isEqualTo(true);
        assertThat(data.get("pushEnabled")).isEqualTo(true);
        assertThat(data.get("notifyAttendance")).isEqualTo(true);
        assertThat(data.get("notifyMarks")).isEqualTo(true);
        assertThat(data.get("notifyDns")).isEqualTo(true);
        assertThat(data.get("notifyClaims")).isEqualTo(true);
        assertThat(data.get("notifySystem")).isEqualTo(true);

        // Row was created
        assertThat(preferencesRepository.findByUserId(user.getId())).isPresent();
    }

    @Test
    @DisplayName("GET /me/preferences subsequent call returns previously saved values")
    @SuppressWarnings("unchecked")
    void getPreferences_AfterUpdate_ReturnsSavedValues() {
        // Pre-seed with a known custom set of values
        preferencesRepository.save(UserPreferences.builder()
                .userId(user.getId())
                .emailEnabled(false)
                .pushEnabled(true)
                .notifyAttendance(false)
                .notifyMarks(true)
                .notifyDns(false)
                .notifyClaims(true)
                .notifySystem(false)
                .build());

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/preferences",
                HttpMethod.GET,
                withToken(accessToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("emailEnabled")).isEqualTo(false);
        assertThat(data.get("notifyAttendance")).isEqualTo(false);
        assertThat(data.get("notifyDns")).isEqualTo(false);
        assertThat(data.get("notifySystem")).isEqualTo(false);
        assertThat(data.get("pushEnabled")).isEqualTo(true);
    }

    @Test
    @DisplayName("PATCH /me/preferences updates fields and persists")
    @SuppressWarnings("unchecked")
    void updatePreferences_PersistsChanges() {
        Map<String, Object> body = Map.of(
                "emailEnabled",     false,
                "pushEnabled",      false,
                "notifyAttendance", false,
                "notifyMarks",      false,
                "notifyDns",        true,
                "notifyClaims",     true,
                "notifySystem",     false);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/preferences",
                HttpMethod.PATCH,
                withToken(accessToken, body),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("emailEnabled")).isEqualTo(false);
        assertThat(data.get("notifyDns")).isEqualTo(true);

        UserPreferences saved = preferencesRepository.findByUserId(user.getId()).orElseThrow();
        assertThat(saved.getEmailEnabled()).isFalse();
        assertThat(saved.getPushEnabled()).isFalse();
        assertThat(saved.getNotifyAttendance()).isFalse();
        assertThat(saved.getNotifyMarks()).isFalse();
        assertThat(saved.getNotifyDns()).isTrue();
        assertThat(saved.getNotifyClaims()).isTrue();
        assertThat(saved.getNotifySystem()).isFalse();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private HttpEntity<?> withToken(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
