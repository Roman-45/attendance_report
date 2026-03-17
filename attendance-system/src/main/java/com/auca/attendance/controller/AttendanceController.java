package com.auca.attendance.controller;

import com.auca.attendance.dto.request.AttendanceRecordRequest;
import com.auca.attendance.dto.request.SessionRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.AttendanceRecordResponse;
import com.auca.attendance.dto.response.SessionResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.AttendanceService;
import com.auca.attendance.service.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final AuditService auditService;

    @PostMapping("/modules/{moduleId}/sessions")
    @PreAuthorize("hasRole('FACILITATOR')")
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @PathVariable Long moduleId,
            @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        SessionResponse session = attendanceService.createSession(moduleId, request, currentUser);
        auditService.log(currentUser, "CREATE", "AttendanceSession", session.getId(),
                "Created session for module " + moduleId, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Session created", session));
    }

    @GetMapping("/modules/{moduleId}/sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessions(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getSessions(moduleId)));
    }

    @GetMapping("/sessions/{sessionId}/records")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getRecords(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getRecords(sessionId)));
    }

    @PostMapping("/sessions/{sessionId}/records")
    @PreAuthorize("hasRole('FACILITATOR')")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> submitRecords(
            @PathVariable Long sessionId,
            @Valid @RequestBody List<AttendanceRecordRequest> requests,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        List<AttendanceRecordResponse> records = attendanceService.submitRecords(sessionId, requests);
        auditService.log(currentUser, "CREATE", "AttendanceRecord", sessionId,
                "Submitted " + requests.size() + " attendance records", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Attendance submitted", records));
    }

    @PatchMapping("/records/{recordId}")
    @PreAuthorize("hasAnyRole('FACILITATOR','ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceRecordResponse>> correctRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody AttendanceRecordRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        AttendanceRecordResponse record = attendanceService.correctRecord(recordId, request);
        auditService.log(currentUser, "UPDATE", "AttendanceRecord", recordId,
                "Corrected attendance record", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Record updated", record));
    }

    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRecordResponse>>> getStudentHistory(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getStudentHistory(studentId)));
    }

    @GetMapping("/modules/{moduleId}/attendance/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModuleSummary(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getModuleSummary(moduleId)));
    }
}
