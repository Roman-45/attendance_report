package com.auca.attendance.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class StudentRequest {
    /** Optional. Auto-generated as AUCA{YY}-{seq} when blank. */
    private String studentId;

    @NotBlank
    private String name;

    /** Optional. Service rejects duplicates only when set. */
    @Email
    private String email;

    /** Optional. Defaults to the current academic year. */
    @Min(2000)
    private Integer cohortYear;

    /** The program / department the student belongs to (e.g., "Computer Science"). */
    private String program;
    private String phone;

    /**
     * When true, a User account (role=STUDENT) is automatically created and
     * a welcome email with a temporary password is sent to the student's email.
     */
    private boolean createAccount = false;
}
