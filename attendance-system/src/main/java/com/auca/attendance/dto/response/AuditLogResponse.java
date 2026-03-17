package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
@Builder
public class AuditLogResponse {
    private Long id;
    private String userEmail;
    private String action;
    private String entityType;
    private Long entityId;
    private String details;
    private String ipAddress;
    private OffsetDateTime createdAt;
}
