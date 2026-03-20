package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ScheduledReportRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ScheduledReportResponse;
import com.auca.attendance.entity.ScheduledReportConfig;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.ScheduledReportConfigRepository;
import com.auca.attendance.service.ScheduledReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/scheduled-reports")
@RequiredArgsConstructor
public class ScheduledReportController {

    private final ScheduledReportConfigRepository configRepo;
    private final ModuleRepository moduleRepo;
    private final ScheduledReportService scheduledReportService;

    @Transactional(readOnly = true)
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<ScheduledReportResponse>>> getAll() {
        List<ScheduledReportResponse> result = configRepo.findAll().stream()
                .map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Transactional
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ScheduledReportResponse>> create(
            @Valid @RequestBody ScheduledReportRequest request,
            @AuthenticationPrincipal User currentUser) {
        var module = moduleRepo.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        ScheduledReportConfig config = ScheduledReportConfig.builder()
                .module(module)
                .reportType(request.getReportType())
                .frequency(request.getFrequency())
                .recipientEmail(request.getRecipientEmail())
                .createdBy(currentUser)
                .build();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Scheduled report created", toResponse(configRepo.save(config))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        configRepo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Scheduled report deleted", null));
    }

    @PostMapping("/trigger/{frequency}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> triggerManually(@PathVariable String frequency) {
        scheduledReportService.sendReports(frequency.toUpperCase());
        return ResponseEntity.ok(ApiResponse.success("Reports triggered for " + frequency,
                Map.of("frequency", frequency.toUpperCase())));
    }

    private ScheduledReportResponse toResponse(ScheduledReportConfig cfg) {
        return ScheduledReportResponse.builder()
                .id(cfg.getId())
                .moduleId(cfg.getModule().getId())
                .moduleName(cfg.getModule().getName())
                .moduleCode(cfg.getModule().getCode())
                .reportType(cfg.getReportType())
                .frequency(cfg.getFrequency())
                .recipientEmail(cfg.getRecipientEmail())
                .enabled(cfg.getEnabled())
                .lastSentAt(cfg.getLastSentAt())
                .createdByName(cfg.getCreatedBy().getName())
                .createdAt(cfg.getCreatedAt())
                .build();
    }
}
