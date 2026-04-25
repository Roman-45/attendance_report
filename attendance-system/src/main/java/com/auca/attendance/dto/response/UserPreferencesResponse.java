package com.auca.attendance.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPreferencesResponse {
    private Long userId;
    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean notifyAttendance;
    private Boolean notifyMarks;
    private Boolean notifyDns;
    private Boolean notifyClaims;
    private Boolean notifySystem;
}
