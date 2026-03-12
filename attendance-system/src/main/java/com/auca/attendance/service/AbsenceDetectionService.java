package com.auca.attendance.service;

import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.repository.AttendanceRecordRepository;
import com.auca.attendance.repository.AttendanceSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AbsenceDetectionService {

    private final AttendanceSessionRepository sessionRepo;
    private final AttendanceRecordRepository recordRepo;
    private final NotificationService notificationService;

    public void checkAndFlag(Long studentId, Long moduleId) {
        List<AttendanceSession> lastTwo = sessionRepo
                .findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId);

        if (lastTwo.size() < 2) return;

        List<Long> sessionIds = lastTwo.stream().map(AttendanceSession::getId).toList();
        List<AttendanceRecord> records = recordRepo.findByStudentIdAndSessionIdIn(studentId, sessionIds);

        boolean bothAbsent = records.size() == 2 &&
                records.stream().allMatch(r -> "ABSENT".equals(r.getStatus()));

        if (bothAbsent) {
            records.stream()
                    .max(Comparator.comparing(r -> r.getSession().getSessionDate()))
                    .ifPresent(r -> {
                        r.setConsecutiveAbsentFlag(true);
                        recordRepo.save(r);
                    });
            notificationService.notifyAdmins(studentId, moduleId);
        }
    }
}
