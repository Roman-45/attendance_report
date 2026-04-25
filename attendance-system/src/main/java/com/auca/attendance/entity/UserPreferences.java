package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "user_preferences")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    @Column(name = "email_enabled", nullable = false)
    @Builder.Default
    private Boolean emailEnabled = true;

    @Column(name = "push_enabled", nullable = false)
    @Builder.Default
    private Boolean pushEnabled = true;

    @Column(name = "notify_attendance", nullable = false)
    @Builder.Default
    private Boolean notifyAttendance = true;

    @Column(name = "notify_marks", nullable = false)
    @Builder.Default
    private Boolean notifyMarks = true;

    @Column(name = "notify_dns", nullable = false)
    @Builder.Default
    private Boolean notifyDns = true;

    @Column(name = "notify_claims", nullable = false)
    @Builder.Default
    private Boolean notifyClaims = true;

    @Column(name = "notify_system", nullable = false)
    @Builder.Default
    private Boolean notifySystem = true;

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
