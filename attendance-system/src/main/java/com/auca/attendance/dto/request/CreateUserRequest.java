package com.auca.attendance.dto.request;

import com.auca.attendance.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Admin-only payload to create a new user account directly (no invitation flow).
 * If {@code password} is blank, the server generates a temporary password and
 * emails it to the new user.
 */
@Data
public class CreateUserRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Must be a valid email address")
    private String email;

    @NotNull(message = "Role is required")
    private Role role;

    /** Optional. Temp password is generated when blank. */
    private String password;
}
