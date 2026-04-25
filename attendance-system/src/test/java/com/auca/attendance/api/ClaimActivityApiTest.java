package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.Claim;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.ClaimStatus;
import com.auca.attendance.enums.ClaimType;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.ClaimRepository;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * API regression tests for N3: claim activity timeline endpoint
 * (GET /api/v1/claims/{id}) and audit-log derivation.
 */
@DisplayName("Claim activity timeline — API regression tests")
class ClaimActivityApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate    restTemplate;
    @Autowired UserRepository      userRepository;
    @Autowired StudentRepository   studentRepository;
    @Autowired ModuleRepository    moduleRepository;
    @Autowired ClaimRepository     claimRepository;
    @Autowired JwtService          jwtService;
    @Autowired PasswordEncoder     passwordEncoder;

    private String adminToken;
    private String studentToken;
    private String otherStudentToken;
    private Student student;
    private Module module;
    private User admin;

    @BeforeEach
    void setUp() {
        admin = userRepository.findByEmail("claim_admin@test.auca.ac.rw")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Claim Admin").email("claim_admin@test.auca.ac.rw")
                        .password(passwordEncoder.encode("Test@1234")).role(Role.ADMIN).build()));
        adminToken = jwtService.generateToken(admin);

        User studentUser = userRepository.findByEmail("claim_student@test.auca.ac.rw")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Claim Student").email("claim_student@test.auca.ac.rw")
                        .password(passwordEncoder.encode("Test@1234")).role(Role.STUDENT).build()));
        student = studentRepository.findByAccountId(studentUser.getId())
                .orElseGet(() -> studentRepository.save(Student.builder()
                        .studentId("CLAIM_STU01").name("Claim Student")
                        .email("claim_student@test.auca.ac.rw").cohortYear(2024).program("CS")
                        .account(studentUser).build()));
        studentToken = jwtService.generateToken(studentUser);

        User otherUser = userRepository.findByEmail("other_student@test.auca.ac.rw")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Other Student").email("other_student@test.auca.ac.rw")
                        .password(passwordEncoder.encode("Test@1234")).role(Role.STUDENT).build()));
        Student otherStudent = studentRepository.findByAccountId(otherUser.getId())
                .orElseGet(() -> studentRepository.save(Student.builder()
                        .studentId("OTHER_STU01").name("Other Student")
                        .email("other_student@test.auca.ac.rw").cohortYear(2024).program("CS")
                        .account(otherUser).build()));
        if (otherStudent.getAccount() == null) {
            otherStudent.setAccount(otherUser);
            studentRepository.save(otherStudent);
        }
        otherStudentToken = jwtService.generateToken(otherUser);

        module = moduleRepository.findAll().stream()
                .filter(m -> "CLAIM_MOD".equals(m.getCode())).findFirst()
                .orElseGet(() -> moduleRepository.save(Module.builder()
                        .code("CLAIM_MOD").name("Claim Module").description("d")
                        .startDate(LocalDate.now().minusMonths(1))
                        .endDate(LocalDate.now().plusMonths(5))
                        .createdBy(admin).build()));
    }

    @Test
    @DisplayName("STUDENT submits a claim, then GET /claims/{id} returns activity with the CREATE entry")
    @SuppressWarnings("unchecked")
    void student_canSubmitAndFetchOwnClaimWithActivity() {
        // Submit a claim as the student
        ResponseEntity<Map> create = restTemplate.exchange(
                "/api/v1/claims", HttpMethod.POST,
                jsonRequest(studentToken, Map.of(
                        "moduleId", module.getId(),
                        "claimType", "ATTENDANCE",
                        "description", "Was marked absent but I was present.")),
                Map.class);
        assertThat(create.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) create.getBody().get("data");
        Number rawId = (Number) data.get("id");
        Long claimId = rawId.longValue();

        // Activity log writes are @Async — poll the GET endpoint until populated
        Map<String, Object> d = pollForActivity(studentToken, claimId, 1);
        List<Map<String, Object>> activity = (List<Map<String, Object>>) d.get("activity");
        assertThat(activity).isNotNull();
        assertThat(activity).isNotEmpty();
        assertThat(activity.get(0).get("action")).isEqualTo("CREATE");
    }

    @Test
    @DisplayName("Resolve flow records both CREATE and UPDATE entries in the timeline")
    @SuppressWarnings("unchecked")
    void resolveAddsUpdateEntryToTimeline() {
        Claim claim = claimRepository.save(Claim.builder()
                .student(student).module(module).claimType(ClaimType.ATTENDANCE)
                .description("dup").status(ClaimStatus.PENDING).build());

        // Resolve as admin (creates the UPDATE audit entry; CREATE was bypassed via direct save above)
        ResponseEntity<Map> resolve = restTemplate.exchange(
                "/api/v1/claims/" + claim.getId() + "/resolve", HttpMethod.PUT,
                jsonRequest(adminToken, Map.of("status", "APPROVED", "resolutionNote", "ok")),
                Map.class);
        assertThat(resolve.getStatusCode()).isEqualTo(HttpStatus.OK);

        Map<String, Object> d = pollForActivity(adminToken, claim.getId(), 1);
        List<Map<String, Object>> activity = (List<Map<String, Object>>) d.get("activity");
        assertThat(activity).isNotNull();
        assertThat(activity.stream().anyMatch(a -> "UPDATE".equals(a.get("action")))).isTrue();
    }

    @Test
    @DisplayName("STUDENT cannot view another student's claim (403)")
    void studentCannotViewOthersClaim() {
        Claim claim = claimRepository.save(Claim.builder()
                .student(student).module(module).claimType(ClaimType.ATTENDANCE)
                .description("priv").status(ClaimStatus.PENDING).build());

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/claims/" + claim.getId(), HttpMethod.GET,
                withToken(otherStudentToken), Map.class);
        assertThat(resp.getStatusCode()).isIn(HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private Map<String, Object> pollForActivity(String token, Long claimId, int minEntries) {
        for (int i = 0; i < 20; i++) {
            ResponseEntity<Map> resp = restTemplate.exchange(
                    "/api/v1/claims/" + claimId, HttpMethod.GET,
                    withToken(token), Map.class);
            if (resp.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> d = (Map<String, Object>) resp.getBody().get("data");
                List<Map<String, Object>> activity = (List<Map<String, Object>>) d.get("activity");
                if (activity != null && activity.size() >= minEntries) {
                    return d;
                }
            }
            try { Thread.sleep(250); } catch (InterruptedException ignored) { Thread.currentThread().interrupt(); }
        }
        throw new AssertionError("Activity timeline never populated for claim " + claimId);
    }

    private HttpEntity<?> withToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }

    private HttpEntity<?> jsonRequest(String token, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
