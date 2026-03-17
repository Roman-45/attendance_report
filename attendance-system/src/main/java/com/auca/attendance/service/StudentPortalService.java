package com.auca.attendance.service;

import com.auca.attendance.dto.response.AttendanceRecordResponse;
import com.auca.attendance.dto.response.EnrollmentResponse;
import com.auca.attendance.dto.response.MarkEntryResponse;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.MarkEntry;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.AttendanceRecordRepository;
import com.auca.attendance.repository.EnrollmentRepository;
import com.auca.attendance.repository.MarkEntryRepository;
import com.auca.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StudentPortalService {

    private final StudentRepository          studentRepo;
    private final EnrollmentRepository       enrollmentRepo;
    private final AttendanceRecordRepository recordRepo;
    private final MarkEntryRepository        markEntryRepo;
    private final StudentService             studentService;

    /** Resolve the Student record linked to the authenticated STUDENT user. */
    @Transactional(readOnly = true)
    public Student resolveStudent(User currentUser) {
        return studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No student profile linked to this account"));
    }

    /** GET /me/profile — student's own profile. */
    @Transactional(readOnly = true)
    public StudentResponse getProfile(User currentUser) {
        return studentService.toResponse(resolveStudent(currentUser));
    }

    /** GET /me/modules — modules the student is currently enrolled in. */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyModules(User currentUser) {
        Student student = resolveStudent(currentUser);
        return enrollmentRepo.findByStudentId(student.getId())
                .stream().map(this::toEnrollmentResponse).toList();
    }

    /** GET /me/attendance — full attendance history across all modules. */
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getMyAttendance(User currentUser) {
        Student student = resolveStudent(currentUser);
        return recordRepo.findByStudentId(student.getId())
                .stream().map(this::toRecordResponse).toList();
    }

    /** GET /me/attendance/{moduleId} — attendance for one specific module. */
    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getMyAttendanceForModule(User currentUser, Long moduleId) {
        Student student = resolveStudent(currentUser);

        // Enforce that the student is actually enrolled in this module
        if (!enrollmentRepo.existsByStudentIdAndModuleId(student.getId(), moduleId)) {
            throw new ResourceNotFoundException(
                    "You are not enrolled in module " + moduleId);
        }

        return recordRepo.findByStudentId(student.getId())
                .stream()
                .filter(r -> r.getSession().getModule().getId().equals(moduleId))
                .map(this::toRecordResponse)
                .toList();
    }

    /** GET /me/marks — all mark entries across every enrolled module. */
    @Transactional(readOnly = true)
    public List<MarkEntryResponse> getMyMarks(User currentUser) {
        Student student = resolveStudent(currentUser);
        return markEntryRepo.findByStudentId(student.getId())
                .stream().map(this::toMarkResponse).toList();
    }

    /**
     * GET /me/absence-summary — per-module breakdown: total sessions, absences,
     * absence %, configured threshold, and whether the threshold was crossed.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMyAbsenceSummary(User currentUser) {
        Student student = resolveStudent(currentUser);
        List<Enrollment> enrollments = enrollmentRepo.findByStudentId(student.getId());

        List<Map<String, Object>> summary = new ArrayList<>();
        for (Enrollment e : enrollments) {
            Long moduleId = e.getModule().getId();
            long total    = recordRepo.countTotalByStudentAndModule(student.getId(), moduleId);
            long absences = recordRepo.countAbsencesByStudentAndModule(student.getId(), moduleId);
            int threshold = e.getModule().getAbsenceThresholdPercent() != null
                    ? e.getModule().getAbsenceThresholdPercent() : 25;

            double pct = total > 0 ? Math.round((double) absences / total * 100 * 10.0) / 10.0 : 0;

            summary.add(Map.of(
                    "moduleId",           moduleId,
                    "moduleName",         e.getModule().getName(),
                    "moduleCode",         e.getModule().getCode(),
                    "totalSessions",      total,
                    "absences",           absences,
                    "absencePercent",     pct,
                    "threshold",          threshold,
                    "thresholdExceeded",  pct >= threshold
            ));
        }
        return summary;
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private AttendanceRecordResponse toRecordResponse(
            com.auca.attendance.entity.AttendanceRecord r) {
        return AttendanceRecordResponse.builder()
                .id(r.getId())
                .sessionId(r.getSession().getId())
                .sessionDate(r.getSession().getSessionDate())
                .studentId(r.getStudent().getId())
                .studentName(r.getStudent().getName())
                .studentCode(r.getStudent().getStudentId())
                .status(r.getStatus())
                .consecutiveAbsentFlag(r.getConsecutiveAbsentFlag())
                .notes(r.getNotes())
                .recordedAt(r.getRecordedAt())
                .build();
    }

    private MarkEntryResponse toMarkResponse(MarkEntry m) {
        return MarkEntryResponse.builder()
                .id(m.getId())
                .columnId(m.getColumn().getId())
                .columnName(m.getColumn().getName())
                .columnType(m.getColumn().getType())
                .maxScore(m.getColumn().getMaxScore())
                .studentId(m.getStudent().getId())
                .studentName(m.getStudent().getName())
                .studentCode(m.getStudent().getStudentId())
                .score(m.getScore())
                .enteredAt(m.getEnteredAt())
                .build();
    }

    private EnrollmentResponse toEnrollmentResponse(Enrollment e) {
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
