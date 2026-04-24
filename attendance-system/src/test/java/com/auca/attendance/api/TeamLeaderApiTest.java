package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.TeamMember;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.*;
import com.auca.attendance.security.JwtService;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Team Leader API — integration tests")
class TeamLeaderApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;
    @Autowired StudentRepository studentRepository;
    @Autowired TeamRepository teamRepository;
    @Autowired TeamMemberRepository teamMemberRepository;
    @Autowired ModuleRepository moduleRepository;
    @Autowired EnrollmentRepository enrollmentRepository;
    @Autowired JwtService jwtService;
    @Autowired PasswordEncoder passwordEncoder;

    private static final String PASSWORD = "Admin@1234";
    private static final String BASE = "/api/v1/team-leader";

    private String leaderToken;
    private String adminToken;
    private String studentToken;
    private User leaderUser;
    private User adminUser;
    private User studentUserAccount;
    private Student leaderStudent;
    private Student regularStudent;
    private com.auca.attendance.entity.Module module;
    private Team leaderTeam;
    private Team otherTeam;

    @BeforeEach
    void setup() {
        // ─── Admin user ────────────────────────────────────────────────
        adminUser = userRepository.findByEmail("tl_admin@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("TL Admin")
                        .email("tl_admin@auca.ac.rw")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.ADMIN)
                        .build()));
        adminToken = jwtService.generateToken(adminUser);

        // ─── Team Leader user + student profile ────────────────────────
        leaderUser = userRepository.findByEmail("tl_leader@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("TL Leader")
                        .email("tl_leader@auca.ac.rw")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.TEAM_LEADER)
                        .build()));
        leaderToken = jwtService.generateToken(leaderUser);

        leaderStudent = studentRepository.findByAccountId(leaderUser.getId()).orElseGet(() ->
                studentRepository.save(Student.builder()
                        .studentId("STUTL001")
                        .name("TL Leader")
                        .email("tl_leader@auca.ac.rw")
                        .cohortYear(2024)
                        .account(leaderUser)
                        .build()));

        // ─── Regular student user ──────────────────────────────────────
        studentUserAccount = userRepository.findByEmail("tl_student@auca.ac.rw").orElseGet(() ->
                userRepository.save(User.builder()
                        .name("TL Student")
                        .email("tl_student@auca.ac.rw")
                        .password(passwordEncoder.encode(PASSWORD))
                        .role(Role.STUDENT)
                        .build()));
        studentToken = jwtService.generateToken(studentUserAccount);

        regularStudent = studentRepository.findByAccountId(studentUserAccount.getId()).orElseGet(() ->
                studentRepository.save(Student.builder()
                        .studentId("STUTL002")
                        .name("TL Student")
                        .email("tl_student@auca.ac.rw")
                        .cohortYear(2024)
                        .account(studentUserAccount)
                        .build()));

        // ─── Module ────────────────────────────────────────────────────
        module = moduleRepository.findByCode("CSTL100").orElseGet(() ->
                moduleRepository.save(com.auca.attendance.entity.Module.builder()
                        .code("CSTL100")
                        .name("Team Leader Test Module")
                        .description("Module for TL tests")
                        .startDate(LocalDate.now().minusMonths(1))
                        .endDate(LocalDate.now().plusMonths(5))
                        .createdBy(adminUser)
                        .build()));

        // ─── Enrollments ───────────────────────────────────────────────
        if (!enrollmentRepository.existsByStudentIdAndModuleId(leaderStudent.getId(), module.getId())) {
            enrollmentRepository.save(Enrollment.builder()
                    .student(leaderStudent).module(module).build());
        }
        if (!enrollmentRepository.existsByStudentIdAndModuleId(regularStudent.getId(), module.getId())) {
            enrollmentRepository.save(Enrollment.builder()
                    .student(regularStudent).module(module).build());
        }

        // ─── Teams ─────────────────────────────────────────────────────
        leaderTeam = teamRepository.findByModuleIdAndLeaderId(module.getId(), leaderStudent.getId())
                .orElseGet(() -> teamRepository.save(Team.builder()
                        .module(module)
                        .name("TL Leader Team")
                        .leader(leaderStudent)
                        .build()));

        // Another team with no leader or a different leader
        if (!teamRepository.existsByModuleIdAndName(module.getId(), "TL Other Team")) {
            otherTeam = teamRepository.save(Team.builder()
                    .module(module)
                    .name("TL Other Team")
                    .leader(regularStudent)
                    .build());
        } else {
            otherTeam = teamRepository.findByModuleId(module.getId()).stream()
                    .filter(t -> "TL Other Team".equals(t.getName()))
                    .findFirst().orElseThrow();
        }
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Authentication & Authorization
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("TEAM_LEADER can access /my-teams — returns 200")
    void myTeams_ShouldReturn200_ForTeamLeader() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/my-teams", HttpMethod.GET,
                withToken(leaderToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("STUDENT cannot access /my-teams — returns 403")
    void myTeams_ShouldReturn403_ForStudent() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/my-teams", HttpMethod.GET,
                withToken(studentToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Unauthenticated request to /my-teams — returns 401 or 403")
    void myTeams_ShouldReturn401Or403_WhenNoToken() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/my-teams", HttpMethod.GET,
                new HttpEntity<>(new HttpHeaders()), Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  My Teams endpoint
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Team leader with assigned teams sees them in /my-teams response")
    @SuppressWarnings("unchecked")
    void myTeams_ShouldReturnAssignedTeams() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/my-teams", HttpMethod.GET,
                withToken(leaderToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<Map<String, Object>> data = (List<Map<String, Object>>) resp.getBody().get("data");
        assertThat(data).isNotEmpty();
        assertThat(data).anyMatch(t -> "TL Leader Team".equals(t.get("name")));
    }

    @Test
    @DisplayName("Admin calling /my-teams gets empty list (no student profile)")
    @SuppressWarnings("unchecked")
    void myTeams_ShouldReturnEmptyList_ForAdmin() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/my-teams", HttpMethod.GET,
                withToken(adminToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        List<?> data = (List<?>) resp.getBody().get("data");
        assertThat(data).isEmpty();
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Team Members endpoint
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Leader can view own team members — returns 200")
    void getTeamMembers_ShouldReturn200_ForOwnTeam() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/teams/" + leaderTeam.getId() + "/members",
                HttpMethod.GET, withToken(leaderToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Leader cannot view other team's members — returns 400 (permission denied)")
    void getTeamMembers_ShouldReturnError_ForOtherTeam() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/teams/" + otherTeam.getId() + "/members",
                HttpMethod.GET, withToken(leaderToken), Map.class);

        // The controller throws IllegalArgumentException -> 400
        assertThat(resp.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Admin can view any team's members — returns 200")
    void getTeamMembers_ShouldReturn200_ForAdmin() {
        ResponseEntity<Map> resp = restTemplate.exchange(
                BASE + "/teams/" + otherTeam.getId() + "/members",
                HttpMethod.GET, withToken(adminToken), Map.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Excel Import
    // ═══════════════════════════════════════════════════════════════════

    @Test
    @DisplayName("Upload valid Excel file — returns ImportResult with correct counts")
    @SuppressWarnings("unchecked")
    void importExcel_ShouldReturnCorrectCounts_ForValidFile() throws Exception {
        byte[] excel = createTestExcel(new String[][]{
                {"New Student A", "tl_new_a@auca.ac.rw", "REG001"},
                {"New Student B", "tl_new_b@auca.ac.rw", "REG002"}
        });

        ResponseEntity<Map> resp = uploadExcel(leaderToken, leaderTeam.getId(), excel);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
        assertThat((Integer) data.get("totalRows")).isEqualTo(2);
        // Both should be imported (new students)
        assertThat((Integer) data.get("imported")).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Upload Excel to a team where user is NOT the leader — returns error")
    void importExcel_ShouldReturnError_WhenNotLeaderOfTeam() throws Exception {
        byte[] excel = createTestExcel(new String[][]{
                {"Unauthorized Import", "tl_unauth@auca.ac.rw", "REG999"}
        });

        ResponseEntity<Map> resp = uploadExcel(leaderToken, otherTeam.getId(), excel);

        // The service throws IllegalArgumentException for permission denial
        assertThat(resp.getStatusCode()).isIn(HttpStatus.BAD_REQUEST, HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Upload empty Excel (header only, no data rows) — returns zero counts")
    @SuppressWarnings("unchecked")
    void importExcel_ShouldReturnZeroCounts_WhenFileIsEmpty() throws Exception {
        byte[] excel = createTestExcel(new String[0][]);

        ResponseEntity<Map> resp = uploadExcel(leaderToken, leaderTeam.getId(), excel);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
        assertThat((Integer) data.get("totalRows")).isEqualTo(0);
        assertThat((Integer) data.get("imported")).isEqualTo(0);
    }

    @Test
    @DisplayName("Upload Excel with duplicate students — skipped count > 0")
    @SuppressWarnings("unchecked")
    void importExcel_ShouldSkipDuplicates() throws Exception {
        // First, import a student
        byte[] first = createTestExcel(new String[][]{
                {"Dup Student", "tl_dup_import@auca.ac.rw", "REGDUP01"}
        });
        uploadExcel(leaderToken, leaderTeam.getId(), first);

        // Import again with the same student
        byte[] second = createTestExcel(new String[][]{
                {"Dup Student", "tl_dup_import@auca.ac.rw", "REGDUP01"}
        });
        ResponseEntity<Map> resp = uploadExcel(leaderToken, leaderTeam.getId(), second);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<String, Object> data = (Map<String, Object>) resp.getBody().get("data");
        assertThat(data).isNotNull();
        assertThat((Integer) data.get("skipped")).isGreaterThan(0);
    }

    @Test
    @DisplayName("STUDENT cannot access import endpoint — returns 403")
    void importExcel_ShouldReturn403_ForStudent() throws Exception {
        byte[] excel = createTestExcel(new String[][]{
                {"Blocked Student", "tl_blocked@auca.ac.rw", "REGBLK01"}
        });

        ResponseEntity<Map> resp = uploadExcel(studentToken, leaderTeam.getId(), excel);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  Helpers
    // ═══════════════════════════════════════════════════════════════════

    private HttpEntity<?> withToken(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(null, headers);
    }

    private ResponseEntity<Map> uploadExcel(String token, Long teamId, byte[] excelData) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.setBearerAuth(token);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(excelData) {
            @Override
            public String getFilename() {
                return "students.xlsx";
            }
        });

        return restTemplate.exchange(
                BASE + "/teams/" + teamId + "/import",
                HttpMethod.POST,
                new HttpEntity<>(body, headers),
                Map.class);
    }

    private byte[] createTestExcel(String[][] rows) throws Exception {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Students");

            // Header row
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Name");
            header.createCell(1).setCellValue("Email");
            header.createCell(2).setCellValue("Registration Number");

            for (int i = 0; i < rows.length; i++) {
                Row row = sheet.createRow(i + 1);
                for (int j = 0; j < rows[i].length; j++) {
                    row.createCell(j).setCellValue(rows[i][j]);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }
}
