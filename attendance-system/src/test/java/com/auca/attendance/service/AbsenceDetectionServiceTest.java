package com.auca.attendance.service;

import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.enums.AttendanceStatus;
import com.auca.attendance.repository.AttendanceRecordRepository;
import com.auca.attendance.repository.AttendanceSessionRepository;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AbsenceDetectionService — unit tests")
class AbsenceDetectionServiceTest {

    @Mock AttendanceSessionRepository sessionRepo;
    @Mock AttendanceRecordRepository recordRepo;
    @Mock NotificationService notificationService;

    @InjectMocks AbsenceDetectionService service;

    private final Long STUDENT_ID = 1L;
    private final Long MODULE_ID  = 10L;

    private AttendanceSession session(Long id, LocalDate date) {
        Module m = Module.builder().id(MODULE_ID).build();
        AttendanceSession s = new AttendanceSession();
        s.setId(id);
        s.setModule(m);
        s.setSessionDate(date);
        return s;
    }

    private AttendanceRecord record(AttendanceSession session, AttendanceStatus status) {
        Student student = Student.builder().id(STUDENT_ID).build();
        AttendanceRecord r = new AttendanceRecord();
        r.setSession(session);
        r.setStudent(student);
        r.setStatus(status);
        r.setConsecutiveAbsentFlag(false);
        return r;
    }

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

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(recordRepo, never()).save(any());
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

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(recordRepo, never()).save(any());
        verify(notificationService, never()).notifyAdmins(any(), any());
    }

    @Test
    @DisplayName("Does nothing when the module has fewer than 2 sessions (first-ever session)")
    void shouldDoNothing_WhenFewerThanTwoSessions() {
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(List.of(session(1L, LocalDate.now())));

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verifyNoInteractions(recordRepo, notificationService);
    }

    @Test
    @DisplayName("Does nothing when module has no sessions at all")
    void shouldDoNothing_WhenNoSessionsExist() {
        when(sessionRepo.findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(MODULE_ID))
                .thenReturn(Collections.emptyList());

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verifyNoInteractions(recordRepo, notificationService);
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

        service.checkAndFlag(STUDENT_ID, MODULE_ID);

        verify(recordRepo, never()).save(any());
        verify(notificationService, never()).notifyAdmins(any(), any());
    }
}
