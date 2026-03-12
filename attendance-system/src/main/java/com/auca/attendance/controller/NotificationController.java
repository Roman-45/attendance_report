package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.entity.Notification;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(
                notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())));
    }

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
}
