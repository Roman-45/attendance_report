package com.auca.attendance.controller;

import com.auca.attendance.dto.request.InviteTeamLeaderRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.service.InvitationService;
import jakarta.validation.Valid;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserRepository userRepository;
    private final InvitationService invitationService;

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String name;
        private String email;
        private String role;
        private boolean active;
        private boolean emailVerified;
        private boolean googleLinked;
        private OffsetDateTime createdAt;
    }

    @Transactional(readOnly = true)
    @GetMapping
    public ResponseEntity<ApiResponse<Page<UserSummary>>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());

        Role roleFilter = null;
        if (role != null && !role.isBlank()) {
            try { roleFilter = Role.valueOf(role.toUpperCase()); } catch (IllegalArgumentException ignored) {}
        }

        Page<User> users;
        boolean hasSearch = search != null && !search.isBlank();
        if (hasSearch && roleFilter != null) {
            users = userRepository.searchByNameOrEmailAndRole(search, roleFilter, pageable);
        } else if (hasSearch) {
            users = userRepository.searchByNameOrEmail(search, pageable);
        } else if (roleFilter != null) {
            users = userRepository.findByRole(roleFilter, pageable);
        } else {
            users = userRepository.findAll(pageable);
        }

        Page<UserSummary> result = users.map(this::toSummary);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @Transactional
    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<UserSummary>> updateRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User currentUser) {

        if (id.equals(currentUser.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot change your own role"));
        }

        User user = findUser(id);
        try {
            user.setRole(Role.valueOf(body.get("role").toUpperCase()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid role value"));
        }
        return ResponseEntity.ok(ApiResponse.success("Role updated", toSummary(userRepository.save(user))));
    }

    @Transactional
    @PatchMapping("/{id}/active")
    public ResponseEntity<ApiResponse<UserSummary>> updateActive(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal User currentUser) {

        if (id.equals(currentUser.getId())) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Cannot deactivate your own account"));
        }

        User user = findUser(id);
        user.setActive(body.getOrDefault("active", true));
        return ResponseEntity.ok(ApiResponse.success(
                user.getActive() ? "Account activated" : "Account deactivated",
                toSummary(userRepository.save(user))));
    }

    /**
     * POST /api/v1/admin/users/invite-team-leader
     * Creates a TEAM_LEADER account, assigns them to a team, and sends an invitation email.
     */
    @PostMapping("/invite-team-leader")
    public ResponseEntity<ApiResponse<UserSummary>> inviteTeamLeader(
            @Valid @RequestBody InviteTeamLeaderRequest request,
            @AuthenticationPrincipal User admin) {

        User invited = invitationService.inviteTeamLeader(request, admin);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Team leader invitation sent to " + invited.getEmail(),
                        toSummary(invited)));
    }

    private User findUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

    private UserSummary toSummary(User u) {
        return UserSummary.builder()
                .id(u.getId())
                .name(u.getName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .active(Boolean.TRUE.equals(u.getActive()))
                .emailVerified(Boolean.TRUE.equals(u.getEmailVerified()))
                .googleLinked(u.getGoogleId() != null)
                .createdAt(u.getCreatedAt())
                .build();
    }
}
