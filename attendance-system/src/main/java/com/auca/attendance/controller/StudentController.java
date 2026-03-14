package com.auca.attendance.controller;

import com.auca.attendance.dto.request.StudentRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.StudentImportResult;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.service.StudentImportService;
import com.auca.attendance.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final StudentImportService studentImportService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<List<StudentResponse>>> getAll(
            @RequestParam(required = false) Integer cohortYear) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getAll(cohortYear)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<StudentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> create(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student created", studentService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> update(
            @PathVariable Long id, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Student updated", studentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        studentService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Student deleted", null));
    }

    /**
     * Bulk-import students from an Excel (.xlsx) file.
     * Expected columns: studentId | name | email | cohortYear | program
     * Duplicate rows (matching studentId or email) are silently skipped.
     */
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentImportResult>> importStudents(
            @RequestParam("file") MultipartFile file) {
        StudentImportResult result = studentImportService.importFromExcel(file);
        return ResponseEntity.ok(ApiResponse.success(
                "Import completed: " + result.getImported() + " imported, "
                        + result.getSkipped() + " skipped, "
                        + result.getErrors().size() + " errors",
                result));
    }
}
