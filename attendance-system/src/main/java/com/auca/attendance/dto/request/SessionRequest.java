package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionRequest {
    @NotNull
    private LocalDate sessionDate;

    /** Optional. Defaults to 18:00 server-side. */
    private LocalTime startTime;

    /** Optional. Defaults to 21:00 server-side. */
    private LocalTime endTime;

    /** Optional. Always EVENING — set automatically. */
    private String period;
}
