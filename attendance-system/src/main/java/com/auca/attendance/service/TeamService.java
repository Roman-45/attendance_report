package com.auca.attendance.service;

import com.auca.attendance.dto.request.TeamMembersRequest;
import com.auca.attendance.dto.request.TeamRequest;
import com.auca.attendance.dto.response.TeamMemberResponse;
import com.auca.attendance.dto.response.TeamResponse;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.TeamMember;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.EnrollmentRepository;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.TeamMemberRepository;
import com.auca.attendance.repository.TeamRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamRepository teamRepo;
    private final TeamMemberRepository memberRepo;
    private final ModuleRepository moduleRepo;
    private final StudentRepository studentRepo;
    private final EnrollmentRepository enrollmentRepo;

    @Transactional
    public TeamResponse createTeam(Long moduleId, TeamRequest request) {
        Module module = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        if (teamRepo.existsByModuleIdAndName(moduleId, request.getName())) {
            throw new IllegalArgumentException("A team with this name already exists in this module");
        }

        Team team = Team.builder()
                .module(module)
                .name(request.getName())
                .build();

        if (request.getLeaderStudentId() != null) {
            Student leader = studentRepo.findById(request.getLeaderStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Leader student not found"));
            team.setLeader(leader);
        }

        team = teamRepo.save(team);
        return toResponse(team);
    }

    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsForModule(Long moduleId) {
        return teamRepo.findByModuleId(moduleId).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TeamResponse getTeamById(Long teamId) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
        return toResponse(team);
    }

    @Transactional
    public TeamResponse updateTeam(Long teamId, TeamRequest request) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        team.setName(request.getName());
        if (request.getLeaderStudentId() != null) {
            Student leader = studentRepo.findById(request.getLeaderStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Leader student not found"));
            team.setLeader(leader);
        } else {
            team.setLeader(null);
        }

        return toResponse(teamRepo.save(team));
    }

    @Transactional
    public void deleteTeam(Long teamId) {
        if (!teamRepo.existsById(teamId)) {
            throw new ResourceNotFoundException("Team not found");
        }
        teamRepo.deleteById(teamId);
    }

    @Transactional
    public List<TeamMemberResponse> addMembers(Long teamId, TeamMembersRequest request) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        Long moduleId = team.getModule().getId();
        for (Long studentId : request.getStudentIds()) {
            if (memberRepo.existsByTeamIdAndStudentId(teamId, studentId)) continue;

            Student student = studentRepo.findById(studentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Student " + studentId + " not found"));

            boolean enrolled = enrollmentRepo.existsByStudentIdAndModuleId(studentId, moduleId);
            if (!enrolled) {
                throw new IllegalArgumentException("Student " + student.getName() + " is not enrolled in this module");
            }

            memberRepo.save(TeamMember.builder().team(team).student(student).build());
        }

        return getTeamMembers(teamId);
    }

    @Transactional
    public void removeMember(Long teamId, Long studentId) {
        memberRepo.deleteByTeamIdAndStudentId(teamId, studentId);
    }

    @Transactional(readOnly = true)
    public List<TeamMemberResponse> getTeamMembers(Long teamId) {
        return memberRepo.findByTeamId(teamId).stream().map(this::toMemberResponse).toList();
    }

    /** Check if a student is the leader of any team in the given module. */
    @Transactional(readOnly = true)
    public boolean isTeamLeader(Long studentId, Long moduleId) {
        return teamRepo.findByModuleIdAndLeaderId(moduleId, studentId).isPresent();
    }

    /** Get the team a student belongs to in a module. */
    @Transactional(readOnly = true)
    public TeamResponse getStudentTeam(Long studentId, Long moduleId) {
        TeamMember membership = memberRepo.findByStudentIdAndTeamModuleId(studentId, moduleId)
                .orElse(null);
        if (membership == null) return null;
        return toResponse(membership.getTeam());
    }

    /** Get all teams where the given student is the leader. */
    @Transactional(readOnly = true)
    public List<TeamResponse> getTeamsByLeader(Long studentId) {
        return teamRepo.findByLeaderId(studentId).stream().map(this::toResponse).toList();
    }

    private TeamResponse toResponse(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .moduleId(team.getModule().getId())
                .moduleName(team.getModule().getName())
                .name(team.getName())
                .leaderStudentId(team.getLeader() != null ? team.getLeader().getId() : null)
                .leaderStudentName(team.getLeader() != null ? team.getLeader().getName() : null)
                .memberCount((int) memberRepo.countByTeamId(team.getId()))
                .createdAt(team.getCreatedAt())
                .build();
    }

    private TeamMemberResponse toMemberResponse(TeamMember tm) {
        return TeamMemberResponse.builder()
                .id(tm.getId())
                .studentId(tm.getStudent().getId())
                .studentName(tm.getStudent().getName())
                .registrationNumber(tm.getStudent().getStudentId())
                .joinedAt(tm.getJoinedAt())
                .build();
    }
}
