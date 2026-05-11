package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

/** Lightweight projection of an INSTRUCTOR user used by the "Assign instructor" dropdown. */
@Data
@Builder
public class InstructorCandidate {
    private Long id;
    private String name;
    private String email;
    /** ID of the module this instructor currently teaches, or null if free. */
    private Long currentModuleId;
    /** Code of the module (e.g. "CS101") this instructor currently teaches, or null. */
    private String currentModuleCode;
}
