package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ModuleDashboardResponse;
import com.auca.attendance.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/modules/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','INSTRUCTOR')")
    public ResponseEntity<ApiResponse<ModuleDashboardResponse>> getModuleDashboard(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(dashboardService.getModuleDashboard(moduleId)));
    }
}
