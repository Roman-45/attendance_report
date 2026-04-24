package com.auca.attendance.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkSeatAssignmentRequest {
    @NotEmpty
    @Valid
    private List<SeatAssignmentRequest> assignments;
}
