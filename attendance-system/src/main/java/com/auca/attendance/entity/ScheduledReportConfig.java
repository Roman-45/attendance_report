package com.auca.attendance.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "scheduled_report_config")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledReportConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "module_id", nullable = false)
    private Module module;

    @Column(name = "report_type", nullable = false, length = 30)
    private String reportType;

    @Column(nullable = false, length = 20)
    private String frequency;

    @Column(name = "recipient_email", nullable = false, length = 150)
    private String recipientEmail;

    @Builder.Default
    @Column(nullable = false)
    private Boolean enabled = true;

    @Column(name = "last_sent_at")
    private OffsetDateTime lastSentAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = OffsetDateTime.now(); }
}
