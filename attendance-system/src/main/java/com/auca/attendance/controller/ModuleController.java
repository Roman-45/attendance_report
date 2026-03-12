package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ModuleRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ModuleResponse;
import com.auca.attendance.entity.User;
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

    @GetMapping
    public ResponseEntity<ApiResponse<List<ModuleResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ModuleResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getById(id)));
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
