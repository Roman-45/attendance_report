package com.auca.attendance.service;

import com.auca.attendance.dto.response.AuditLogResponse;
import com.auca.attendance.entity.AuditLog;
import com.auca.attendance.entity.User;
import com.auca.attendance.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepo;

    @Async
    @Transactional
    public void log(User user, String action, String entityType, Long entityId, String details, String ipAddress) {
        auditLogRepo.save(AuditLog.builder()
                .user(user)
                .userEmail(user != null ? user.getEmail() : null)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .build());
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getAll(Pageable pageable) {
        return auditLogRepo.findAllByOrderByCreatedAtDesc(pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AuditLogResponse> getByEntity(String entityType, Long entityId, Pageable pageable) {
        return auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable)
                .map(this::toResponse);
    }

    /** Full timeline for a single entity (oldest → newest). */
    @Transactional(readOnly = true)
    public List<AuditLogResponse> findByEntity(String entityType, Long entityId) {
        return auditLogRepo.findByEntityTypeAndEntityIdOrderByCreatedAtAsc(entityType, entityId)
                .stream().map(this::toResponse).toList();
    }

    private AuditLogResponse toResponse(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId()).userEmail(a.getUserEmail()).action(a.getAction())
                .entityType(a.getEntityType()).entityId(a.getEntityId())
                .details(a.getDetails()).ipAddress(a.getIpAddress())
                .createdAt(a.getCreatedAt()).build();
    }
}
