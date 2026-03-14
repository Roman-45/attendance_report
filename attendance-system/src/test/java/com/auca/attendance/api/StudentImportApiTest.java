package com.auca.attendance.api;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
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
import java.io.IOException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * API regression tests for the bulk student import endpoint.
 */
@DisplayName("Student Import — API regression tests")
class StudentImportApiTest extends BaseIntegrationTest {

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository   userRepository;
    @Autowired JwtService       jwtService;
    @Autowired PasswordEncoder  passwordEncoder;

    private String adminToken;
    private String facilitatorToken;

    @BeforeEach
    void setUp() {
        adminToken = tokenFor("import_admin@auca.ac.rw", Role.ADMIN);
        facilitatorToken = tokenFor("import_facilitator@auca.ac.rw", Role.FACILITATOR);
    }

    @Test
    @DisplayName("ADMIN can import a valid .xlsx file and get import summary")
    void admin_CanImportValidFile() throws IOException {
        byte[] xlsx = buildExcel(
                new String[]{"IMP001", "Import Alice", "imp_alice@import.auca.ac.rw", "2024", "CS"},
                new String[]{"IMP002", "Import Bob",   "imp_bob@import.auca.ac.rw",   "2023", "IT"});

        ResponseEntity<Map> resp = postFile(adminToken, xlsx, "import_valid.xlsx");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<?, ?> data = (Map<?, ?>) resp.getBody().get("data");
        assertThat((int) data.get("imported")).isGreaterThanOrEqualTo(2);
    }

    @Test
    @DisplayName("ADMIN importing duplicate students increments skipped count")
    void admin_DuplicateStudents_AreSkipped() throws IOException {
        // First import
        byte[] xlsx = buildExcel(
                new String[]{"IMP_DUP01", "Dup Alice", "imp_dup_alice@import.auca.ac.rw", "2024", "CS"});
        postFile(adminToken, xlsx, "first.xlsx");

        // Second import with same student
        ResponseEntity<Map> resp = postFile(adminToken, xlsx, "second.xlsx");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<?, ?> data = (Map<?, ?>) resp.getBody().get("data");
        assertThat((int) data.get("skipped")).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("ADMIN importing file with invalid rows gets error list in response")
    void admin_InvalidRows_AreReportedAsErrors() throws IOException {
        byte[] xlsx = buildExcel(
                new String[]{"", "No ID Student", "noid@import.auca.ac.rw", "2024", "CS"});

        ResponseEntity<Map> resp = postFile(adminToken, xlsx, "invalid.xlsx");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map<?, ?> data = (Map<?, ?>) resp.getBody().get("data");
        assertThat(((java.util.List<?>) data.get("errors"))).isNotEmpty();
    }

    @Test
    @DisplayName("FACILITATOR cannot import students (ADMIN only) — must return 403")
    void facilitator_CannotImport() throws IOException {
        byte[] xlsx = buildExcel(
                new String[]{"IMP_FAC01", "Fac Student", "fac_stu@import.auca.ac.rw", "2024", "CS"});

        ResponseEntity<Map> resp = postFile(facilitatorToken, xlsx, "fac_import.xlsx");

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("Unauthenticated request to import returns 401/403")
    void unauthenticated_CannotImport() throws IOException {
        byte[] xlsx = buildExcel(
                new String[]{"IMP_ANON", "Anon", "anon@import.auca.ac.rw", "2024", "CS"});

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource resource = new ByteArrayResource(xlsx) {
            @Override public String getFilename() { return "anon.xlsx"; }
        };
        body.add("file", resource);

        ResponseEntity<Map> resp = restTemplate.exchange(
                "/api/v1/students/import", HttpMethod.POST,
                new HttpEntity<>(body, headers), Map.class);

        assertThat(resp.getStatusCode()).isIn(HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String tokenFor(String email, Role role) {
        User u = userRepository.findByEmail(email).orElseGet(() ->
                userRepository.save(User.builder()
                        .name("Import Test " + role)
                        .email(email)
                        .password(passwordEncoder.encode("Admin@1234"))
                        .role(role)
                        .build()));
        return jwtService.generateToken(u);
    }

    private ResponseEntity<Map> postFile(String token, byte[] xlsx, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        ByteArrayResource resource = new ByteArrayResource(xlsx) {
            @Override public String getFilename() { return filename; }
        };
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", resource);

        return restTemplate.exchange(
                "/api/v1/students/import", HttpMethod.POST,
                new HttpEntity<>(body, headers), Map.class);
    }

    private byte[] buildExcel(String[]... dataRows) throws IOException {
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            XSSFSheet sheet = wb.createSheet("Students");
            XSSFRow header = sheet.createRow(0);
            String[] cols = {"studentId", "name", "email", "cohortYear", "program"};
            for (int i = 0; i < cols.length; i++) header.createCell(i).setCellValue(cols[i]);

            for (int r = 0; r < dataRows.length; r++) {
                XSSFRow row = sheet.createRow(r + 1);
                for (int c = 0; c < dataRows[r].length; c++) {
                    row.createCell(c).setCellValue(dataRows[r][c]);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return out.toByteArray();
        }
    }
}
