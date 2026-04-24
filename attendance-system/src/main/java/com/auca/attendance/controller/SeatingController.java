package com.auca.attendance.controller;

import com.auca.attendance.dto.request.BulkSeatAssignmentRequest;
import com.auca.attendance.dto.request.ClassroomLayoutRequest;
import com.auca.attendance.dto.request.SeatAssignmentRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ClassroomLayoutResponse;
import com.auca.attendance.dto.response.SeatAssignmentResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.SeatingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules/{moduleId}/seating")
@RequiredArgsConstructor
public class SeatingController {

    private final SeatingService seatingService;

    @PostMapping("/layout")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<ClassroomLayoutResponse>> createOrUpdateLayout(
            @PathVariable Long moduleId,
            @Valid @RequestBody ClassroomLayoutRequest request) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.createOrUpdateLayout(moduleId, request)));
    }

    @GetMapping("/layout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ClassroomLayoutResponse>> getLayout(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.getLayout(moduleId)));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','TEAM_LEADER','STUDENT')")
    public ResponseEntity<ApiResponse<SeatAssignmentResponse>> assignSeat(
            @PathVariable Long moduleId,
            @Valid @RequestBody SeatAssignmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.assignSeat(moduleId, request, currentUser)));
    }

    @PostMapping("/assign/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','TEAM_LEADER','STUDENT')")
    public ResponseEntity<ApiResponse<List<SeatAssignmentResponse>>> bulkAssignSeats(
            @PathVariable Long moduleId,
            @Valid @RequestBody BulkSeatAssignmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.bulkAssignSeats(moduleId, request, currentUser)));
    }

    @DeleteMapping("/assign/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Void>> unassignSeat(
            @PathVariable Long moduleId,
            @PathVariable Long studentId) {
        seatingService.unassignSeat(moduleId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Seat unassigned", null));
    }
}
