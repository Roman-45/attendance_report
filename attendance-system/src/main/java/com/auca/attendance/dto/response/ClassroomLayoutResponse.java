package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ClassroomLayoutResponse {
    private Long id;
    private int totalRows;
    private int columnsPerRow;
    private int columnGroups;
    private List<SeatAssignmentResponse> seats;
}
