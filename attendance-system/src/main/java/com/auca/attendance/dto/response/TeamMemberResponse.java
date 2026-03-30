package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class TeamMemberResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registrationNumber;
    private OffsetDateTime joinedAt;
}
