package com.auca.attendance.repository;

import com.auca.attendance.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    List<Enrollment> findByModuleId(Long moduleId);

    List<Enrollment> findByStudentId(Long studentId);

    boolean existsByStudentIdAndModuleId(Long studentId, Long moduleId);

    void deleteByStudentIdAndModuleId(Long studentId, Long moduleId);
}
