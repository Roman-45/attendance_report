package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class ScheduledReportResponse {
    private Long id;
    private Long moduleId;
    private String moduleName;
    private String moduleCode;
    private String reportType;
    private String frequency;
    private String recipientEmail;
    private Boolean enabled;
    private OffsetDateTime lastSentAt;
    private String createdByName;
    private OffsetDateTime createdAt;
}
