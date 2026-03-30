package com.auca.attendance.repository;

import com.auca.attendance.entity.SeatAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SeatAssignmentRepository extends JpaRepository<SeatAssignment, Long> {
    List<SeatAssignment> findByLayoutId(Long layoutId);
    Optional<SeatAssignment> findByLayoutIdAndStudentId(Long layoutId, Long studentId);
    boolean existsByLayoutIdAndRowNumberAndColumnNumber(Long layoutId, int rowNumber, int columnNumber);
    boolean existsByLayoutIdAndStudentId(Long layoutId, Long studentId);
}
