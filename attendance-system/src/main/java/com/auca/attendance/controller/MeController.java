package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ChangePasswordRequest;
import com.auca.attendance.dto.request.UpdatePreferencesRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.UserPreferencesResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.entity.UserPreferences;
import com.auca.attendance.repository.UserPreferencesRepository;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.service.AuditService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * Endpoints under {@code /api/v1/me} for the authenticated user's own
 * account-management actions (password change, notification preferences, etc.).
 */
@RestController
@RequestMapping("/api/v1/me")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class MeController {

    private final UserRepository userRepository;
    private final UserPreferencesRepository preferencesRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    /**
     * Change the authenticated user's password.
     * Verifies the supplied current password against the freshly-fetched stored hash.
     */
    @PostMapping("/password")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            @AuthenticationPrincipal User currentUser) {

        // Re-fetch fresh — never trust the principal's hashed password from the JWT-loaded entity.
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new BadCredentialsException("Invalid current password"));

        if (user.getPassword() == null
                || !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        auditService.log(user, "UPDATE", "User", user.getId(), "Password changed", null);

        return ResponseEntity.ok(ApiResponse.success("Password updated", null));
    }

    /** Get this user's notification preferences. Lazily creates a defaults row on first access. */
    @GetMapping("/preferences")
    @Transactional
    public ResponseEntity<ApiResponse<UserPreferencesResponse>> getPreferences(
            @AuthenticationPrincipal User currentUser) {
        UserPreferences prefs = loadOrCreate(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(toResponse(prefs)));
    }

    /** Update this user's notification preferences. Lazily creates a row if none exists yet. */
    @PatchMapping("/preferences")
    @Transactional
    public ResponseEntity<ApiResponse<UserPreferencesResponse>> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request,
            @AuthenticationPrincipal User currentUser) {
        UserPreferences prefs = loadOrCreate(currentUser.getId());
        prefs.setEmailEnabled(request.getEmailEnabled());
        prefs.setPushEnabled(request.getPushEnabled());
        prefs.setNotifyAttendance(request.getNotifyAttendance());
        prefs.setNotifyMarks(request.getNotifyMarks());
        prefs.setNotifyDns(request.getNotifyDns());
        prefs.setNotifyClaims(request.getNotifyClaims());
        prefs.setNotifySystem(request.getNotifySystem());
        UserPreferences saved = preferencesRepository.save(prefs);
        return ResponseEntity.ok(ApiResponse.success("Preferences updated", toResponse(saved)));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private UserPreferences loadOrCreate(Long userId) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> preferencesRepository.save(UserPreferences.builder()
                        .userId(userId)
                        .emailEnabled(true)
                        .pushEnabled(true)
                        .notifyAttendance(true)
                        .notifyMarks(true)
                        .notifyDns(true)
                        .notifyClaims(true)
                        .notifySystem(true)
                        .build()));
    }

    private UserPreferencesResponse toResponse(UserPreferences p) {
        return UserPreferencesResponse.builder()
                .userId(p.getUserId())
                .emailEnabled(p.getEmailEnabled())
                .pushEnabled(p.getPushEnabled())
                .notifyAttendance(p.getNotifyAttendance())
                .notifyMarks(p.getNotifyMarks())
                .notifyDns(p.getNotifyDns())
                .notifyClaims(p.getNotifyClaims())
                .notifySystem(p.getNotifySystem())
                .build();
    }
}
