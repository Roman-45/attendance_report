package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
public class AttendanceRecordResponse {
    private Long id;
    private Long sessionId;
    private LocalDate sessionDate;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private String status;
    private Boolean consecutiveAbsentFlag;
    private String notes;
    private OffsetDateTime recordedAt;
}
