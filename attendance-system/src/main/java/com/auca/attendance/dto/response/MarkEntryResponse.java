package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class MarkEntryResponse {
    private Long id;
    private Long columnId;
    private String columnName;
    private String columnType;
    private BigDecimal maxScore;
    private Long studentId;
    private String studentName;
    private String studentCode;
    private BigDecimal score;
    private String enteredBy;
    private OffsetDateTime enteredAt;
}
