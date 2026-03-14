package com.auca.attendance.repository;

import com.auca.attendance.BaseIntegrationTest;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
@DisplayName("AttendanceSessionRepository — integration tests")
class AttendanceSessionRepositoryTest extends BaseIntegrationTest {

    @Autowired AttendanceSessionRepository sessionRepository;
    @Autowired ModuleRepository moduleRepository;
    @Autowired UserRepository userRepository;

    private Module module;
    private User facilitator;

    @BeforeEach
    void setUp() {
        facilitator = userRepository.save(User.builder()
                .name("Test Facilitator")
                .email("facil_session_test@auca.ac.rw")
                .password("$2a$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii")
                .role(Role.FACILITATOR)
                .build());

        module = moduleRepository.save(Module.builder()
                .code("CS999")
                .name("Test Module for Sessions")
                .description("desc")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .build());
    }

    private AttendanceSession savedSession(LocalDate date, LocalTime startTime) {
        return sessionRepository.save(AttendanceSession.builder()
                .module(module)
                .sessionDate(date)
                .startTime(startTime)
                .endTime(startTime.plusHours(2))
                .period("MORNING")
                .createdBy(facilitator)
                .build());
    }

    @Test
    @DisplayName("findTop2 returns the two most recent sessions ordered by date desc")
    void findTop2_ShouldReturnTwoMostRecent_OrderedByDateDesc() {
        savedSession(LocalDate.now().minusDays(10), LocalTime.of(8, 0));
        AttendanceSession second = savedSession(LocalDate.now().minusDays(2), LocalTime.of(8, 0));
        AttendanceSession first  = savedSession(LocalDate.now(),              LocalTime.of(8, 0));

        List<AttendanceSession> result = sessionRepository
                .findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(module.getId());

        assertThat(result).hasSize(2);
        assertThat(result.get(0).getId()).isEqualTo(first.getId());
        assertThat(result.get(1).getId()).isEqualTo(second.getId());
    }

    @Test
    @DisplayName("findTop2 returns one session when only one exists")
    void findTop2_ShouldReturnOne_WhenOnlyOneSessionExists() {
        savedSession(LocalDate.now(), LocalTime.of(8, 0));

        List<AttendanceSession> result = sessionRepository
                .findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(module.getId());

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("findTop2 returns empty list when no sessions exist for the module")
    void findTop2_ShouldReturnEmpty_WhenNoSessionsForModule() {
        List<AttendanceSession> result = sessionRepository
                .findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(module.getId());

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("findTop2 is scoped to the correct module and ignores other modules")
    void findTop2_ShouldNotReturnSessionsFromOtherModules() {
        Module otherModule = moduleRepository.save(Module.builder()
                .code("CS998").name("Other Module").description("d")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .build());

        // Save sessions on the other module only
        sessionRepository.save(AttendanceSession.builder()
                .module(otherModule)
                .sessionDate(LocalDate.now())
                .startTime(LocalTime.of(8, 0))
                .endTime(LocalTime.of(10, 0))
                .period("MORNING")
                .createdBy(facilitator)
                .build());

        List<AttendanceSession> result = sessionRepository
                .findTop2ByModuleIdOrderBySessionDateDescStartTimeDesc(module.getId());

        assertThat(result).isEmpty();
    }
}
