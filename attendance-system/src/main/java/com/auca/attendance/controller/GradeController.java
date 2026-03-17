package com.auca.attendance.controller;

import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.dto.response.GradeResponse;
import com.auca.attendance.service.GradeComputationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class GradeController {

    private final GradeComputationService gradeService;

    @GetMapping("/modules/{moduleId}/grades")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<GradeResponse>>> getGrades(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success(gradeService.computeGradesForModule(moduleId)));
    }

    @PostMapping("/modules/{moduleId}/grades/compute")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<ApiResponse<List<GradeResponse>>> computeAndPersist(@PathVariable Long moduleId) {
        return ResponseEntity.ok(ApiResponse.success("Grades computed and saved",
                gradeService.computeAndPersistGrades(moduleId)));
    }

    @GetMapping("/modules/{moduleId}/students/{studentId}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','INSTRUCTOR')")
    public ResponseEntity<ApiResponse<GradeResponse>> getStudentGrade(
            @PathVariable Long moduleId, @PathVariable Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(gradeService.computeGradeForStudent(studentId, moduleId)));
    }
}
