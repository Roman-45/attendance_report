package com.auca.attendance.dto.response;

import com.auca.attendance.enums.ClaimStatus;
import com.auca.attendance.enums.ClaimType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

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
}
