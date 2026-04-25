package com.auca.attendance.repository;

import com.auca.attendance.entity.Claim;
import com.auca.attendance.enums.ClaimStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClaimRepository extends JpaRepository<Claim, Long> {
    List<Claim> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    Page<Claim> findByModuleIdOrderByCreatedAtDesc(Long moduleId, Pageable pageable);
    Page<Claim> findByModuleIdAndStatus(Long moduleId, ClaimStatus status, Pageable pageable);
    Page<Claim> findByStatusOrderByCreatedAtDesc(ClaimStatus status, Pageable pageable);
    long countByStatus(ClaimStatus status);
}
