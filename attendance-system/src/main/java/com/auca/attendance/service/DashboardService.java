package com.auca.attendance.service;

import com.auca.attendance.dto.response.GradeResponse;
import com.auca.attendance.dto.response.ModuleDashboardResponse;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Module;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ModuleRepository moduleRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final AttendanceSessionRepository sessionRepo;
    private final AttendanceRecordRepository recordRepo;
    private final GradeComputationService gradeService;

    @Transactional(readOnly = true)
    public ModuleDashboardResponse getModuleDashboard(Long moduleId) {
        Module module = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        List<Enrollment> enrollments = enrollmentRepo.findByModuleId(moduleId);
        int totalEnrolled = enrollments.size();
        int totalSessions = sessionRepo.findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId).size();

        int threshold = module.getAbsenceThresholdPercent() != null ? module.getAbsenceThresholdPercent() : 25;

        // Per-student attendance stats
        List<ModuleDashboardResponse.AtRiskStudent> atRisk = new ArrayList<>();
        long totalRecords = 0;
        long totalAbsences = 0;

        for (Enrollment e : enrollments) {
            Long sid = e.getStudent().getId();
            long total = recordRepo.countTotalByStudentAndModule(sid, moduleId);
            long absences = recordRepo.countAbsencesByStudentAndModule(sid, moduleId);
            totalRecords += total;
            totalAbsences += absences;

            double pct = total > 0 ? (double) absences / total * 100 : 0;
            if (pct >= threshold) {
                atRisk.add(ModuleDashboardResponse.AtRiskStudent.builder()
                        .studentId(sid).studentName(e.getStudent().getName())
                        .studentCode(e.getStudent().getStudentId())
                        .absences(absences).totalSessions(total)
                        .absencePercent(Math.round(pct * 10.0) / 10.0)
                        .build());
            }
        }

        double avgAttendance = totalRecords > 0
                ? Math.round((double)(totalRecords - totalAbsences) / totalRecords * 1000.0) / 10.0
                : 0;

        // Grade stats
        List<GradeResponse> grades = gradeService.computeGradesForModule(moduleId);
        BigDecimal avgGrade = BigDecimal.ZERO;
        Map<String, Integer> gradeDist = new LinkedHashMap<>();
        for (String l : List.of("A","B+","B","C+","C","D","F")) gradeDist.put(l, 0);

        if (!grades.isEmpty()) {
            BigDecimal sum = grades.stream().map(GradeResponse::getWeightedAverage)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            avgGrade = sum.divide(BigDecimal.valueOf(grades.size()), 2, RoundingMode.HALF_UP);
            grades.forEach(g -> gradeDist.merge(g.getGradeLetter(), 1, Integer::sum));
        }

        return ModuleDashboardResponse.builder()
                .moduleId(moduleId).moduleName(module.getName()).moduleCode(module.getCode())
                .totalEnrolled(totalEnrolled).totalSessions(totalSessions)
                .averageAttendancePercent(avgAttendance).absenceThreshold(threshold)
                .studentsAtRisk(atRisk.size()).averageGrade(avgGrade)
                .atRiskStudents(atRisk)
                .gradeDistribution(gradeDist.entrySet().stream()
                        .map(e -> ModuleDashboardResponse.GradeDistribution.builder()
                                .gradeLetter(e.getKey()).count(e.getValue()).build())
                        .toList())
                .build();
    }
}
