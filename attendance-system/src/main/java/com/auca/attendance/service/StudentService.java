package com.auca.attendance.service;

import com.auca.attendance.dto.request.StudentRequest;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.entity.Student;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public List<StudentResponse> getAll(Integer cohortYear) {
        List<Student> students = cohortYear != null
                ? studentRepository.findAllByCohortYearAndDeletedAtIsNull(cohortYear)
                : studentRepository.findAllByDeletedAtIsNull();
        return students.stream().map(this::toResponse).toList();
    }

    public StudentResponse getById(Long id) {
        Student student = studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        return toResponse(student);
    }

    public StudentResponse create(StudentRequest request) {
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use: " + request.getEmail());
        }
        if (studentRepository.existsByStudentId(request.getStudentId())) {
            throw new ConflictException("Student ID already exists: " + request.getStudentId());
        }

        Student student = Student.builder()
                .studentId(request.getStudentId())
                .name(request.getName())
                .email(request.getEmail())
                .cohortYear(request.getCohortYear())
                .program(request.getProgram())
                .phone(request.getPhone())
                .build();

        return toResponse(studentRepository.save(student));
    }

    public StudentResponse update(Long id, StudentRequest request) {
        Student student = studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));

        student.setStudentId(request.getStudentId());
        student.setName(request.getName());
        student.setEmail(request.getEmail());
        student.setCohortYear(request.getCohortYear());
        student.setProgram(request.getProgram());
        student.setPhone(request.getPhone());

        return toResponse(studentRepository.save(student));
    }

    public void softDelete(Long id) {
        Student student = studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        student.setDeletedAt(OffsetDateTime.now());
        studentRepository.save(student);
    }

    private StudentResponse toResponse(Student s) {
        return StudentResponse.builder()
                .id(s.getId())
                .studentId(s.getStudentId())
                .name(s.getName())
                .email(s.getEmail())
                .cohortYear(s.getCohortYear())
                .program(s.getProgram())
                .phone(s.getPhone())
                .build();
    }
}
