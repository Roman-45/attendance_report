package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
public class MarkColumnResponse {
    private Long id;
    private Long moduleId;
    private String moduleName;
    private String name;
    private String type;
    private BigDecimal maxScore;
    private BigDecimal weight;
    private String createdBy;
    private OffsetDateTime createdAt;
}
