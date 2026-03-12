package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class AttendanceRecordRequest {
    @NotNull
    private Long studentId;

    @NotNull
    @Pattern(regexp = "PRESENT|ABSENT|LATE|EXCUSED")
    private String status;

    private String notes;
}
