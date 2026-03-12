package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "mark_entries",
    uniqueConstraints = @UniqueConstraint(columnNames = {"column_id", "student_id"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "column_id", nullable = false)
    private MarkColumn column;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(precision = 5, scale = 2)
    private BigDecimal score;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entered_by", nullable = false)
    private User enteredBy;

    @Column(name = "entered_at", nullable = false, updatable = false)
    private OffsetDateTime enteredAt;

    @PrePersist
    protected void onCreate() {
        enteredAt = OffsetDateTime.now();
    }
}
