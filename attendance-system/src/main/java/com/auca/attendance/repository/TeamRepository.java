package com.auca.attendance.repository;

import com.auca.attendance.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByModuleId(Long moduleId);
    Optional<Team> findByModuleIdAndLeaderId(Long moduleId, Long leaderId);
    boolean existsByModuleIdAndName(Long moduleId, String name);
    List<Team> findByLeaderId(Long leaderId);
}
