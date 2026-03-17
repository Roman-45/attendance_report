package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class GradeResponse {
    private Long studentId;
    private String studentName;
    private String studentCode;
    private Long moduleId;
    private String moduleName;
    private BigDecimal weightedAverage;
    private String gradeLetter;
    private List<MarkBreakdown> breakdown;

    @Data
    @Builder
    public static class MarkBreakdown {
        private Long columnId;
        private String columnName;
        private String columnType;
        private BigDecimal score;
        private BigDecimal maxScore;
        private BigDecimal weight;
        private BigDecimal weightedScore;
    }
}
