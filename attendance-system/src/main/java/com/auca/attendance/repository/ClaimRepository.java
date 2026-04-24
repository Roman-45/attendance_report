package com.auca.attendance.repository;

import com.auca.attendance.entity.Claim;
import com.auca.attendance.enums.ClaimStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    List<Claim> findByModuleIdOrderByCreatedAtDesc(Long moduleId);
    List<Claim> findByModuleIdAndStatus(Long moduleId, ClaimStatus status);
    List<Claim> findByStatusOrderByCreatedAtDesc(ClaimStatus status);
    long countByStatus(ClaimStatus status);
}
