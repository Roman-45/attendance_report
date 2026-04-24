package com.auca.attendance.controller;

import com.auca.attendance.dto.response.*;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.ClaimService;
import com.auca.attendance.service.ReportGenerationService;
import com.auca.attendance.service.SeatingService;
import com.auca.attendance.service.StudentPortalService;
import com.auca.attendance.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
@PreAuthorize("hasAnyRole('STUDENT','TEAM_LEADER')")
public class StudentPortalController {

    private final StudentPortalService portalService;
    private final ReportGenerationService reportService;
    private final TeamService teamService;
    private final SeatingService seatingService;
    private final ClaimService claimService;

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
     */
    @GetMapping("/absence-summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMyAbsenceSummary(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(portalService.getMyAbsenceSummary(currentUser)));
    }

    // ── Teams, Seating & Claims ────────────────────────────────────────────

    /** GET /me/teams/{moduleId} — student's team in the given module. */
    @GetMapping("/teams/{moduleId}")
    public ResponseEntity<ApiResponse<TeamResponse>> getMyTeam(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long moduleId) {
        Student student = portalService.resolveStudent(currentUser);
        return ResponseEntity.ok(ApiResponse.success(teamService.getStudentTeam(student.getId(), moduleId)));
    }

    /** GET /me/seating/{moduleId} — student's own seat assignment. */
    @GetMapping("/seating/{moduleId}")
    public ResponseEntity<ApiResponse<SeatAssignmentResponse>> getMySeat(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.getMySeat(moduleId, currentUser)));
    }

    /** GET /me/claims — all claims submitted by this student. */
    @GetMapping("/claims")
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getMyClaims(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getMyClaims(currentUser)));
    }

    // ── Self-service report downloads ──────────────────────────────────────

    @GetMapping("/reports/attendance/excel")
    public ResponseEntity<byte[]> myAttendanceExcel(
            @AuthenticationPrincipal User currentUser) throws Exception {
        Student student = portalService.resolveStudent(currentUser);
        byte[] data = reportService.generateStudentAttendanceExcel(student.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=my_attendance.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/reports/attendance/pdf")
    public ResponseEntity<byte[]> myAttendancePdf(
            @AuthenticationPrincipal User currentUser) throws Exception {
        Student student = portalService.resolveStudent(currentUser);
        byte[] data = reportService.generateStudentAttendancePdf(student.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=my_attendance.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/reports/marks/excel")
    public ResponseEntity<byte[]> myMarksExcel(
            @AuthenticationPrincipal User currentUser) throws Exception {
        Student student = portalService.resolveStudent(currentUser);
        byte[] data = reportService.generateStudentMarksExcel(student.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=my_marks.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/reports/marks/pdf")
    public ResponseEntity<byte[]> myMarksPdf(
            @AuthenticationPrincipal User currentUser) throws Exception {
        Student student = portalService.resolveStudent(currentUser);
        byte[] data = reportService.generateStudentMarksPdf(student.getId());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=my_marks.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
