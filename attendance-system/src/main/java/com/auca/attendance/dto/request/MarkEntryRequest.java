package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class MarkEntryRequest {
    @NotNull
    private Long studentId;

    private BigDecimal score;
}
