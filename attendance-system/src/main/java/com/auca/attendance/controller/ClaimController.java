package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ClaimRequest;
import com.auca.attendance.dto.request.ClaimResolutionRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ClaimResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.ClaimStatus;
import com.auca.attendance.service.ClaimService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/claims")
@RequiredArgsConstructor
public class ClaimController {

    private final ClaimService claimService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<ClaimResponse>> submitClaim(
            @Valid @RequestBody ClaimRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(claimService.submitClaim(request, currentUser)));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ClaimResponse>>> getMyClaims(
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getMyClaims(currentUser)));
    }

    @GetMapping("/module/{moduleId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Page<ClaimResponse>>> getClaimsForModule(
            @PathVariable Long moduleId,
            @RequestParam(required = false) ClaimStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(
                claimService.getClaimsForModule(moduleId, status, pageable)));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Page<ClaimResponse>>> getPendingClaims(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(claimService.getPendingClaims(pageable)));
    }

    @PutMapping("/{claimId}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<ClaimResponse>> resolveClaim(
            @PathVariable Long claimId,
            @Valid @RequestBody ClaimResolutionRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(claimService.resolveClaim(claimId, request, currentUser)));
    }
}
