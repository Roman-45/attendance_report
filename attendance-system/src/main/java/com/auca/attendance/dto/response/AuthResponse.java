package com.auca.attendance.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private Long userId;
    private String name;
    private String email;
    private String role;
    /** True when MFA is enabled — client must call /auth/verify-mfa with the OTP. */
    @Builder.Default
    private boolean mfaRequired = false;
    /** Relative URL to user's profile photo, null if not set. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String photoUrl;
    /**
     * True when the account was just created via Google OAuth and the user should
     * be redirected to the profile page to complete their details (name / student ID).
     */
    @Builder.Default
    private boolean profileIncomplete = false;
}
