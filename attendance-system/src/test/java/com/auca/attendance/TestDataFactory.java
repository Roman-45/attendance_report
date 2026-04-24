package com.auca.attendance;

import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.MarkColumn;
import com.auca.attendance.entity.MarkEntry;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Notification;
import com.auca.attendance.entity.PasswordResetToken;
import com.auca.attendance.entity.RefreshToken;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * Builds unsaved entity instances for use in tests.
 * Call repository.save() after getting an instance from here.
 */
public final class TestDataFactory {

    private TestDataFactory() {}

    public static User adminUser() {
        return User.builder()
                .name("Test Admin")
                .email("admin@test.auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii") // Admin@1234
                .role(Role.ADMIN)
                .build();
    }

    public static User facilitatorUser() {
        return User.builder()
                .name("Test Facilitator")
                .email("facilitator@test.auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.FACILITATOR)
                .build();
    }

    public static User instructorUser() {
        return User.builder()
                .name("Test Instructor")
                .email("instructor@test.auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.INSTRUCTOR)
                .build();
    }

    public static User teamLeaderUser() {
        return User.builder()
                .name("Test Team Leader")
                .email("teamleader@test.auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii") // Admin@1234
                .role(Role.TEAM_LEADER)
                .build();
    }

    public static User studentUser(String suffix) {
        return User.builder()
                .name("Student User " + suffix)
                .email("studentuser" + suffix + "@test.auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.STUDENT)
                .build();
    }

    public static Student student(String suffix) {
        return Student.builder()
                .studentId("STU" + suffix)
                .name("Test Student " + suffix)
                .email("student" + suffix + "@test.auca.ac.rw")
                .cohortYear(2024)
                .program("Computer Science")
                .build();
    }

    public static Module module(String suffix, User createdBy) {
        return Module.builder()
                .code("CS" + suffix)
                .name("Test Module " + suffix)
                .description("Test description")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .createdBy(createdBy)
                .build();
    }

    public static AttendanceSession session(Module module, User createdBy, LocalDate date) {
        return AttendanceSession.builder()
                .module(module)
                .sessionDate(date)
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .period("MORNING")
                .createdBy(createdBy)
                .build();
    }

    public static AttendanceRecord record(AttendanceSession session, Student student, String status) {
        AttendanceRecord r = AttendanceRecord.builder()
                .session(session)
                .student(student)
                .status(status)
                .consecutiveAbsentFlag(false)
                .build();
        return r;
    }
}
