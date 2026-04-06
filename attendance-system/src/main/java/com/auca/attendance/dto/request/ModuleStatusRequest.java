package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ModuleStatusRequest {
    @NotBlank(message = "status is required")
    private String status;
}
