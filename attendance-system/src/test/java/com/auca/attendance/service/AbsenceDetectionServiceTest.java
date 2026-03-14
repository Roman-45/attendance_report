package com.auca.attendance.service;

import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.enums.AttendanceStatus;
import com.auca.attendance.repository.AttendanceRecordRepository;
import com.auca.attendance.repository.AttendanceSessionRepository;
import com.auca.attendance.repository.ModuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AbsenceDetectionService — unit tests")
class AbsenceDetectionServiceTest {

    @Mock AttendanceSessionRepository sessionRepo;
    @Mock AttendanceRecordRepository  recordRepo;
    @Mock ModuleRepository            moduleRepo;
    @Mock NotificationService         notificationService;

    @InjectMocks AbsenceDetectionService service;

    private final Long STUDENT_ID = 1L;
    private final Long MODULE_ID  = 10L;

    private Module module;

    @BeforeEach
    void setup() {
        module = Module.builder().id(MODULE_ID).absenceThresholdPercent(25).build();
    }

    // ─── Consecutive-absence tests ───────────────────────────────────────────

    @Test
    @DisplayName("Flags the most recent record when both of the last 2 sessions are ABSENT")
    void shouldFlag_WhenBothLastTwoSessionsAreAbsent() {
        AttendanceSession older  = session(1L, LocalDate.now().minusDays(2));
        AttendanceSession recent = session(2L, LocalDate.now());
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(recent, older));

