package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ModuleRequest;
import com.auca.attendance.dto.request.ModuleSelectionRequest;
import com.auca.attendance.dto.request.ModuleStatusRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ModuleResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.ModuleStatus;
import com.auca.attendance.service.ModuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    /**
     * GET /modules
     * - ADMIN / FACILITATOR: returns all modules.
     * - INSTRUCTOR: returns only their assigned module (empty list if none yet).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getAll(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getForUser(currentUser)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModuleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getById(id)));
    }

    /** GET /modules/available — unassigned modules for instructor first-login selection. */
    @GetMapping("/available")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getAvailable() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getAvailableForSelection()));
    }

    /** POST /modules/select — instructor selects their module (one-time, first login). */
    @PostMapping("/select")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<ModuleResponse>> selectModule(
            @Valid @RequestBody ModuleSelectionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                "Module selected successfully",
                moduleService.selectModule(currentUser, request.getModuleId())));
    }

    /** PATCH /modules/{id}/status — instructor starts (ACTIVE) or closes (CLOSED) their module. */
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<ModuleResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ModuleStatusRequest request,
            @AuthenticationPrincipal User currentUser) {
        ModuleStatus newStatus;
        try {
            newStatus = ModuleStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Invalid status. Use ACTIVE or CLOSED."));
        }
        return ResponseEntity.ok(ApiResponse.success(
                "Module status updated",
                moduleService.updateStatus(id, newStatus, currentUser)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ModuleResponse>> create(
            @Valid @RequestBody ModuleRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Module created", moduleService.create(request, currentUser)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ModuleResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ModuleRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Module updated", moduleService.update(id, request)));
    }

    @PostMapping("/{id}/instructors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ModuleResponse>> assignInstructor(
            @PathVariable Long id, @RequestParam Long instructorId) {
        return ResponseEntity.ok(ApiResponse.success("Instructor assigned",
                moduleService.assignInstructor(id, instructorId)));
    }
}
