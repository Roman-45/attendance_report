package com.auca.attendance.controller;

import com.auca.attendance.dto.request.AttendanceRecordRequest;
import com.auca.attendance.dto.request.SessionRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.AttendanceService;
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

    @PostMapping("/modules/{moduleId}/sessions")
    @PreAuthorize("hasRole('FACILITATOR')")
    public ResponseEntity<ApiResponse<AttendanceSession>> createSession(
            @PathVariable Long moduleId,
            @Valid @RequestBody SessionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Session created",
                        attendanceService.createSession(moduleId, request, currentUser)));
    }

    @GetMapping("/modules/{moduleId}/sessions")
    public ResponseEntity<ApiResponse<List<AttendanceSession>>> getSessions(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getSessions(moduleId)));
    }

    @GetMapping("/sessions/{sessionId}/records")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getRecords(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getRecords(sessionId)));
    }

    @PostMapping("/sessions/{sessionId}/records")
    @PreAuthorize("hasRole('FACILITATOR')")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> submitRecords(
            @PathVariable Long sessionId,
            @Valid @RequestBody List<AttendanceRecordRequest> requests) {
        return ResponseEntity.ok(ApiResponse.success("Attendance submitted",
                attendanceService.submitRecords(sessionId, requests)));
    }

    @PatchMapping("/records/{recordId}")
    @PreAuthorize("hasAnyRole('FACILITATOR','ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceRecord>> correctRecord(
            @PathVariable Long recordId,
            @Valid @RequestBody AttendanceRecordRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Record updated",
                attendanceService.correctRecord(recordId, request)));
    }

    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<ApiResponse<List<AttendanceRecord>>> getStudentHistory(
            @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getStudentHistory(studentId)));
    }

    @GetMapping("/modules/{moduleId}/attendance/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModuleSummary(
            @PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(attendanceService.getModuleSummary(moduleId)));
    }
}
