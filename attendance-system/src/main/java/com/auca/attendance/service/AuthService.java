package com.auca.attendance.service;

import com.auca.attendance.dto.request.LoginRequest;
import com.auca.attendance.dto.request.RefreshTokenRequest;
import com.auca.attendance.dto.request.VerifyMfaRequest;
import com.auca.attendance.dto.response.AuthResponse;
import com.auca.attendance.entity.RefreshToken;
import com.auca.attendance.entity.User;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final MfaService mfaService;

    /**
     * Step 1 of login.
     * - If MFA is disabled → return full tokens immediately.
     * - If MFA is enabled  → send OTP email, return mfaRequired=true (no tokens yet).
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail()).orElseThrow();

        if (Boolean.TRUE.equals(user.getMfaEnabled())) {
            mfaService.sendLoginOtp(user);
            return AuthResponse.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .mfaRequired(true)
                    .build();
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    /**
     * Step 2 of login when MFA is enabled.
     * Validates the OTP and returns full tokens.
     */
    @Transactional
    public AuthResponse verifyMfa(VerifyMfaRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!mfaService.verifyOtp(user, request.getOtp())) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        String accessToken = jwtService.generateToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, accessToken, refreshToken.getToken());
    }

    /**
     * Issue a new access token using a valid refresh token.
     * Old refresh token is revoked and a new one issued (rotation).
     */
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken oldToken = refreshTokenService.verifyAndGet(request.getRefreshToken());
        User user = oldToken.getUser();

        // Rotate: revoke old, issue new pair
        refreshTokenService.revoke(request.getRefreshToken());
        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken.getToken());
    }

    /**
     * Revoke the provided refresh token (single-device logout).
     */
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.getRefreshToken());
    }

    // ─── Mapper ─────────────────────────────────────────────────────────────
    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }
}
