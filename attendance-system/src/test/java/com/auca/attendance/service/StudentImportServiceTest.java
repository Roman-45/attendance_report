package com.auca.attendance.service;

import com.auca.attendance.dto.response.StudentImportResult;
import com.auca.attendance.entity.Student;
import com.auca.attendance.repository.StudentRepository;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("StudentImportService — unit tests")
class StudentImportServiceTest {

    @Mock StudentRepository studentRepository;

    @InjectMocks StudentImportService service;

    // ─── Happy-path ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Imports valid rows and returns correct counts")
    void importFromExcel_ShouldImportValidRows() throws IOException {
        when(studentRepository.existsByStudentId(any())).thenReturn(false);
        when(studentRepository.existsByEmail(any())).thenReturn(false);
        when(studentRepository.save(any())).thenAnswer(i -> i.getArgument(0));

        MultipartFile file = buildExcel(
                new String[]{"STU001", "Alice", "alice@auca.ac.rw", "2024", "CS"},
                new String[]{"STU002", "Bob",   "bob@auca.ac.rw",   "2023", "IT"});

        StudentImportResult result = service.importFromExcel(file);

        assertThat(result.getImported()).isEqualTo(2);
        assertThat(result.getSkipped()).isZero();
        assertThat(result.getErrors()).isEmpty();

        ArgumentCaptor<Student> cap = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository, times(2)).save(cap.capture());
        List<Student> saved = cap.getAllValues();
        assertThat(saved).extracting(Student::getStudentId).containsExactlyInAnyOrder("STU001", "STU002");
    }

    @Test
    @DisplayName("Skips rows where studentId already exists")
    void importFromExcel_ShouldSkipDuplicateStudentId() throws IOException {
        when(studentRepository.existsByStudentId("STU001")).thenReturn(true);
        when(studentRepository.existsByEmail(any())).thenReturn(false);
        when(studentRepository.existsByStudentId("STU002")).thenReturn(false);

        MultipartFile file = buildExcel(
                new String[]{"STU001", "Alice", "alice@auca.ac.rw", "2024", "CS"},
                new String[]{"STU002", "Bob",   "bob@auca.ac.rw",   "2023", "IT"});

        StudentImportResult result = service.importFromExcel(file);

        assertThat(result.getImported()).isEqualTo(1);
        assertThat(result.getSkipped()).isEqualTo(1);
    }

    @Test
    @DisplayName("Reports error for row with missing studentId")
    void importFromExcel_ShouldReportError_WhenStudentIdBlank() throws IOException {
        MultipartFile file = buildExcel(
                new String[]{"", "Alice", "alice@auca.ac.rw", "2024", "CS"});

        StudentImportResult result = service.importFromExcel(file);

        assertThat(result.getImported()).isZero();
        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0).getReason()).containsIgnoringCase("studentId");
    }

    @Test
    @DisplayName("Reports error for row with invalid email")
    void importFromExcel_ShouldReportError_WhenEmailInvalid() throws IOException {
        MultipartFile file = buildExcel(
                new String[]{"STU003", "Carol", "not-an-email", "2024", "CS"});

        StudentImportResult result = service.importFromExcel(file);

        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0).getReason()).containsIgnoringCase("email");
    }

    @Test
    @DisplayName("Reports error for row with invalid cohortYear")
    void importFromExcel_ShouldReportError_WhenCohortYearInvalid() throws IOException {
        MultipartFile file = buildExcel(
                new String[]{"STU004", "Dan", "dan@auca.ac.rw", "INVALID", "CS"});

        StudentImportResult result = service.importFromExcel(file);

        assertThat(result.getErrors()).hasSize(1);
        assertThat(result.getErrors().get(0).getReason()).containsIgnoringCase("cohortYear");
    }

    @Test
    @DisplayName("Rejects non-xlsx file")
    void importFromExcel_ShouldThrow_WhenNotXlsx() {
        MockMultipartFile txt = new MockMultipartFile(
                "file", "students.txt", "text/plain", "some data".getBytes());

        assertThatThrownBy(() -> service.importFromExcel(txt))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("xlsx");
    }

    // ─── Builder ─────────────────────────────────────────────────────────────

    /**
     * Creates an in-memory .xlsx with a header row followed by the given data rows.
     * Columns: studentId | name | email | cohortYear | program
     */
    private MultipartFile buildExcel(String[]... dataRows) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Students");

            // Header
            XSSFRow header = sheet.createRow(0);
            String[] cols = {"studentId", "name", "email", "cohortYear", "program"};
            for (int i = 0; i < cols.length; i++) header.createCell(i).setCellValue(cols[i]);

            // Data
            for (int r = 0; r < dataRows.length; r++) {
                XSSFRow row = sheet.createRow(r + 1);
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
