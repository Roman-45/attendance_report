package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "classroom_layouts")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomLayout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "total_rows", nullable = false)
    private Integer totalRows;

    @Column(name = "columns_per_row", nullable = false)
    private Integer columnsPerRow;

    @Column(name = "column_groups", nullable = false)
    private Integer columnGroups;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
    }
}
