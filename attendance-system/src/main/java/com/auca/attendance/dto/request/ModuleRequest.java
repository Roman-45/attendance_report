package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class ModuleRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String name;

    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
}
