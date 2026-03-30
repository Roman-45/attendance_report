package com.auca.attendance.service;

import com.auca.attendance.dto.response.ImportResult;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.TeamMember;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TeamLeaderImportService — unit tests")
class TeamLeaderImportServiceTest {

    @Mock private StudentRepository studentRepo;
    @Mock private UserRepository userRepo;
    @Mock private TeamRepository teamRepo;
    @Mock private TeamMemberRepository memberRepo;
    @Mock private EnrollmentRepository enrollmentRepo;
    @Mock private ModuleRepository moduleRepo;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JavaMailSender mailSender;

    @InjectMocks private TeamLeaderImportService importService;

    // ─── Permission verification ──────────────────────────────────────

    @Test
    @DisplayName("Admin user can import to any team")
    void importTeamMembers_ShouldSucceed_ForAdmin() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepo.save(any())).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(100L);
            return u;
        });
        when(studentRepo.save(any())).thenAnswer(i -> {
            Student s = i.getArgument(0);
            s.setId(200L);
            return s;
        });

        MultipartFile file = buildExcel(new String[][]{
                {"Alice", "alice@test.auca.ac.rw", "REG001"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getTotalRows()).isEqualTo(1);
        assertThat(result.getImported()).isEqualTo(1);
    }

    @Test
    @DisplayName("Team leader who is the actual leader can import")
    void importTeamMembers_ShouldSucceed_ForActualLeader() throws Exception {
        Student leaderStudent = buildStudent(5L, "STULDR01");
        Team team = buildTeam(1L, leaderStudent);
        User leaderUser = buildUser(10L, Role.TEAM_LEADER);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(studentRepo.findByAccountId(10L)).thenReturn(Optional.of(leaderStudent));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepo.save(any())).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(100L);
            return u;
        });
        when(studentRepo.save(any())).thenAnswer(i -> {
            Student s = i.getArgument(0);
            s.setId(200L);
            return s;
        });

        MultipartFile file = buildExcel(new String[][]{
                {"Bob", "bob@test.auca.ac.rw", "REG002"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, leaderUser);

        assertThat(result.getTotalRows()).isEqualTo(1);
        assertThat(result.getImported()).isEqualTo(1);
    }

    @Test
    @DisplayName("Team leader who is NOT the leader of the team gets rejected")
    void importTeamMembers_ShouldThrow_WhenNotLeaderOfTeam() throws Exception {
        Student actualLeader = buildStudent(5L, "STULDR01");
        Student differentStudent = buildStudent(99L, "STUOTH01");
        Team team = buildTeam(1L, actualLeader);
        User wrongLeaderUser = buildUser(20L, Role.TEAM_LEADER);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(studentRepo.findByAccountId(20L)).thenReturn(Optional.of(differentStudent));

        MultipartFile file = buildExcel(new String[][]{
                {"Carol", "carol@test.auca.ac.rw", "REG003"}
        });

        assertThatThrownBy(() -> importService.importTeamMembers(1L, file, wrongLeaderUser))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not the leader");
    }

    @Test
    @DisplayName("Team not found throws ResourceNotFoundException")
    void importTeamMembers_ShouldThrow_WhenTeamNotFound() throws Exception {
        User admin = buildUser(10L, Role.ADMIN);
        when(teamRepo.findById(999L)).thenReturn(Optional.empty());

        MultipartFile file = buildExcel(new String[][]{
                {"Dan", "dan@test.auca.ac.rw", "REG004"}
        });

        assertThatThrownBy(() -> importService.importTeamMembers(999L, file, admin))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ─── Excel parsing ────────────────────────────────────────────────

    @Test
    @DisplayName("Valid Excel rows are parsed and imported correctly")
    void importTeamMembers_ShouldParseValidRows() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(passwordEncoder.encode(any())).thenReturn("encoded");
        when(userRepo.save(any())).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(100L);
            return u;
        });
        when(studentRepo.save(any())).thenAnswer(i -> {
            Student s = i.getArgument(0);
            s.setId(200L);
            return s;
        });

        MultipartFile file = buildExcel(new String[][]{
                {"Eve", "eve@test.auca.ac.rw", "REG010"},
                {"Frank", "frank@test.auca.ac.rw", "REG011"},
                {"Grace", "grace@test.auca.ac.rw", "REG012"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getTotalRows()).isEqualTo(3);
        assertThat(result.getImported()).isEqualTo(3);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getErrors()).isEmpty();
    }

    @Test
    @DisplayName("Rows with missing name are reported as errors")
    void importTeamMembers_ShouldReportError_WhenNameMissing() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));

        MultipartFile file = buildExcel(new String[][]{
                {"", "noname@test.auca.ac.rw", "REG020"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0)).containsIgnoringCase("Name");
    }

    @Test
    @DisplayName("Rows with missing email are reported as errors")
    void importTeamMembers_ShouldReportError_WhenEmailMissing() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));

        MultipartFile file = buildExcel(new String[][]{
                {"No Email Student", "", "REG021"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0)).containsIgnoringCase("Email");
    }

    @Test
    @DisplayName("Rows with missing registration number are reported as errors")
    void importTeamMembers_ShouldReportError_WhenRegNumberMissing() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));

        MultipartFile file = buildExcel(new String[][]{
                {"No Reg Student", "noreg@test.auca.ac.rw", ""}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0)).containsIgnoringCase("Registration");
    }

    // ─── Duplicate detection ──────────────────────────────────────────

    @Test
    @DisplayName("Existing student by email is skipped (not re-created)")
    void importTeamMembers_ShouldSkipExistingStudent_ByEmail() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);
        Student existing = buildStudent(50L, "STUEXIST01");

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(studentRepo.findByEmailAndDeletedAtIsNull("existing@test.auca.ac.rw"))
                .thenReturn(Optional.of(existing));

        MultipartFile file = buildExcel(new String[][]{
                {"Existing Student", "existing@test.auca.ac.rw", "REG050"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(1);
        // Should not create a new user
        verify(userRepo, never()).save(any());
    }

    @Test
    @DisplayName("Existing student by registration number is skipped")
    void importTeamMembers_ShouldSkipExistingStudent_ByRegNumber() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);
        Student existing = buildStudent(51L, "STUREG051");

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(studentRepo.findByEmailAndDeletedAtIsNull("newmail@test.auca.ac.rw"))
                .thenReturn(Optional.empty());
        when(studentRepo.findByStudentIdAndDeletedAtIsNull("STUREG051"))
                .thenReturn(Optional.of(existing));

        MultipartFile file = buildExcel(new String[][]{
                {"Existing By Reg", "newmail@test.auca.ac.rw", "REG051"}
        });

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(1);
    }

    @Test
    @DisplayName("Empty Excel (header only) returns zero counts with no errors")
    void importTeamMembers_ShouldReturnZero_WhenExcelIsEmpty() throws Exception {
        Team team = buildTeam(1L, null);
        User admin = buildUser(10L, Role.ADMIN);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));

        MultipartFile file = buildExcel(new String[0][]);

        ImportResult result = importService.importTeamMembers(1L, file, admin);

        assertThat(result.getTotalRows()).isEqualTo(0);
        assertThat(result.getImported()).isEqualTo(0);
        assertThat(result.getSkipped()).isEqualTo(0);
        assertThat(result.getErrors()).isEmpty();
    }

    @Test
    @DisplayName("Team leader with no student profile throws ResourceNotFoundException")
    void importTeamMembers_ShouldThrow_WhenLeaderHasNoStudentProfile() throws Exception {
        Team team = buildTeam(1L, buildStudent(5L, "STU005"));
        User leaderUser = buildUser(20L, Role.TEAM_LEADER);

        when(teamRepo.findById(1L)).thenReturn(Optional.of(team));
        when(studentRepo.findByAccountId(20L)).thenReturn(Optional.empty());

        MultipartFile file = buildExcel(new String[][]{
                {"Test", "test@test.auca.ac.rw", "REG999"}
        });

        assertThatThrownBy(() -> importService.importTeamMembers(1L, file, leaderUser))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("student profile");
    }

    // ─── Builder helpers ──────────────────────────────────────────────

    private User buildUser(Long id, Role role) {
        return User.builder()
                .id(id)
                .name("Test " + role.name())
                .email(role.name().toLowerCase() + id + "@test.auca.ac.rw")
                .password("encoded")
                .role(role)
                .build();
    }

    private Student buildStudent(Long id, String studentId) {
        return Student.builder()
                .id(id)
                .studentId(studentId)
                .name("Student " + studentId)
                .email(studentId.toLowerCase() + "@test.auca.ac.rw")
                .cohortYear(2024)
                .build();
    }

    private Team buildTeam(Long id, Student leader) {
        com.auca.attendance.entity.Module module = com.auca.attendance.entity.Module.builder()
                .id(1L)
                .code("CS100")
                .name("Test Module")
                .description("desc")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .build();

        return Team.builder()
                .id(id)
                .module(module)
                .name("Test Team")
                .leader(leader)
                .createdAt(OffsetDateTime.now())
                .build();
    }

    /**
     * Creates an in-memory .xlsx with a header row followed by the given data rows.
     * Columns: Name | Email | Registration Number
     */
    private MultipartFile buildExcel(String[][] dataRows) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Students");

            // Header
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Name");
            header.createCell(1).setCellValue("Email");
            header.createCell(2).setCellValue("Registration Number");

            // Data rows
            for (int r = 0; r < dataRows.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < dataRows[r].length; c++) {
                    row.createCell(c).setCellValue(dataRows[r][c]);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return new MockMultipartFile(
                    "file", "students.xlsx",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    out.toByteArray());
        }
    }
}
