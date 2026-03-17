package com.auca.attendance.controller;

import com.auca.attendance.dto.request.MarkColumnRequest;
import com.auca.attendance.dto.request.MarkEntryRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.MarkColumnResponse;
import com.auca.attendance.dto.response.MarkEntryResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.AuditService;
import com.auca.attendance.service.MarkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class MarkController {

    private final MarkService markService;
    private final AuditService auditService;

    @GetMapping("/modules/{moduleId}/columns")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<MarkColumnResponse>>> getColumns(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(markService.getColumns(moduleId)));
    }

    @PostMapping("/modules/{moduleId}/columns")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<MarkColumnResponse>> createColumn(
            @PathVariable Long moduleId,
            @Valid @RequestBody MarkColumnRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MarkColumnResponse column = markService.createColumn(moduleId, request, currentUser);
        auditService.log(currentUser, "CREATE", "MarkColumn", column.getId(),
                "Created mark column for module " + moduleId, httpRequest.getRemoteAddr());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Column created", column));
    }

    @DeleteMapping("/columns/{columnId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteColumn(
            @PathVariable Long columnId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        markService.deleteColumn(columnId);
        auditService.log(currentUser, "DELETE", "MarkColumn", columnId,
                "Deleted mark column", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Column deleted", null));
    }

    @GetMapping("/modules/{moduleId}/marks")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<List<MarkEntryResponse>>> getMarks(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(markService.getMarks(moduleId)));
    }

    @PostMapping("/modules/{moduleId}/marks")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<MarkEntryResponse>>> submitMarks(
            @PathVariable Long moduleId,
            @RequestParam Long columnId,
            @Valid @RequestBody List<MarkEntryRequest> requests,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        List<MarkEntryResponse> entries = markService.submitMarks(moduleId, columnId, requests, currentUser);
        auditService.log(currentUser, "CREATE", "MarkEntry", columnId,
                "Submitted " + requests.size() + " mark entries for module " + moduleId, httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Marks submitted", entries));
    }

    @PatchMapping("/marks/{entryId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<MarkEntryResponse>> updateMark(
            @PathVariable Long entryId,
            @Valid @RequestBody MarkEntryRequest request,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest httpRequest) {
        MarkEntryResponse entry = markService.updateMark(entryId, request, currentUser);
        auditService.log(currentUser, "UPDATE", "MarkEntry", entryId,
                "Updated mark entry", httpRequest.getRemoteAddr());
        return ResponseEntity.ok(ApiResponse.success("Mark updated", entry));
    }
}
