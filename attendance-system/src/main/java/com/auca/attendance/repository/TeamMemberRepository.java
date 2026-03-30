package com.auca.attendance.repository;

import com.auca.attendance.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);
    Optional<TeamMember> findByStudentIdAndTeamModuleId(Long studentId, Long moduleId);
    boolean existsByTeamIdAndStudentId(Long teamId, Long studentId);
    long countByTeamId(Long teamId);
    void deleteByTeamIdAndStudentId(Long teamId, Long studentId);
}
