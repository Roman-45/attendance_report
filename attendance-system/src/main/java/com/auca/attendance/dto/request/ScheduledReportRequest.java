package com.auca.attendance.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ScheduledReportRequest {
    @NotNull
    private Long moduleId;
    @NotBlank
    private String reportType;
    @NotBlank
    @Pattern(regexp = "DAILY|WEEKLY|MONTHLY")
    private String frequency;
    @NotBlank @Email
    private String recipientEmail;
}
