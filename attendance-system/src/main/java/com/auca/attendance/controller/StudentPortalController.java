package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.AttendanceRecordResponse;
import com.auca.attendance.dto.response.EnrollmentResponse;
import com.auca.attendance.dto.response.MarkEntryResponse;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.StudentPortalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Self-service portal for authenticated students.
 * All endpoints are restricted to users with the STUDENT role.
 * Data is strictly isolated to the requesting student's own records.
 */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('STUDENT')")
public class StudentPortalController {

    private final StudentPortalService portalService;

    /** GET /me/profile — student's own profile and account status. */
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<StudentResponse>> getProfile(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getProfile(currentUser)));
    }

    /** GET /me/modules — modules the student is enrolled in. */
    @GetMapping("/modules")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyModules(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getMyModules(currentUser)));
    }

    /** GET /me/attendance — full attendance history across all enrolled modules. */
    @GetMapping("/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getMyAttendance(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getMyAttendance(currentUser)));
    }

    /** GET /me/attendance/{moduleId} — attendance for one specific module. */
    @GetMapping("/attendance/{moduleId}")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getMyAttendanceForModule(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(
                portalService.getMyAttendanceForModule(currentUser, moduleId)));
    }

    /** GET /me/marks — all mark entries across every enrolled module. */
    @GetMapping("/marks")
    public ResponseEntity<ApiResponse<List<MarkEntryResponse>>> getMyMarks(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getMyMarks(currentUser)));
    }

    /**
     * GET /me/absence-summary — per-module absence statistics.
     * Shows absence %, configured threshold, and whether the threshold was exceeded.
     */
    @GetMapping("/absence-summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyAbsenceSummary(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getMyAbsenceSummary(currentUser)));
    }
}
