package com.auca.attendance.repository;

import com.auca.attendance.entity.MarkEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MarkEntryRepository extends JpaRepository<MarkEntry, Long> {
    List<MarkEntry> findByColumnId(Long columnId);
    List<MarkEntry> findByStudentId(Long studentId);
    List<MarkEntry> findByColumnIdIn(List<Long> columnIds);
    Optional<MarkEntry> findByColumnIdAndStudentId(Long columnId, Long studentId);
    boolean existsByColumnId(Long columnId);
}
