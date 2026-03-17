package com.auca.attendance.repository;

import com.auca.attendance.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findAllByCohortYearAndDeletedAtIsNull(Integer cohortYear);
    List<Student> findAllByDeletedAtIsNull();
    Optional<Student> findByIdAndDeletedAtIsNull(Long id);
    boolean existsByEmail(String email);
    boolean existsByStudentId(String studentId);

    Page<Student> findByDeletedAtIsNull(Pageable pageable);
    Page<Student> findByCohortYearAndDeletedAtIsNull(Integer cohortYear, Pageable pageable);

    /** Finds the student whose login account matches the given user id. Used by the student portal. */
    Optional<Student> findByAccountId(Long userId);
}
