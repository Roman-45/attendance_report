package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "attendance_records",
    uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "student_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(name = "consecutive_absent_flag", nullable = false)
    @Builder.Default
    private Boolean consecutiveAbsentFlag = false;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private OffsetDateTime recordedAt;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        recordedAt = OffsetDateTime.now();
    }
}
