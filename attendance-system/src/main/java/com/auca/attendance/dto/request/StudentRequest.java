package com.auca.attendance.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StudentRequest {
    @NotBlank
    private String studentId;

    @NotBlank
    private String name;

    @Email @NotBlank
    private String email;

    @NotNull @Min(2000)
    private Integer cohortYear;

    private String program;
    private String phone;

    /**
     * When true, a User account (role=STUDENT) is automatically created and
     * a welcome email with a temporary password is sent to the student's email.
     */
    private boolean createAccount = false;
}
