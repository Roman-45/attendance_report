package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class TeamResponse {
    private Long id;
    private Long moduleId;
    private String moduleName;
    private String name;
    private Long leaderStudentId;
    private String leaderStudentName;
    private int memberCount;
    private OffsetDateTime createdAt;
}
