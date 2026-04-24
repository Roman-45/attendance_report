package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.*;
import com.auca.attendance.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Invitation API — integration tests")
class InvitationApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired ModuleRepository moduleRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String PASSWORD = "Admin@1234";

    private String adminToken;
    private User adminUser;
    private com.auca.attendance.entity.Module module;
    private Team team;

    @BeforeEach
    void setup() {
        adminUser = userRepository.findByEmail("inv_admin@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Inv Admin")
                        .email("inv_admin@auca.ac.rw")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.ADMIN)
                        .build()));
        adminToken = jwtService.generateToken(adminUser);

        module = moduleRepository.findByCode("CSINV100").orElseGet(() ->
                moduleRepository.save(com.auca.attendance.entity.Module.builder()
                        .code("CSINV100")
                        .name("Invitation Test Module")
                        .description("Module for invitation tests")
                        .startDate(LocalDate.now().minusMonths(1))
                        .endDate(LocalDate.now().plusMonths(5))
                        .createdBy(adminUser)
                        .build()));

        if (!teamRepository.existsByModuleIdAndName(module.getId(), "Inv Test Team")) {
            team = teamRepository.save(Team.builder()
                    .module(module)
                    .name("Inv Test Team")
                    .build());
        } else {
            team = teamRepository.findByModuleId(module.getId()).stream()
                    .filter(t -> "Inv Test Team".equals(t.getName()))
                    .findFirst().orElseThrow();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Admin: Invite Team Leader
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Admin can invite a team leader — returns 201 with user summary")
    @SuppressWarnings("unchecked")
    void inviteTeamLeader_ShouldReturn201() {
        String uniqueEmail = "inv_leader_" + System.currentTimeMillis() + "@auca.ac.rw";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "name", "Test Leader",
                "email", uniqueEmail,
                "registrationNumber", "INV" + System.currentTimeMillis(),
                "teamId", team.getId()
        );

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/admin/users/invite-team-leader",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
        assertThat(data.get("email")).isEqualTo(uniqueEmail);
        assertThat(data.get("role")).isEqualTo("TEAM_LEADER");
    }

    @Test
    @DisplayName("Duplicate email — returns 409 Conflict")
    void inviteTeamLeader_ShouldReturn409_ForDuplicateEmail() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(adminToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "name", "Dup Leader",
                "email", adminUser.getEmail(), // already exists
                "registrationNumber", "REGDUP001",
                "teamId", team.getId()
        );

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/admin/users/invite-team-leader",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Non-admin cannot invite team leader — returns 403")
    void inviteTeamLeader_ShouldReturn403_ForNonAdmin() {
        User student = userRepository.findByEmail("inv_student@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Inv Student")
                        .email("inv_student@auca.ac.rw")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.STUDENT)
                        .build()));
        String studentToken = jwtService.generateToken(student);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(studentToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "name", "No Access Leader",
                "email", "inv_noaccess@auca.ac.rw",
                "registrationNumber", "REGNA001",
                "teamId", team.getId()
        );

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/admin/users/invite-team-leader",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Accept Invitation
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Accept invitation with valid token — returns 200 with auth tokens")
    @SuppressWarnings("unchecked")
    void acceptInvitation_ShouldReturn200_WithAuthTokens() {
        // First, create an invited user directly
        String token = "test-invite-token-" + System.currentTimeMillis();
        User invited = userRepository.save(User.builder()
                .name("Invited Leader")
                .email("inv_accept_" + System.currentTimeMillis() + "@auca.ac.rw")
                .password(passwordEncoder.encode("placeholder"))
                .role(Role.TEAM_LEADER)
                .emailVerified(false)
                .invitationToken(token)
                .active(true)
                .build());

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
                "token", token,
                "password", "NewPass@1234"
        );

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/accept-invitation",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
        assertThat(data.get("token")).isNotNull(); // JWT access token
        assertThat(data.get("email")).isEqualTo(invited.getEmail());
        assertThat(data.get("role")).isEqualTo("TEAM_LEADER");

        // Verify the token is consumed (one-time use)
        User updated = userRepository.findById(invited.getId()).orElseThrow();
        assertThat(updated.getInvitationToken()).isNull();
        assertThat(updated.getEmailVerified()).isTrue();
    }

    @Test
    @DisplayName("Accept invitation with invalid token — returns 404")
    void acceptInvitation_ShouldReturn404_ForInvalidToken() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, String> body = Map.of(
                "token", "nonexistent-token-xyz",
                "password", "NewPass@1234"
        );

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/accept-invitation",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Validate Invitation Token
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Validate valid invitation token — returns 200 with user info")
    @SuppressWarnings("unchecked")
    void validateInvitation_ShouldReturn200_ForValidToken() {
        String token = "test-validate-token-" + System.currentTimeMillis();
        User invited = userRepository.save(User.builder()
                .name("Validate Leader")
                .email("inv_validate_" + System.currentTimeMillis() + "@auca.ac.rw")
                .password(passwordEncoder.encode("placeholder"))
                .role(Role.TEAM_LEADER)
                .emailVerified(false)
                .invitationToken(token)
                .active(true)
                .build());

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/invitation?token=" + token,
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, String> data = (Map<String, String>) resp.getBody().get("data");
        assertThat(data.get("name")).isEqualTo("Validate Leader");
        assertThat(data.get("role")).isEqualTo("TEAM_LEADER");
    }

    @Test
    @DisplayName("Validate invalid token — returns 404")
    void validateInvitation_ShouldReturn404_ForInvalidToken() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/auth/invitation?token=bad-token",
                HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
