package com.auca.attendance.service;

import com.auca.attendance.dto.response.GradeResponse;
import com.auca.attendance.entity.*;
import com.auca.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GradeComputationService {

    private final MarkColumnRepository columnRepo;
    private final MarkEntryRepository entryRepo;
    private final EnrollmentRepository enrollmentRepo;

    @Transactional(readOnly = true)
    public List<GradeResponse> computeGradesForModule(Long moduleId) {
        List<MarkColumn> columns = columnRepo.findByModuleId(moduleId);
        if (columns.isEmpty()) return List.of();

        List<Enrollment> enrollments = enrollmentRepo.findByModuleId(moduleId);
        List<GradeResponse> results = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            List<MarkEntry> entries = entryRepo.findByStudentIdAndColumnModuleId(student.getId(), moduleId);

            List<GradeResponse.MarkBreakdown> breakdown = new ArrayList<>();
            BigDecimal totalWeightedScore = BigDecimal.ZERO;
            BigDecimal totalWeight = BigDecimal.ZERO;

            for (MarkColumn col : columns) {
                BigDecimal weight = col.getWeight() != null ? col.getWeight() : col.getMaxScore();
                MarkEntry entry = entries.stream()
                        .filter(e -> e.getColumn().getId().equals(col.getId()))
                        .findFirst().orElse(null);

                BigDecimal score = entry != null ? entry.getScore() : BigDecimal.ZERO;
                BigDecimal pct = col.getMaxScore().compareTo(BigDecimal.ZERO) > 0
                        ? score.divide(col.getMaxScore(), 6, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;
                BigDecimal weightedScore = pct.multiply(weight);

                breakdown.add(GradeResponse.MarkBreakdown.builder()
                        .columnId(col.getId()).columnName(col.getName()).columnType(col.getType())
                        .score(score).maxScore(col.getMaxScore()).weight(weight)
                        .weightedScore(weightedScore.setScale(2, RoundingMode.HALF_UP))
                        .build());

                totalWeightedScore = totalWeightedScore.add(weightedScore);
                totalWeight = totalWeight.add(weight);
            }

            BigDecimal avg = totalWeight.compareTo(BigDecimal.ZERO) > 0
                    ? totalWeightedScore.divide(totalWeight, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            String letter = toGradeLetter(avg);

            results.add(GradeResponse.builder()
                    .studentId(student.getId()).studentName(student.getName())
                    .studentCode(student.getStudentId())
                    .moduleId(moduleId).moduleName(enrollment.getModule().getName())
                    .weightedAverage(avg).gradeLetter(letter)
                    .breakdown(breakdown).build());
        }
        return results;
    }

    @Transactional
    public List<GradeResponse> computeAndPersistGrades(Long moduleId) {
        List<GradeResponse> grades = computeGradesForModule(moduleId);
        for (GradeResponse g : grades) {
            enrollmentRepo.findByStudentIdAndModuleId(g.getStudentId(), g.getModuleId())
                    .ifPresent(e -> {
                        e.setFinalGrade(g.getWeightedAverage());
                        e.setGradeLetter(g.getGradeLetter());
                        e.setGradeComputedAt(OffsetDateTime.now());
                        enrollmentRepo.save(e);
                    });
        }
        return grades;
    }

    @Transactional(readOnly = true)
    public GradeResponse computeGradeForStudent(Long studentId, Long moduleId) {
        return computeGradesForModule(moduleId).stream()
                .filter(g -> g.getStudentId().equals(studentId))
                .findFirst().orElse(null);
    }

    private String toGradeLetter(BigDecimal avg) {
        double v = avg.doubleValue();
        if (v >= 90) return "A";
        if (v >= 85) return "B+";
        if (v >= 80) return "B";
        if (v >= 75) return "C+";
        if (v >= 70) return "C";
        if (v >= 60) return "D";
        return "F";
    }
}
