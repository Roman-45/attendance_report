package com.auca.attendance.dto.response;

import com.auca.attendance.enums.ClaimStatus;
import com.auca.attendance.enums.ClaimType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
public class ClaimResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private Long moduleId;
    private String moduleName;
    private ClaimType claimType;
    private Long targetId;
    private String description;
    private ClaimStatus status;
    private String resolutionNote;
    private String resolvedByName;
    private OffsetDateTime resolvedAt;
    private OffsetDateTime createdAt;

    /**
     * Activity timeline derived from audit_log. Null when fetching via list
     * endpoints; populated only when fetching a single claim via GET /claims/{id}.
     */
    private List<ClaimActivityResponse> activity;
}
