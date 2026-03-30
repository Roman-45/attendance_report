package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.ImportResult;
import com.auca.attendance.dto.response.TeamMemberResponse;
import com.auca.attendance.dto.response.TeamResponse;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.TeamRepository;
import com.auca.attendance.service.TeamLeaderImportService;
import com.auca.attendance.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/team-leader")
@RequiredArgsConstructor
public class TeamLeaderController {

    private final TeamLeaderImportService teamLeaderImportService;
    private final TeamService teamService;
    private final StudentRepository studentRepo;
    private final TeamRepository teamRepo;

    /**
     * POST /api/v1/team-leader/teams/{teamId}/import
     * Import team members from an Excel (.xlsx) file.
     */
    @PostMapping("/teams/{teamId}/import")
    @PreAuthorize("hasAnyRole('TEAM_LEADER','ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<ImportResult>> importMembers(
            @PathVariable Long teamId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(ApiResponse.success(
                teamLeaderImportService.importTeamMembers(teamId, file, currentUser)));
    }

    /**
     * GET /api/v1/team-leader/my-teams
     * Returns all teams where the current user is the leader.
     */
    @GetMapping("/my-teams")
    @PreAuthorize("hasAnyRole('TEAM_LEADER','ADMIN','FACILITATOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getMyTeams(
            @AuthenticationPrincipal User currentUser) {

        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.FACILITATOR) {
            // Admins/facilitators don't have a student profile — return empty or all teams
            // For now return empty; they can use the main team endpoints
            return ResponseEntity.ok(ApiResponse.success(List.of()));
        }

        Student student = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No student profile linked to your account"));
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamsByLeader(student.getId())));
    }

    /**
     * GET /api/v1/team-leader/teams/{teamId}/members
     * Returns members of a team. Team leader can only see their own teams.
     */
    @GetMapping("/teams/{teamId}/members")
    @PreAuthorize("hasAnyRole('TEAM_LEADER','ADMIN','FACILITATOR')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getTeamMembers(
            @PathVariable Long teamId,
            @AuthenticationPrincipal User currentUser) {

        // Verify the user is allowed to see this team's members
        if (currentUser.getRole() == Role.TEAM_LEADER) {
            Team team = teamRepo.findById(teamId)
                    .orElseThrow(() -> new ResourceNotFoundException("Team not found"));
            Student student = studentRepo.findByAccountId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No student profile linked to your account"));
            if (team.getLeader() == null || !team.getLeader().getId().equals(student.getId())) {
                throw new IllegalArgumentException("You are not the leader of this team");
            }
        }

        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(teamId)));
    }
}
