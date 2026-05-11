package com.auca.attendance.controller;

import com.auca.attendance.dto.request.CreateUserRequest;
import com.auca.attendance.dto.request.InviteTeamLeaderRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ConflictException;
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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserManagementController {

    private final UserRepository    userRepository;
    private final InvitationService invitationService;
    private final PasswordEncoder   passwordEncoder;
    private final JavaMailSender    mailSender;

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

    /**
     * POST /api/v1/admin/users
     * Creates a new user account directly. Admin picks the role. If no
     * password is supplied, a temporary one is generated and emailed.
     */
    @Transactional
    @PostMapping
    public ResponseEntity<ApiResponse<UserSummary>> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use: " + request.getEmail());
        }

        boolean generatedPassword = request.getPassword() == null || request.getPassword().isBlank();
        String rawPassword = generatedPassword ? generateTempPassword(12) : request.getPassword();

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .active(true)
                .emailVerified(true)   // admin-created accounts are pre-verified
                .build();

        user = userRepository.save(user);

        if (generatedPassword) {
            sendCredentialsEmail(user.getEmail(), user.getName(), rawPassword);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        generatedPassword
                                ? "User created. Temporary password emailed to " + user.getEmail()
                                : "User created.",
                        toSummary(user)));
    }

    private static final String TEMP_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    private String generateTempPassword(int length) {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TEMP_CHARS.charAt(rng.nextInt(TEMP_CHARS.length())));
        }
        return sb.toString();
    }

    private void sendCredentialsEmail(String to, String name, String tempPassword) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setSubject("[AUCA] Your AUCA Attendance Portal account");
            mail.setText(String.format(
                    "Hello %s,%n%n" +
                    "An administrator has created an account for you.%n%n" +
                    "Email: %s%nTemporary password: %s%n%n" +
                    "Please log in and change your password immediately.%n%n" +
                    "Login: http://localhost:5173%n",
                    name, to, tempPassword));
            mailSender.send(mail);
        } catch (Exception ignored) {
            // Mail failures shouldn't block account creation in dev.
        }
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
