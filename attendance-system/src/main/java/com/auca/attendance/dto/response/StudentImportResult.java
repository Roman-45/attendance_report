package com.auca.attendance.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StudentImportResult {

    private int imported;
    private int skipped;
    private List<ImportError> errors;

    @Data
    @Builder
    public static class ImportError {
        /** 1-based row number in the file (header = row 1, first data row = row 2). */
        private int row;
        private String studentId;
        private String reason;
    }
}
