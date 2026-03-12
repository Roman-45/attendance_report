package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionRequest {
    @NotNull
    private LocalDate sessionDate;

    @NotNull
    private LocalTime startTime;

    private LocalTime endTime;
    private String period;
}
