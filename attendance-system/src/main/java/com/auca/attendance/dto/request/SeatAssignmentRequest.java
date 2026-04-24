package com.auca.attendance.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SeatAssignmentRequest {
    @NotNull
    private Long studentId;
    @NotNull @Min(1)
    private Integer rowNumber;
    @NotNull @Min(1)
    private Integer columnNumber;
}
