package com.auca.attendance.controller;

import com.auca.attendance.dto.request.MarkColumnRequest;
import com.auca.attendance.dto.request.MarkEntryRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.MarkColumnResponse;
import com.auca.attendance.dto.response.MarkEntryResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.MarkService;
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
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Column created",
                        markService.createColumn(moduleId, request, currentUser)));
    }

    @DeleteMapping("/columns/{columnId}")
    @PreAuthorize("hasAnyRole('INSTRUCTOR','ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteColumn(@PathVariable Long columnId) {
        markService.deleteColumn(columnId);
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
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Marks submitted",
                markService.submitMarks(moduleId, columnId, requests, currentUser)));
    }

    @PatchMapping("/marks/{entryId}")
    @PreAuthorize("hasRole('INSTRUCTOR')")
    public ResponseEntity<ApiResponse<MarkEntryResponse>> updateMark(
            @PathVariable Long entryId,
            @Valid @RequestBody MarkEntryRequest request,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success("Mark updated",
                markService.updateMark(entryId, request, currentUser)));
    }
}
