package com.auca.attendance.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class EnrollStudentsRequest {

    @NotEmpty(message = "At least one student ID is required")
    private List<Long> studentIds;
}
