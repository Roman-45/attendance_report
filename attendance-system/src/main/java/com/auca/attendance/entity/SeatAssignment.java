package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "seat_assignments",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"layout_id", "row_number", "column_number"}),
        @UniqueConstraint(columnNames = {"layout_id", "student_id"})
    })
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SeatAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "layout_id", nullable = false)
    private ClassroomLayout layout;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "row_number", nullable = false)
    private Integer rowNumber;

    @Column(name = "column_number", nullable = false)
    private Integer columnNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by")
    private Student assignedBy;

    @Column(name = "assigned_at", updatable = false)
    private OffsetDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = OffsetDateTime.now();
    }
}
