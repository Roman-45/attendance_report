package com.auca.attendance.dto.request;

import jakarta.validation.constraints.Min;
import lombok.Data;

@Data
public class ClassroomLayoutRequest {
    @Min(1)
    private Integer totalRows = 13;
    @Min(1)
    private Integer columnsPerRow = 4;
    @Min(1)
    private Integer columnGroups = 2;
}
