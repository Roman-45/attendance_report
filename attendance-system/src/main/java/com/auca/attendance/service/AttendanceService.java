package com.auca.attendance.service;

import com.auca.attendance.dto.request.AttendanceRecordRequest;
import com.auca.attendance.dto.request.SessionRequest;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
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

    public AttendanceSession createSession(Long moduleId, SessionRequest request, User currentUser) {
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

        return sessionRepo.save(session);
    }

    public List<AttendanceSession> getSessions(Long moduleId) {
        return sessionRepo.findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId);
    }

    public List<AttendanceRecord> getRecords(Long sessionId) {
        return recordRepo.findBySessionId(sessionId);
    }

    @Transactional
    public List<AttendanceRecord> submitRecords(Long sessionId, List<AttendanceRecordRequest> requests) {
        AttendanceSession session = sessionRepo.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));

        List<AttendanceRecord> saved = requests.stream().map(req -> {
            Student student = studentRepo.findById(req.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + req.getStudentId()));

            AttendanceRecord record = recordRepo
                    .findBySessionIdAndStudentId(sessionId, req.getStudentId())
                    .orElse(AttendanceRecord.builder().session(session).student(student).build());

            record.setStatus(req.getStatus());
            record.setNotes(req.getNotes());
            return recordRepo.save(record);
        }).toList();

        Long moduleId = session.getModule().getId();
        requests.forEach(req ->
                absenceDetectionService.checkAndFlag(req.getStudentId(), moduleId));

        return saved;
    }

    @Transactional
    public AttendanceRecord correctRecord(Long recordId, AttendanceRecordRequest request) {
        AttendanceRecord record = recordRepo.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Record not found: " + recordId));
        record.setStatus(request.getStatus());
        record.setNotes(request.getNotes());
        return recordRepo.save(record);
    }

    public List<AttendanceRecord> getStudentHistory(Long studentId) {
        return recordRepo.findByStudentId(studentId);
    }

    public Map<String, Object> getModuleSummary(Long moduleId) {
        List<AttendanceRecord> all = recordRepo.findBySessionId(moduleId);
        long total = all.size();
        long absences = all.stream().filter(r -> "ABSENT".equals(r.getStatus())).count();
        long flagged = all.stream().filter(r -> Boolean.TRUE.equals(r.getConsecutiveAbsentFlag())).count();

        return Map.of(
                "totalRecords", total,
                "absences", absences,
                "flagged", flagged,
                "attendanceRate", total > 0 ? ((double)(total - absences) / total * 100) : 0
        );
    }
}
