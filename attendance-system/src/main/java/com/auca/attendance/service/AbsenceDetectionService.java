package com.auca.attendance.service;

import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.repository.AttendanceRecordRepository;
import com.auca.attendance.repository.AttendanceSessionRepository;
import com.auca.attendance.repository.ModuleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AbsenceDetectionService {

    private final AttendanceSessionRepository sessionRepo;
    private final AttendanceRecordRepository recordRepo;
    private final ModuleRepository moduleRepo;
    private final NotificationService notificationService;

    @Transactional
    public void checkAndFlag(Long studentId, Long moduleId) {
        checkConsecutiveAbsences(studentId, moduleId);
        checkAbsenceThreshold(studentId, moduleId);
    }

    // ─── Consecutive-absence check (existing logic) ──────────────────────────

    private void checkConsecutiveAbsences(Long studentId, Long moduleId) {
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

    // ─── Absence-threshold check (new) ──────────────────────────────────────

    private void checkAbsenceThreshold(Long studentId, Long moduleId) {
        long total    = recordRepo.countTotalByStudentAndModule(studentId, moduleId);
        long absences = recordRepo.countAbsencesByStudentAndModule(studentId, moduleId);

        if (total == 0) return;

        // Fetch threshold from module (default 25)
        int threshold = moduleRepo.findById(moduleId)
                .map(m -> m.getAbsenceThresholdPercent() != null ? m.getAbsenceThresholdPercent() : 25)
                .orElse(25);

        // Fire only once: at the exact moment the student crosses the threshold
        // Condition: current state is AT or ABOVE threshold, but previous state was BELOW
        // i.e., absences * 100 / total >= threshold AND (absences-1) * 100 / total < threshold
        boolean crossedNow  = absences * 100 >= threshold * total;
        boolean wasBelow    = (absences - 1) * 100 < threshold * total;
        boolean alreadySent = recordRepo.thresholdAlertAlreadySent(studentId, moduleId);

        if (crossedNow && wasBelow && !alreadySent) {
            int currentPct = (int) Math.round((double) absences / total * 100);

            // Stamp the latest record to prevent future duplicate alerts
            recordRepo.findLatestByStudentAndModule(studentId, moduleId).ifPresent(r -> {
                r.setThresholdAlertSent(true);
                recordRepo.save(r);
            });

            notificationService.notifyAdminsThresholdAlert(studentId, moduleId, currentPct, threshold);
        }
    }
}
