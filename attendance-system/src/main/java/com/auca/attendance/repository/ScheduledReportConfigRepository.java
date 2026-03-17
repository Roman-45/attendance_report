package com.auca.attendance.repository;

import com.auca.attendance.entity.ScheduledReportConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ScheduledReportConfigRepository extends JpaRepository<ScheduledReportConfig, Long> {
    List<ScheduledReportConfig> findByEnabledTrueAndFrequency(String frequency);
    List<ScheduledReportConfig> findByModuleId(Long moduleId);
}
