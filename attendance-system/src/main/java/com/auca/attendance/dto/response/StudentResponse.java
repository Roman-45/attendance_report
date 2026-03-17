package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StudentResponse {
    private Long id;
    private String studentId;
    private String name;
    private String email;
    private Integer cohortYear;
    private String program;
    private String phone;
    private String profilePhotoUrl;
    /** True when this student has a login account (User row with role=STUDENT). */
    private boolean hasAccount;
    /** The linked User id, present only when hasAccount=true. */
    private Long accountUserId;
}
