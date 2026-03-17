package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "enrollments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"student_id", "module_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "enrolled_at", nullable = false, updatable = false)
    private OffsetDateTime enrolledAt;

    @Column(name = "final_grade", precision = 5, scale = 2)
    private BigDecimal finalGrade;

    @Column(name = "grade_letter", length = 5)
    private String gradeLetter;

    @Column(name = "grade_computed_at")
    private OffsetDateTime gradeComputedAt;

    @PrePersist
    protected void onCreate() {
        enrolledAt = OffsetDateTime.now();
    }
}
