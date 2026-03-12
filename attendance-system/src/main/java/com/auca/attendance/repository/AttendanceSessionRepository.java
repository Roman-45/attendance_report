package com.auca.attendance.repository;

import com.auca.attendance.entity.AttendanceSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {
    List<AttendanceSession> findByModuleIdOrderBySessionDateDescStartTimeDesc(Long moduleId);
    List<AttendanceSession> findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(Long moduleId);
}
