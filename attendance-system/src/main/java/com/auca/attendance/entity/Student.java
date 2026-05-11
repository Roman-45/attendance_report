package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "students")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false, unique = true, length = 20)
    private String studentId;

    @Column(nullable = false, length = 100)
    private String name;

    /** Optional. Unique constraint dropped in V39 — service rejects duplicates only when set. */
    @Column(length = 150)
    private String email;

    /** Optional. Defaults to current academic year on creation if missing. */
    @Column(name = "cohort_year")
    private Integer cohortYear;

    @Column(length = 100)
    private String program;

    @Column(length = 20)
    private String phone;

    @Column(name = "profile_photo_path", length = 500)
    private String profilePhotoPath;

    /**
     * Optional link to a User account (role=STUDENT).
     * Null when the student has no login account yet.
     * Set by StudentService.create() when createAccount=true.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User account;

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
