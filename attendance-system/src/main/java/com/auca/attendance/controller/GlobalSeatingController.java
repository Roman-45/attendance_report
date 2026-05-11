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

/**
 * Global (school-wide) classroom layout endpoints. There is one layout for the
 * entire school regardless of module — a student sits in the same seat in
 * every class. Use the per-module endpoints in {@link SeatingController}
 * only for the team-leader workflow.
 */
@RestController
@RequestMapping("/api/v1/seating")
@RequiredArgsConstructor
public class GlobalSeatingController {

    private final SeatingService seatingService;

    @GetMapping("/layout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ClassroomLayoutResponse>> getLayout() {
        return ResponseEntity.ok(ApiResponse.success(seatingService.getLayout()));
    }

    @PostMapping("/layout")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<ClassroomLayoutResponse>> createOrUpdateLayout(
            @Valid @RequestBody ClassroomLayoutRequest request) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.createOrUpdateLayout(request)));
    }

    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<SeatAssignmentResponse>> assignSeat(
            @Valid @RequestBody SeatAssignmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.assignSeat(request, currentUser)));
    }

    @PostMapping("/assign/bulk")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<List<SeatAssignmentResponse>>> bulkAssignSeats(
            @Valid @RequestBody BulkSeatAssignmentRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.bulkAssignSeats(request, currentUser)));
    }

    @DeleteMapping("/assign/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Void>> unassignSeat(@PathVariable Long studentId) {
        seatingService.unassignSeat(studentId);
        return ResponseEntity.ok(ApiResponse.success("Seat unassigned", null));
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SeatAssignmentResponse>> getMySeat(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(seatingService.getMySeat(currentUser)));
    }
}
