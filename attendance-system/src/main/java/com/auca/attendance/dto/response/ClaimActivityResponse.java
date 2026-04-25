package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

/**
 * Activity timeline entry for a claim, derived from audit_log rows
 * filtered to entityType='Claim' AND entityId=claim.id.
 */
@Data
@Builder
public class ClaimActivityResponse {
    private Long id;
    private String action;
    private String actorEmail;
    private String details;
    private OffsetDateTime at;
}
