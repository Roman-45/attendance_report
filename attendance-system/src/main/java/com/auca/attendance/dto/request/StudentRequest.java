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
}
