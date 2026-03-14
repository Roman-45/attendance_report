package com.auca.attendance.service;

import com.auca.attendance.dto.response.StudentImportResult;
import com.auca.attendance.dto.response.StudentImportResult.ImportError;
import com.auca.attendance.entity.Student;
import com.auca.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

/**
 * Parses an Excel (.xlsx) file and bulk-imports students.
 *
 * Expected column order (header row required):
 *   A: studentId | B: name | C: email | D: cohortYear | E: program
 *
 * Rows with a duplicate studentId or email are skipped (not counted as errors).
 * Rows with validation failures are counted as errors and returned in the result.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudentImportService {

    private final StudentRepository studentRepository;

    @Transactional
    public StudentImportResult importFromExcel(MultipartFile file) {
        validateContentType(file);

        List<ImportError> errors  = new ArrayList<>();
        int imported = 0;
        int skipped  = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();

            // Row 0 is the header — start from row 1
            for (int rowIndex = 1; rowIndex <= lastRow; rowIndex++) {
                Row row = sheet.getRow(rowIndex);
                if (row == null || isRowBlank(row)) continue;

                int displayRow = rowIndex + 1; // human-readable (header = 1, first data = 2)

                String studentId  = cellString(row, 0);
                String name       = cellString(row, 1);
                String email      = cellString(row, 2);
                String cohortStr  = cellString(row, 3);
                String program    = cellString(row, 4);

                // Validate required fields
                if (studentId.isBlank()) {
                    errors.add(ImportError.builder().row(displayRow).studentId("").reason("studentId is required").build());
                    continue;
                }
                if (name.isBlank()) {
                    errors.add(ImportError.builder().row(displayRow).studentId(studentId).reason("name is required").build());
                    continue;
                }
                if (email.isBlank() || !email.contains("@")) {
                    errors.add(ImportError.builder().row(displayRow).studentId(studentId).reason("valid email is required").build());
                    continue;
                }

                int cohortYear;
                try {
                    cohortYear = Integer.parseInt(cohortStr);
                    if (cohortYear < 2000 || cohortYear > 2100) throw new NumberFormatException();
                } catch (NumberFormatException e) {
                    errors.add(ImportError.builder().row(displayRow).studentId(studentId).reason("cohortYear must be a valid 4-digit year").build());
                    continue;
                }

                // Skip duplicates silently
                if (studentRepository.existsByStudentId(studentId) || studentRepository.existsByEmail(email)) {
                    skipped++;
                    continue;
                }

                studentRepository.save(Student.builder()
                        .studentId(studentId)
                        .name(name)
                        .email(email)
                        .cohortYear(cohortYear)
                        .program(program.isBlank() ? null : program)
                        .build());

                imported++;
            }

        } catch (Exception e) {
            log.error("Failed to parse import file: {}", e.getMessage());
            throw new IllegalArgumentException("Failed to parse Excel file: " + e.getMessage());
        }

        return StudentImportResult.builder()
                .imported(imported)
                .skipped(skipped)
                .errors(errors)
                .build();
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private void validateContentType(MultipartFile file) {
        String ct = file.getContentType();
        if (ct == null ||
                (!ct.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                 && !ct.equals("application/octet-stream"))) {
            // Accept application/octet-stream as some clients don't set xlsx MIME type
            String name = file.getOriginalFilename();
            if (name == null || !name.toLowerCase().endsWith(".xlsx")) {
                throw new IllegalArgumentException("Only .xlsx files are supported");
            }
        }
    }

    private String cellString(Row row, int col) {
        Cell cell = row.getCell(col, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> {
                // cohortYear column may be stored as numeric
                double v = cell.getNumericCellValue();
                yield String.valueOf((long) v);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default      -> "";
        };
    }

    private boolean isRowBlank(Row row) {
        for (int c = 0; c < 5; c++) {
            if (!cellString(row, c).isBlank()) return false;
        }
        return true;
    }
}
