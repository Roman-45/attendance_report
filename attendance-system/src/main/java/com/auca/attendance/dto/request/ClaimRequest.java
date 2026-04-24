package com.auca.attendance.dto.request;

import com.auca.attendance.enums.ClaimType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimRequest {
    @NotNull
    private Long moduleId;
    @NotNull
    private ClaimType claimType;
    private Long targetId;
    @NotBlank
    private String description;
}
