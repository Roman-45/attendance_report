package com.auca.attendance.controller;

import com.auca.attendance.service.ReportGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportGenerationService reportService;

    @GetMapping("/modules/{moduleId}/attendance/excel")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<byte[]> attendanceExcel(@PathVariable Long moduleId) throws Exception {
        byte[] data = reportService.generateAttendanceExcel(moduleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_" + moduleId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/modules/{moduleId}/attendance/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','FACILITATOR')")
    public ResponseEntity<byte[]> attendancePdf(@PathVariable Long moduleId) throws Exception {
        byte[] data = reportService.generateAttendancePdf(moduleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_" + moduleId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }

    @GetMapping("/modules/{moduleId}/marks/excel")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<byte[]> marksExcel(@PathVariable Long moduleId) throws Exception {
        byte[] data = reportService.generateMarksExcel(moduleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=marks_" + moduleId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping("/modules/{moduleId}/marks/pdf")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<byte[]> marksPdf(@PathVariable Long moduleId) throws Exception {
        byte[] data = reportService.generateMarksPdf(moduleId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=marks_" + moduleId + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(data);
    }
}
