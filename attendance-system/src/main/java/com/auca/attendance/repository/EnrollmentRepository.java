package com.auca.attendance.repository;

import com.auca.attendance.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByModuleId(Long moduleId);

    List<Enrollment> findByStudentId(Long studentId);

    boolean existsByStudentIdAndModuleId(Long studentId, Long moduleId);

    Optional<Enrollment> findByStudentIdAndModuleId(Long studentId, Long moduleId);

    // Derived delete requires an explicit transaction — Spring Data does not add one automatically
    @Transactional
    void deleteByStudentIdAndModuleId(Long studentId, Long moduleId);
}
