package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePreferencesRequest {

    @NotNull
    private Boolean emailEnabled;

    @NotNull
    private Boolean pushEnabled;

    @NotNull
    private Boolean notifyAttendance;

    @NotNull
    private Boolean notifyMarks;

    @NotNull
    private Boolean notifyDns;

    @NotNull
    private Boolean notifyClaims;

    @NotNull
    private Boolean notifySystem;
}
