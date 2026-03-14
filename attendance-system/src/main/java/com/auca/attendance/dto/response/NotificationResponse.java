package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private Boolean isRead;
    private Long studentId;
    private String studentName;
    private Long moduleId;
    private String moduleName;
    private OffsetDateTime createdAt;
}
