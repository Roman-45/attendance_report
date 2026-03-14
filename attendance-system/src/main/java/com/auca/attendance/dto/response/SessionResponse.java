package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Data
@Builder
public class SessionResponse {
    private Long id;
    private Long moduleId;
    private String moduleName;
    private LocalDate sessionDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String period;
    private String createdBy;
    private OffsetDateTime createdAt;
}