        AttendanceRecord r1 = record(older,  AttendanceStatus.ABSENT);
        AttendanceRecord r2 = record(recent, AttendanceStatus.ABSENT);
        when(recordRepo.findByStudentIdAndSessionIdIn(eq(STUDENT_ID), any()))
                .thenReturn(List.of(r1, r2));

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(recordRepo).save(argThat(r -> r.getConsecutiveAbsentFlag()));
        verify(notificationService).notifyAdmins(STUDENT_ID, MODULE_ID);
    }

    @Test
    @DisplayName("Does NOT flag when only the first of two sessions is ABSENT")
    void shouldNotFlag_WhenOnlyFirstSessionIsAbsent() {
        AttendanceSession older  = session(1L, LocalDate.now().minusDays(2));
        AttendanceSession recent = session(2L, LocalDate.now());
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(recent, older));

        AttendanceRecord r1 = record(older,  AttendanceStatus.ABSENT);
        AttendanceRecord r2 = record(recent, AttendanceStatus.PRESENT);
        when(recordRepo.findByStudentIdAndSessionIdIn(eq(STUDENT_ID), any()))
                .thenReturn(List.of(r1, r2));

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    @DisplayName("Does NOT flag when only the second of two sessions is ABSENT")
    void shouldNotFlag_WhenOnlySecondSessionIsAbsent() {
        AttendanceSession older  = session(1L, LocalDate.now().minusDays(2));
        AttendanceSession recent = session(2L, LocalDate.now());
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(recent, older));

        AttendanceRecord r1 = record(older,  AttendanceStatus.PRESENT);
        AttendanceRecord r2 = record(recent, AttendanceStatus.ABSENT);
        when(recordRepo.findByStudentIdAndSessionIdIn(eq(STUDENT_ID), any()))
                .thenReturn(List.of(r1, r2));

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    @DisplayName("Does nothing when the module has fewer than 2 sessions (first-ever session)")
    void shouldDoNothing_WhenFewerThanTwoSessions() {
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(session(1L, LocalDate.now())));

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    @DisplayName("Does nothing when module has no sessions at all")
    void shouldDoNothing_WhenNoSessionsExist() {
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(Collections.emptyList());

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    @DisplayName("Does NOT flag when student has only one record in last two sessions (missed recording)")
    void shouldNotFlag_WhenStudentHasOnlyOneRecord() {
        AttendanceSession older  = session(1L, LocalDate.now().minusDays(2));
        AttendanceSession recent = session(2L, LocalDate.now());
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(recent, older));

        when(recordRepo.findByStudentIdAndSessionIdIn(eq(STUDENT_ID), any()))
                .thenReturn(List.of(record(recent, AttendanceStatus.ABSENT)));

        stubThresholdNotCrossed();

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    // ─── Threshold-alert tests ───────────────────────────────────────────────

    @Test
    @DisplayName("Fires threshold alert when student crosses the 25% absence threshold")
    void shouldFireThresholdAlert_WhenThresholdCrossed() {
        stubNoConsecutiveSessions();
        // 1 out of 4 sessions absent = 25% → crosses threshold
        when(moduleRepo.findById(MODULE_ID)).thenReturn(Optional.of(module));
        when(recordRepo.countTotalByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(4L);
        when(recordRepo.countAbsencesByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(1L);
        when(recordRepo.thresholdAlertAlreadySent(STUDENT_ID, MODULE_ID)).thenReturn(false);

        AttendanceRecord latest = record(session(5L, LocalDate.now()), AttendanceStatus.ABSENT);
        when(recordRepo.findLatestByStudentAndModule(STUDENT_ID, MODULE_ID))
                .thenReturn(Optional.of(latest));

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService).notifyAdminsThresholdAlert(eq(STUDENT_ID), eq(MODULE_ID), anyInt(), eq(25));
        verify(recordRepo).save(argThat(r -> Boolean.TRUE.equals(r.getThresholdAlertSent())));
    }

    @Test
    @DisplayName("Does NOT fire threshold alert when already sent for this student+module")
    void shouldNotFireThresholdAlert_WhenAlreadySent() {
        stubNoConsecutiveSessions();
        when(moduleRepo.findById(MODULE_ID)).thenReturn(Optional.of(module));
        when(recordRepo.countTotalByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(4L);
        when(recordRepo.countAbsencesByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(1L);
        when(recordRepo.thresholdAlertAlreadySent(STUDENT_ID, MODULE_ID)).thenReturn(true); // already sent

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdminsThresholdAlert(any(), any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("Does NOT fire threshold alert when absence percentage is below threshold")
    void shouldNotFireThresholdAlert_WhenBelowThreshold() {
        stubNoConsecutiveSessions();
        // 1 out of 8 sessions = 12.5% — below 25%
        when(moduleRepo.findById(MODULE_ID)).thenReturn(Optional.of(module));
        when(recordRepo.countTotalByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(8L);
        when(recordRepo.countAbsencesByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(1L);
        when(recordRepo.thresholdAlertAlreadySent(STUDENT_ID, MODULE_ID)).thenReturn(false);

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdminsThresholdAlert(any(), any(), anyInt(), anyInt());
    }

    @Test
    @DisplayName("Does NOT fire threshold alert when total sessions is zero (no records yet)")
    void shouldNotFireThresholdAlert_WhenNoRecordsExist() {
        stubNoConsecutiveSessions();
        // total=0 → service returns before calling moduleRepo.findById or thresholdAlertAlreadySent
        when(recordRepo.countTotalByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(0L);
        when(recordRepo.countAbsencesByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(0L);

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(notificationService, never()).notifyAdminsThresholdAlert(any(), any(), anyInt(), anyInt());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AttendanceSession session(Long id, LocalDate date) {
        AttendanceSession s = new AttendanceSession();
        s.setId(id);
        s.setModule(module);
        s.setSessionDate(date);
        return s;
    }

    private AttendanceRecord record(AttendanceSession session, AttendanceStatus status) {
        AttendanceRecord r = new AttendanceRecord();
        r.setSession(session);
        r.setStudent(Student.builder().id(STUDENT_ID).build());
        r.setStatus(status.name());
        r.setConsecutiveAbsentFlag(false);
        r.setThresholdAlertSent(false);
        return r;
    }

    /** Stub the consecutive-absence path so it short-circuits cleanly (only 1 session). */
    private void stubNoConsecutiveSessions() {
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(session(1L, LocalDate.now())));
    }

    /** Stub the threshold path to appear "not crossed" so tests can focus on consecutive logic. */
    private void stubThresholdNotCrossed() {
        when(moduleRepo.findById(MODULE_ID)).thenReturn(Optional.of(module));
        when(recordRepo.countTotalByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(4L);
        when(recordRepo.countAbsencesByStudentAndModule(STUDENT_ID, MODULE_ID)).thenReturn(0L);
        when(recordRepo.thresholdAlertAlreadySent(STUDENT_ID, MODULE_ID)).thenReturn(false);
    }
}
