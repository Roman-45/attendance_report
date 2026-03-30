package com.auca.attendance.controller;

import com.auca.attendance.dto.request.TeamMembersRequest;
import com.auca.attendance.dto.request.TeamRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.TeamMemberResponse;
import com.auca.attendance.dto.response.TeamResponse;
import com.auca.attendance.service.TeamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules/{moduleId}/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<TeamResponse>> createTeam(
            @PathVariable Long moduleId,
            @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.createTeam(moduleId, request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','TEAM_LEADER','STUDENT')")
    public ResponseEntity<ApiResponse<List<TeamResponse>>> getTeams(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamsForModule(moduleId)));
    }

    @GetMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','TEAM_LEADER','STUDENT')")
    public ResponseEntity<ApiResponse<TeamResponse>> getTeam(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamById(teamId)));
    }

    @PutMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<TeamResponse>> updateTeam(
            @PathVariable Long teamId,
            @Valid @RequestBody TeamRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.updateTeam(teamId, request)));
    }

    @DeleteMapping("/{teamId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Void>> deleteTeam(@PathVariable Long teamId) {
        teamService.deleteTeam(teamId);
        return ResponseEntity.ok(ApiResponse.success("Team deleted", null));
    }

    @PostMapping("/{teamId}/members")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> addMembers(
            @PathVariable Long teamId,
            @Valid @RequestBody TeamMembersRequest request) {
        return ResponseEntity.ok(ApiResponse.success(teamService.addMembers(teamId, request)));
    }

    @DeleteMapping("/{teamId}/members/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<ApiResponse<Void>> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long studentId) {
        teamService.removeMember(teamId, studentId);
        return ResponseEntity.ok(ApiResponse.success("Member removed", null));
    }

    @GetMapping("/{teamId}/members")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR','TEAM_LEADER','STUDENT')")
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getMembers(@PathVariable Long teamId) {
        return ResponseEntity.ok(ApiResponse.success(teamService.getTeamMembers(teamId)));
    }
}
