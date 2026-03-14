package com.auca.attendance.controller;

import com.auca.attendance.dto.request.EnrollStudentsRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.EnrollmentResponse;
import com.auca.attendance.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /** Enroll one or more students in a module — ADMIN only */
    @PostMapping("/modules/{moduleId}/enrollments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> enroll(
            @PathVariable Long moduleId,
            @Valid @RequestBody EnrollStudentsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Students enrolled", enrollmentService.enroll(moduleId, request)));
    }

    /** Remove a student from a module — ADMIN only */
    @DeleteMapping("/modules/{moduleId}/enrollments/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> unenroll(
            @PathVariable Long moduleId,
            @PathVariable Long studentId) {
        enrollmentService.unenroll(moduleId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Student unenrolled", null));
    }

    /** List all enrolled students for a module — ADMIN / FACILITATOR */
    @GetMapping("/modules/{moduleId}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getByModule(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getByModule(moduleId)));
    }

    /** List all modules a student is enrolled in — ADMIN / FACILITATOR */
    @GetMapping("/students/{studentId}/enrollments")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getByStudent(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getByStudent(studentId)));
    }
}
