package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.AttendanceSessionRepository;
import com.auca.attendance.repository.EnrollmentRepository;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Regression tests for the enrollment + attendance integration.
 * Guards against: unenrolled students being marked present,
 * enrollment endpoints being accessible by wrong roles.
 */
@DisplayName("Attendance + Enrollment — regression tests")
class AttendanceEnrollmentRegressionTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired ModuleRepository moduleRepository;
    @Autowired AttendanceSessionRepository sessionRepository;
    @Autowired EnrollmentRepository enrollmentRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private String adminToken;
    private String facilitatorToken;
    private Student student;
    private Module module;
    private AttendanceSession session;

    @BeforeEach
    void setUp() {
        User admin = seedUser("enroll_admin@auca.ac.rw", Role.ADMIN);
        User facilitator = seedUser("enroll_facilitator@auca.ac.rw", Role.FACILITATOR);
        adminToken       = jwtService.generateToken(admin);
        facilitatorToken = jwtService.generateToken(facilitator);

        student = studentRepository.findAll().stream()
                .filter(s -> "ENROLL_STU001".equals(s.getStudentId()))
                .findFirst()
                .orElseGet(() -> studentRepository.save(Student.builder()
                        .studentId("ENROLL_STU001").name("Enrollment Test Student")
                        .email("enroll_student@auca.ac.rw").cohortYear(2024).program("CS")
                        .build()));

        final User finalFacilitator = facilitator;
        module = moduleRepository.findAll().stream()
                .filter(m -> "ENROLL_CS101".equals(m.getCode()))
                .findFirst()
                .orElseGet(() -> moduleRepository.save(Module.builder()
                        .code("ENROLL_CS101").name("Enrollment Test Module").description("d")
                        .startDate(LocalDate.now().minusMonths(1))
                        .endDate(LocalDate.now().plusMonths(5))
                        .createdBy(finalFacilitator)
                        .build()));

        session = sessionRepository.save(AttendanceSession.builder()
                .module(module)
                .sessionDate(LocalDate.now())
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .period("MORNING")
                .createdBy(facilitator)
                .build());
    }

    // ─── Enrollment endpoint access ───────────────────────────────────────

    @Test
    @DisplayName("ADMIN can enroll students in a module")
    void admin_CanEnrollStudents() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/modules/" + module.getId() + "/enrollments",
                HttpMethod.POST,
                withToken(adminToken, Map.of("studentIds", List.of(student.getId()))),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("FACILITATOR cannot enroll students (ADMIN only) — must return 403")
    void facilitator_CannotEnrollStudents() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/modules/" + module.getId() + "/enrollments",
                HttpMethod.POST,
                withToken(facilitatorToken, Map.of("studentIds", List.of(student.getId()))),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("FACILITATOR can view module enrollments")
    void facilitator_CanViewEnrollments() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/modules/" + module.getId() + "/enrollments",
                HttpMethod.GET,
                withToken(facilitatorToken, null),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ─── Attendance + enrollment enforcement ──────────────────────────────

    @Test
    @DisplayName("Submitting attendance for an UNENROLLED student returns 409")
    void submitAttendance_ShouldReturn409_WhenStudentNotEnrolled() {
        // Ensure student is NOT enrolled
        enrollmentRepository.deleteByStudentIdAndModuleId(student.getId(), module.getId());

        // Controller expects a plain JSON array — NOT wrapped in {"records": [...]}
        List<Map<String, Object>> records = List.of(Map.of(
                "studentId", student.getId(),
                "status", "PRESENT",
                "notes", ""));

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/sessions/" + session.getId() + "/records",
                HttpMethod.POST,
                withToken(facilitatorToken, records),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @DisplayName("Submitting attendance for an ENROLLED student returns 200")
    void submitAttendance_ShouldReturn200_WhenStudentIsEnrolled() {
        // Enroll first (guard against duplicate enrollment from parallel test runs)
        if (!enrollmentRepository.existsByStudentIdAndModuleId(student.getId(), module.getId())) {
            enrollmentRepository.save(Enrollment.builder()
                    .student(student).module(module).build());
        }

        // Controller expects a plain JSON array — NOT wrapped in {"records": [...]}
        List<Map<String, Object>> records = List.of(Map.of(
                "studentId", student.getId(),
                "status", "PRESENT",
                "notes", ""));

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/sessions/" + session.getId() + "/records",
                HttpMethod.POST,
                withToken(facilitatorToken, records),
                Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    private User seedUser(String email, Role role) {
        return userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Test " + role)
                        .email(email)
                        .password(passwordEncoder.encode("Admin@1234"))
                        .role(role)
                        .build()));
    }

    private HttpEntity<?> withToken(String token, Object body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(body, headers);
    }
}
