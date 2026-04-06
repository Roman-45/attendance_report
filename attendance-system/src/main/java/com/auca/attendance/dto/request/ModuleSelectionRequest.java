package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModuleSelectionRequest {
    @NotNull(message = "moduleId is required")
    private Long moduleId;
}
