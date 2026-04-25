package com.auca.attendance.repository;

import com.auca.attendance.entity.AttendanceRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);
    List<AttendanceRecord> findByStudentId(Long studentId);
    Page<AttendanceRecord> findByStudentId(Long studentId, Pageable pageable);
    List<AttendanceRecord> findByStudentIdAndSessionIdIn(Long studentId, List<Long> sessionIds);
    Optional<AttendanceRecord> findBySessionIdAndStudentId(Long sessionId, Long studentId);

    @Query("""
        SELECT COUNT(r) FROM AttendanceRecord r
        WHERE r.student.id = :studentId
          AND r.session.module.id = :moduleId
          AND r.status = 'ABSENT'
        """)
    long countAbsencesByStudentAndModule(@Param("studentId") Long studentId,
                                         @Param("moduleId") Long moduleId);

    @Query("""
        SELECT COUNT(r) FROM AttendanceRecord r
        WHERE r.student.id = :studentId
          AND r.session.module.id = :moduleId
        """)
    long countTotalByStudentAndModule(@Param("studentId") Long studentId,
                                      @Param("moduleId") Long moduleId);

    /**
     * Returns true if a threshold alert has already been fired for this student+module.
     * Used to prevent duplicate alerts.
     */
    @Query("""
        SELECT COUNT(r) > 0 FROM AttendanceRecord r
        WHERE r.student.id = :studentId
          AND r.session.module.id = :moduleId
          AND r.thresholdAlertSent = true
        """)
    boolean thresholdAlertAlreadySent(@Param("studentId") Long studentId,
                                      @Param("moduleId") Long moduleId);

    /**
     * Finds the most recent attendance record for a student in a module,
     * used to stamp thresholdAlertSent=true on the triggering record.
     */
    @Query("""
        SELECT r FROM AttendanceRecord r
        WHERE r.student.id = :studentId
          AND r.session.module.id = :moduleId
        ORDER BY r.session.sessionDate DESC, r.session.startTime DESC
        LIMIT 1
        """)
    Optional<AttendanceRecord> findLatestByStudentAndModule(
            @Param("studentId") Long studentId,
            @Param("moduleId") Long moduleId);
}
