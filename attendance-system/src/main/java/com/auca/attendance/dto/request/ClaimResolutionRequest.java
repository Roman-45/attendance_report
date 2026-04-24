package com.auca.attendance.dto.request;

import com.auca.attendance.enums.ClaimStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ClaimResolutionRequest {
    @NotNull
    private ClaimStatus status;
    private String resolutionNote;
}
