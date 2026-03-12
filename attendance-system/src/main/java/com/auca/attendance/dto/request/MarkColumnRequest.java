package com.auca.attendance.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MarkColumnRequest {
    @NotBlank
    private String name;

    @NotBlank
    @Pattern(regexp = "MIDTERM|FINAL|QUIZ|CUSTOM")
    private String type;

    @NotNull @DecimalMin("0.0")
    private BigDecimal maxScore;
}
