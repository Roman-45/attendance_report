package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class ModuleDashboardResponse {
    private Long moduleId;
    private String moduleName;
    private String moduleCode;
    private int totalEnrolled;
    private int totalSessions;
    private double averageAttendancePercent;
    private int absenceThreshold;
    private int studentsAtRisk;
    private BigDecimal averageGrade;
    private List<AtRiskStudent> atRiskStudents;
    private List<GradeDistribution> gradeDistribution;

    @Data
    @Builder
    public static class AtRiskStudent {
        private Long studentId;
        private String studentName;
        private String studentCode;
        private long absences;
        private long totalSessions;
        private double absencePercent;
    }

    @Data
    @Builder
    public static class GradeDistribution {
        private String gradeLetter;
        private int count;
    }
}
