package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ForgotPasswordRequest;
import com.auca.attendance.dto.request.LoginRequest;
import com.auca.attendance.dto.request.RefreshTokenRequest;
import com.auca.attendance.dto.request.ResetPasswordRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.AuthResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.AuthService;
import com.auca.attendance.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    /** Standard email + password login. Returns access token + refresh token. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    /** Return the currently authenticated user's profile. */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthResponse>> me(@AuthenticationPrincipal User user) {
        AuthResponse response = AuthResponse.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Step 1 of password reset: request a 6-digit OTP sent to the given email.
     * Always returns 200 even if email is not registered (prevents user enumeration).
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        return ResponseEntity.ok(ApiResponse.success(
                "If that email is registered you will receive an OTP shortly", null));
    }

    /**
     * Step 2 of password reset: submit OTP + new password.
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", null));
    }

    /**
     * Issue a new access token using a valid refresh token (token rotation).
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }

    /**
     * Revoke the provided refresh token (logout from this device).
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }
}
