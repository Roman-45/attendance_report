package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.NotificationResponse;
import com.auca.attendance.entity.Notification;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.NotificationRepository;
import com.auca.attendance.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final SseEmitterService sseEmitterService;

    /** SSE stream — authenticated via ?token= query param since EventSource cannot set headers */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal User user) {
        return sseEmitterService.register(user.getId());
    }

    @Transactional(readOnly = true)
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> unreadCount(@AuthenticationPrincipal User user) {
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<NotificationResponse>>> getAll(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<NotificationResponse> notifications = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }

    @Transactional
    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markRead(@PathVariable Long id) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + id));
        n.setIsRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(ApiResponse.success("Marked as read", null));
    }

    @Transactional
    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllRead(@AuthenticationPrincipal User user) {
        notificationRepository.markAllAsReadByRecipientId(user.getId());
        return ResponseEntity.ok(ApiResponse.success("All marked as read", null));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(n.getIsRead())
                .studentId(n.getStudent() != null ? n.getStudent().getId() : null)
                .studentName(n.getStudent() != null ? n.getStudent().getName() : null)
                .moduleId(n.getModule() != null ? n.getModule().getId() : null)
                .moduleName(n.getModule() != null ? n.getModule().getName() : null)
                .createdAt(n.getCreatedAt())
                .build();
    }
}
