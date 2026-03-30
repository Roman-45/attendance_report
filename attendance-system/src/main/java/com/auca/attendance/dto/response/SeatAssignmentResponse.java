package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
@Builder
public class SeatAssignmentResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String registrationNumber;
    private int rowNumber;
    private int columnNumber;
    private String assignedByName;
    private OffsetDateTime assignedAt;
}
