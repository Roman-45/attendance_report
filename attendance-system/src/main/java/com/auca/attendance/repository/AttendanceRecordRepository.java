package com.auca.attendance.repository;

import com.auca.attendance.entity.AttendanceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    List<AttendanceRecord> findBySessionId(Long sessionId);
    List<AttendanceRecord> findByStudentId(Long studentId);
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
}
