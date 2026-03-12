package com.auca.attendance.repository;

import com.auca.attendance.entity.MarkColumn;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MarkColumnRepository extends JpaRepository<MarkColumn, Long> {
    List<MarkColumn> findByModuleId(Long moduleId);
    boolean existsByModuleIdAndName(Long moduleId, String name);
}
