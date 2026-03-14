package com.auca.attendance.service;

import com.auca.attendance.dto.request.AttendanceRecordRequest;
import com.auca.attendance.dto.request.SessionRequest;
import com.auca.attendance.dto.response.AttendanceRecordResponse;
import com.auca.attendance.dto.response.SessionResponse;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceSessionRepository sessionRepo;
    private final AttendanceRecordRepository recordRepo;
    private final ModuleRepository moduleRepo;
    private final StudentRepository studentRepo;
    private final AbsenceDetectionService absenceDetectionService;
    private final EnrollmentRepository enrollmentRepo;

    @Transactional
    public SessionResponse createSession(Long moduleId, SessionRequest request, User currentUser) {
        var module = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        AttendanceSession session = AttendanceSession.builder()
                .module(module)
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .period(request.getPeriod())
                .createdBy(currentUser)
                .build();

        return toSessionResponse(sessionRepo.save(session));
    }

    @Transactional(readOnly = true)
    public List<SessionResponse> getSessions(Long moduleId) {
        return sessionRepo.findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId)
                .stream().map(this::toSessionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getRecords(Long sessionId) {
        return recordRepo.findBySessionId(sessionId)
                .stream().map(this::toRecordResponse).toList();
    }

    @Transactional
    public List<AttendanceRecordResponse> submitRecords(Long sessionId, List<AttendanceRecordRequest> requests) {
        AttendanceSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        Long moduleId = session.getModule().getId();

        List<AttendanceRecordResponse> saved = requests.stream().map(req -> {
            Student student = studentRepo.findById(req.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + req.getStudentId()));

            // Enforce enrollment — student must be enrolled in the module
            if (!enrollmentRepo.existsByStudentIdAndModuleId(req.getStudentId(), moduleId)) {
                throw new ConflictException(
                        "Student " + student.getStudentId() + " is not enrolled in this module");
            }

            AttendanceRecord record = recordRepo
                    .findBySessionIdAndStudentId(sessionId, req.getStudentId())
                    .orElse(AttendanceRecord.builder().session(session).student(student).build());

            record.setStatus(req.getStatus());
            record.setNotes(req.getNotes());
            return toRecordResponse(recordRepo.save(record));
        }).toList();

        requests.forEach(req ->
                absenceDetectionService.checkAndFlag(req.getStudentId(), moduleId));

        return saved;
    }

    @Transactional
    public AttendanceRecordResponse correctRecord(Long recordId, AttendanceRecordRequest request) {
        AttendanceRecord record = recordRepo.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found: " + recordId));
        record.setStatus(request.getStatus());
        record.setNotes(request.getNotes());
        return toRecordResponse(recordRepo.save(record));
    }

    @Transactional(readOnly = true)
    public List<AttendanceRecordResponse> getStudentHistory(Long studentId) {
        return recordRepo.findByStudentId(studentId)
                .stream().map(this::toRecordResponse).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getModuleSummary(Long moduleId) {
        List<AttendanceSession> sessions = sessionRepo
                .findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId);
        List<Long> sessionIds = sessions.stream().map(AttendanceSession::getId).toList();

        long total = 0;
        long absences = 0;
        long flagged = 0;

        for (Long sid : sessionIds) {
            List<AttendanceRecord> records = recordRepo.findBySessionId(sid);
            total += records.size();
            absences += records.stream().filter(r -> "ABSENT".equals(r.getStatus())).count();
            flagged += records.stream().filter(r -> Boolean.TRUE.equals(r.getConsecutiveAbsentFlag())).count();
        }

        return Map.of(
                "totalSessions", sessions.size(),
                "totalRecords", total,
                "absences", absences,
                "flagged", flagged,
                "attendanceRate", total > 0 ? Math.round(((double)(total - absences) / total * 100) * 10.0) / 10.0 : 0
        );
    }

    // ─── Mappers ────────────────────────────────────────────────────────────
    private SessionResponse toSessionResponse(AttendanceSession s) {
        return SessionResponse.builder()
                .id(s.getId())
                .moduleId(s.getModule().getId())
                .moduleName(s.getModule().getName())
                .sessionDate(s.getSessionDate())
                .startTime(s.getStartTime())
                .endTime(s.getEndTime())
                .period(s.getPeriod())
                .createdBy(s.getCreatedBy().getName())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private AttendanceRecordResponse toRecordResponse(AttendanceRecord r) {
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
}
