package com.auca.attendance.service;

import com.auca.attendance.dto.request.EnrollStudentsRequest;
import com.auca.attendance.dto.response.EnrollmentResponse;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.EnrollmentRepository;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final ModuleRepository moduleRepository;

    /**
     * Enroll one or more students into a module.
     * Students already enrolled are skipped (idempotent).
     */
    @Transactional
    public List<EnrollmentResponse> enroll(Long moduleId, EnrollStudentsRequest request) {
        Module module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        return request.getStudentIds().stream()
                .map(studentId -> {
                    if (enrollmentRepository.existsByStudentIdAndModuleId(studentId, moduleId)) {
                        // Already enrolled — return existing record
                        return enrollmentRepository.findByModuleId(moduleId).stream()
                                .filter(e -> e.getStudent().getId().equals(studentId))
                                .findFirst()
                                .map(this::toResponse)
                                .orElseThrow();
                    }

                    Student student = studentRepository.findByIdAndDeletedAtIsNull(studentId)
                            .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));

                    Enrollment enrollment = Enrollment.builder()
                            .student(student)
                            .module(module)
                            .build();
                    return toResponse(enrollmentRepository.save(enrollment));
                })
                .toList();
    }

    /**
     * Remove a student from a module.
     */
    @Transactional
    public void unenroll(Long moduleId, Long studentId) {
        if (!enrollmentRepository.existsByStudentIdAndModuleId(studentId, moduleId)) {
            throw new ResourceNotFoundException(
                    "Student " + studentId + " is not enrolled in module " + moduleId);
        }
        enrollmentRepository.deleteByStudentIdAndModuleId(studentId, moduleId);
    }

    /**
     * List all students enrolled in a module.
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getByModule(Long moduleId) {
        if (!moduleRepository.existsById(moduleId)) {
            throw new ResourceNotFoundException("Module not found: " + moduleId);
        }
        return enrollmentRepository.findByModuleId(moduleId)
                .stream().map(this::toResponse).toList();
    }

    /**
     * List all modules a student is enrolled in.
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getByStudent(Long studentId) {
        studentRepository.findByIdAndDeletedAtIsNull(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + studentId));
        return enrollmentRepository.findByStudentId(studentId)
                .stream().map(this::toResponse).toList();
    }

    /**
     * Check if a student is enrolled in a module (used by AttendanceService).
     */
    public boolean isEnrolled(Long studentId, Long moduleId) {
        return enrollmentRepository.existsByStudentIdAndModuleId(studentId, moduleId);
    }

    // ─── Mapper ─────────────────────────────────────────────────────────────
    private EnrollmentResponse toResponse(Enrollment e) {
        return EnrollmentResponse.builder()
                .enrollmentId(e.getId())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getName())
                .studentCode(e.getStudent().getStudentId())
                .program(e.getStudent().getProgram())
                .moduleId(e.getModule().getId())
                .moduleName(e.getModule().getName())
                .enrolledAt(e.getEnrolledAt())
                .build();
    }
}
