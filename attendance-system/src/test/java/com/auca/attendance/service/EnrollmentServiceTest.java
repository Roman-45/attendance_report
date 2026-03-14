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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("EnrollmentService — unit tests")
class EnrollmentServiceTest {

    @Mock EnrollmentRepository enrollmentRepository;
    @Mock ModuleRepository moduleRepository;
    @Mock StudentRepository studentRepository;

    @InjectMocks EnrollmentService service;

    private Module module;
    private Student student;

    @BeforeEach
    void setUp() {
        module = Module.builder()
                .id(10L).code("CS101").name("Algorithms")
                .startDate(LocalDate.now().minusMonths(1))
                .endDate(LocalDate.now().plusMonths(5))
                .build();

        student = Student.builder()
                .id(1L).studentId("STU001").name("Alice")
                .email("alice@auca.ac.rw").cohortYear(2024).program("CS")
                .build();
    }

    // ─── enroll ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("Successfully enrolls a student who is not yet enrolled")
    void enroll_ShouldSucceed_WhenStudentNotAlreadyEnrolled() {
        when(moduleRepository.findById(10L)).thenReturn(Optional.of(module));
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(false);
        when(studentRepository.findByIdAndDeletedAtIsNull(1L)).thenReturn(Optional.of(student));
        when(enrollmentRepository.save(any())).thenAnswer(inv -> {
            Enrollment e = inv.getArgument(0);
            e = Enrollment.builder()
                    .id(100L).student(student).module(module)
                    .enrolledAt(OffsetDateTime.now()).build();
            return e;
        });

        EnrollStudentsRequest req = new EnrollStudentsRequest();
        req.setStudentIds(List.of(1L));

        List<EnrollmentResponse> result = service.enroll(10L, req);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getStudentId()).isEqualTo(1L);
        assertThat(result.get(0).getModuleId()).isEqualTo(10L);
        verify(enrollmentRepository).save(any());
    }

    @Test
    @DisplayName("Returns existing enrollment when student is already enrolled (idempotent)")
    void enroll_ShouldBeIdempotent_WhenAlreadyEnrolled() {
        Enrollment existing = Enrollment.builder()
                .id(100L).student(student).module(module)
                .enrolledAt(OffsetDateTime.now()).build();

        when(moduleRepository.findById(10L)).thenReturn(Optional.of(module));
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(true);
        when(enrollmentRepository.findByModuleId(10L)).thenReturn(List.of(existing));

        EnrollStudentsRequest req = new EnrollStudentsRequest();
        req.setStudentIds(List.of(1L));

        List<EnrollmentResponse> result = service.enroll(10L, req);

        assertThat(result).hasSize(1);
        verify(enrollmentRepository, never()).save(any()); // no new record saved
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when module does not exist")
    void enroll_ShouldThrow_WhenModuleNotFound() {
        when(moduleRepository.findById(99L)).thenReturn(Optional.empty());

        EnrollStudentsRequest req = new EnrollStudentsRequest();
        req.setStudentIds(List.of(1L));

        assertThatThrownBy(() -> service.enroll(99L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Module not found");
    }

    @Test
    @DisplayName("Throws ResourceNotFoundException when student does not exist")
    void enroll_ShouldThrow_WhenStudentNotFound() {
        when(moduleRepository.findById(10L)).thenReturn(Optional.of(module));
        when(enrollmentRepository.existsByStudentIdAndModuleId(99L, 10L)).thenReturn(false);
        when(studentRepository.findByIdAndDeletedAtIsNull(99L)).thenReturn(Optional.empty());

        EnrollStudentsRequest req = new EnrollStudentsRequest();
        req.setStudentIds(List.of(99L));

        assertThatThrownBy(() -> service.enroll(10L, req))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Student not found");
    }

    // ─── unenroll ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Successfully unenrolls a student")
    void unenroll_ShouldSucceed_WhenEnrolled() {
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(true);

        service.unenroll(10L, 1L);

        verify(enrollmentRepository).deleteByStudentIdAndModuleId(1L, 10L);
    }

    @Test
    @DisplayName("Throws when trying to unenroll a student who is not enrolled")
    void unenroll_ShouldThrow_WhenNotEnrolled() {
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(false);

        assertThatThrownBy(() -> service.unenroll(10L, 1L))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(enrollmentRepository, never()).deleteByStudentIdAndModuleId(any(), any());
    }

    // ─── isEnrolled ───────────────────────────────────────────────────────

    @Test
    @DisplayName("isEnrolled returns true when student is enrolled")
    void isEnrolled_ShouldReturnTrue_WhenEnrolled() {
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(true);
        assertThat(service.isEnrolled(1L, 10L)).isTrue();
    }

    @Test
    @DisplayName("isEnrolled returns false when student is not enrolled")
    void isEnrolled_ShouldReturnFalse_WhenNotEnrolled() {
        when(enrollmentRepository.existsByStudentIdAndModuleId(1L, 10L)).thenReturn(false);
        assertThat(service.isEnrolled(1L, 10L)).isFalse();
    }
}
