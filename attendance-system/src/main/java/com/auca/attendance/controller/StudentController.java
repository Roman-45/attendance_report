package com.auca.attendance.controller;

import com.auca.attendance.dto.request.StudentRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.StudentImportResult;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.service.AuditService;
import com.auca.attendance.service.StudentImportService;
import com.auca.attendance.service.StudentService;
import com.auca.attendance.entity.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.http.HttpHeaders;
import java.util.List;

@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;
    private final StudentImportService studentImportService;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Page<StudentResponse>>> getAll(
            @RequestParam(required = false) Integer cohortYear,
            @PageableDefault(size = 20, sort = "name") Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getAll(cohortYear, pageable)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<StudentResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(studentService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> create(
            @Valid @RequestBody StudentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StudentResponse student = studentService.create(request);
        auditService.log(currentUser, "CREATE", "Student", student.getId(),
                "Created student: " + request.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Student created", student));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody StudentRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StudentResponse student = studentService.update(id, request);
        auditService.log(currentUser, "UPDATE", "Student", id,
                "Updated student: " + request.getName(), httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Student updated", student));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        studentService.softDelete(id);
        auditService.log(currentUser, "DELETE", "Student", id,
                "Soft-deleted student", httpRequest.getRemoteAddr());
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
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        StudentImportResult result = studentImportService.importFromExcel(file);
        auditService.log(currentUser, "IMPORT", "Student", null,
                "Bulk import: " + result.getImported() + " imported, "
                        + result.getSkipped() + " skipped, "
                        + result.getErrors().size() + " errors",
                httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success(
                "Import completed: " + result.getImported() + " imported, "
                        + result.getSkipped() + " skipped, "
                        + result.getErrors().size() + " errors",
                result));
    }

    @GetMapping("/import/template")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> importTemplate() {
        byte[] template = studentImportService.generateTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student-import-template.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(template);
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentResponse>> uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) throws Exception {
        StudentResponse student = studentService.uploadPhoto(id, file);
        auditService.log(currentUser, "UPDATE", "Student", id,
                "Uploaded photo for student", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", student));
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> getPhoto(@PathVariable Long id) {
        byte[] photo = studentService.getPhoto(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(photo);
    }
}
