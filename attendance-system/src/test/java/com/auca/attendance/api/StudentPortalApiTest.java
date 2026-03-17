package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * API regression tests for the Student self-service portal (/api/v1/me/**).
 * Verifies data isolation, role enforcement, and correct data return.
 */
@DisplayName("Student Portal — API regression tests")
class StudentPortalApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate         restTemplate;
    @Autowired UserRepository           userRepository;
    @Autowired StudentRepository        studentRepository;
    @Autowired ModuleRepository         moduleRepository;
    @Autowired EnrollmentRepository     enrollmentRepository;
    @Autowired AttendanceSessionRepository sessionRepository;
    @Autowired AttendanceRecordRepository  recordRepository;
    @Autowired JwtService               jwtService;
    @Autowired PasswordEncoder          passwordEncoder;

    private String studentToken;
    private String adminToken;
    private Student student;
    private Module module;

    @BeforeEach
    void setUp() {
        // Create student user account
        User studentUser = userRepository.findByEmail("portal_student@test.auca.ac.rw")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Portal Student")
                        .email("portal_student@test.auca.ac.rw")
                        .password(passwordEncoder.encode("Test@1234"))
                        .role(Role.STUDENT)
                        .build()));

        // Create linked student profile
        student = studentRepository.findByAccountId(studentUser.getId())
                .orElseGet(() -> {
                    Student s = studentRepository.findAll().stream()
                            .filter(st -> "PORTAL_STU001".equals(st.getStudentId()))
                            .findFirst()
                            .orElseGet(() -> studentRepository.save(Student.builder()
                                    .studentId("PORTAL_STU001")
                                    .name("Portal Student")
                                    .email("portal_student@test.auca.ac.rw")
                                    .cohortYear(2024)
                                    .program("Computer Science")
                                    .account(studentUser)
                                    .build()));
                    return s;
                });

        // Ensure account link is set
        if (student.getAccount() == null || !student.getAccount().getId().equals(studentUser.getId())) {
            student.setAccount(studentUser);
            student = studentRepository.save(student);
        }

        studentToken = jwtService.generateToken(studentUser);

        // Admin user for role-isolation tests
        User admin = userRepository.findByEmail("portal_admin@test.auca.ac.rw")
                .orElseGet(() -> userRepository.save(User.builder()
                        .name("Portal Admin")
                        .email("portal_admin@test.auca.ac.rw")
                        .password(passwordEncoder.encode("Test@1234"))
                        .role(Role.ADMIN)
                        .build()));
        adminToken = jwtService.generateToken(admin);

        // Create a module and enroll the student
        module = moduleRepository.findAll().stream()
                .filter(m -> "PORTAL_CS101".equals(m.getCode()))
                .findFirst()
                .orElseGet(() -> moduleRepository.save(Module.builder()
                        .code("PORTAL_CS101")
                        .name("Portal Test Module")
                        .description("d")
                        .startDate(LocalDate.now().minusMonths(1))
                        .endDate(LocalDate.now().plusMonths(5))
                        .createdBy(admin)
                        .build()));

        boolean alreadyEnrolled = enrollmentRepository.existsByStudentIdAndModuleId(
                student.getId(), module.getId());
        if (!alreadyEnrolled) {
            enrollmentRepository.save(Enrollment.builder()
                    .student(student)
                    .module(module)
                    .build());
        }

        // Add an attendance session and record
        AttendanceSession session = sessionRepository.save(AttendanceSession.builder()
                .module(module)
                .sessionDate(LocalDate.now().minusDays(2))
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .period("MORNING")
                .createdBy(admin)
                .build());

        recordRepository.save(AttendanceRecord.builder()
                .session(session)
                .student(student)
                .status("PRESENT")
                .consecutiveAbsentFlag(false)
                .build());
    }

    // ─── Profile ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/profile returns 200 with the student's own profile")
    void getProfile_ShouldReturn200() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/profile", HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data.get("studentId")).isEqualTo("PORTAL_STU001");
        assertThat(data.get("name")).isEqualTo("Portal Student");
    }

    @Test
    @DisplayName("GET /me/profile returns 403 when called by ADMIN (not STUDENT role)")
    void getProfile_ShouldReturn403_ForAdmin() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/profile", HttpMethod.GET, withToken(adminToken), Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.FORBIDDEN, HttpStatus.UNAUTHORIZED);
    }

    @Test
    @DisplayName("GET /me/profile returns 401 when unauthenticated")
    void getProfile_ShouldReturn401_WhenNoToken() {
        ResponseEntity<Map> resp = restTemplate.getForEntity("/api/v1/me/profile", Map.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ─── Modules ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/modules returns the student's enrolled modules")
    void getMyModules_ShouldReturnEnrolledModules() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/modules", HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) resp.getBody().get("data");
        assertThat(data).isNotEmpty();
        assertThat(data.stream().anyMatch(m -> "Portal Test Module".equals(m.get("moduleName")))).isTrue();
    }

    // ─── Attendance ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/attendance returns attendance records for the student")
    void getMyAttendance_ShouldReturnRecords() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/attendance", HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) resp.getBody().get("data");
        assertThat(data).isNotEmpty();
        assertThat(data.get(0).get("status")).isEqualTo("PRESENT");
    }

    @Test
    @DisplayName("GET /me/attendance/{moduleId} returns filtered records for that module")
    void getMyAttendanceForModule_ShouldReturnFilteredRecords() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/attendance/" + module.getId(),
                HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<?> data = (List<?>) resp.getBody().get("data");
        assertThat(data).isNotEmpty();
    }

    @Test
    @DisplayName("GET /me/attendance/{moduleId} returns 404 when student not enrolled in that module")
    void getMyAttendanceForModule_ShouldReturn404_WhenNotEnrolled() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/attendance/999999",
                HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    // ─── Absence summary ─────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/absence-summary returns per-module absence stats")
    void getAbsenceSummary_ShouldReturnStats() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/absence-summary", HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) resp.getBody().get("data");
        assertThat(data).isNotEmpty();
        assertThat(data.get(0)).containsKeys("moduleId", "absencePercent", "threshold", "thresholdExceeded");
    }

    // ─── Marks ───────────────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /me/marks returns 200 (empty list when no marks entered yet)")
    void getMyMarks_ShouldReturn200() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/me/marks", HttpMethod.GET, withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody().get("data")).isNotNull();
    }

    // ─── Helper ──────────────────────────────────────────────────────────────

    private HttpEntity<?> withToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        return new HttpEntity<>(headers);
    }
}
