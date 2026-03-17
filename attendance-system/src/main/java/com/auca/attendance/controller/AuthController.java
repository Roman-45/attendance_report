package com.auca.attendance.controller;

import com.auca.attendance.dto.request.*;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.AuthResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.AuthService;
import com.auca.attendance.service.MfaService;
import com.auca.attendance.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final MfaService mfaService;

    /** Standard email + password login. Returns access token + refresh token. */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    /** Self-service registration for STUDENT or INSTRUCTOR roles. Sends verification email. */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful. Please check your email to verify your account.",
                        authService.register(request)));
    }

    /** Activate account using the 6-digit OTP from the verification email. */
    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Void>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully. You can now log in.", null));
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
     * Step 2 of login when MFA is enabled: submit the 6-digit OTP received by email.
     * Returns full access + refresh tokens on success.
     */
    @PostMapping("/verify-mfa")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyMfa(
            @Valid @RequestBody VerifyMfaRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.verifyMfa(request)));
    }

    /**
     * Initiate enabling MFA: sends a confirmation OTP to the authenticated user's email.
     */
    @PostMapping("/mfa/enable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> initMfaEnable(
            @AuthenticationPrincipal User user) {
        mfaService.sendEnableOtp(user);
        return ResponseEntity.ok(ApiResponse.success(
                "OTP sent to " + user.getEmail() + ". Call /auth/mfa/confirm with the code.", null));
    }

    /**
     * Confirm enabling MFA: validates the OTP and sets mfa_enabled=true.
     */
    @PostMapping("/mfa/confirm")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> confirmMfaEnable(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody VerifyMfaRequest request) {
        mfaService.enableMfa(user, request.getOtp());
        return ResponseEntity.ok(ApiResponse.success("Two-factor authentication enabled", null));
    }

    /**
     * Disable MFA for the authenticated user.
     */
    @PostMapping("/mfa/disable")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> disableMfa(@AuthenticationPrincipal User user) {
        mfaService.disableMfa(user);
        return ResponseEntity.ok(ApiResponse.success("Two-factor authentication disabled", null));
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
