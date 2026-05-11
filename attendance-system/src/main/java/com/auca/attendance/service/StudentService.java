package com.auca.attendance.service;

import com.auca.attendance.dto.request.StudentRequest;
import com.auca.attendance.dto.response.StudentResponse;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private static final String TEMP_CHARS =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    private final StudentRepository    studentRepository;
    private final UserRepository       userRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JavaMailSender       mailSender;
    private final FileStorageService   fileStorageService;

    @Transactional(readOnly = true)
    public List<StudentResponse> getAll(Integer cohortYear) {
        List<Student> students = cohortYear != null
                ? studentRepository.findAllByCohortYearAndDeletedAtIsNull(cohortYear)
                : studentRepository.findAllByDeletedAtIsNull();
        return students.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<StudentResponse> getAll(Integer cohortYear, Pageable pageable) {
        Page<Student> page;
        if (cohortYear != null) {
            page = studentRepository.findByCohortYearAndDeletedAtIsNull(cohortYear, pageable);
        } else {
            page = studentRepository.findByDeletedAtIsNull(pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public StudentResponse getById(Long id) {
        Student student = studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        return toResponse(student);
    }

    @Transactional
    public StudentResponse create(StudentRequest request) {
        // Email and studentId are now optional — only check duplicates when supplied.
        if (request.getEmail() != null && !request.getEmail().isBlank()
                && studentRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already in use: " + request.getEmail());
        }

        String studentId = (request.getStudentId() == null || request.getStudentId().isBlank())
                ? generateStudentId()
                : request.getStudentId();

        if (studentRepository.existsByStudentId(studentId)) {
            throw new ConflictException("Student ID already exists: " + studentId);
        }

        Integer cohortYear = request.getCohortYear() != null
                ? request.getCohortYear()
                : java.time.Year.now().getValue();

        Student student = Student.builder()
                .studentId(studentId)
                .name(request.getName())
                .email(request.getEmail())
                .cohortYear(cohortYear)
                .program(request.getProgram())
                .phone(request.getPhone())
                .build();

        if (request.isCreateAccount()) {
            if (request.getEmail() == null || request.getEmail().isBlank()) {
                throw new ConflictException(
                        "Email is required when creating a portal account for the student");
            }
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new ConflictException(
                        "A user account already exists for: " + request.getEmail());
            }
            String tempPassword = generateTempPassword(12);
            User account = userRepository.save(User.builder()
                    .name(request.getName())
                    .email(request.getEmail())
                    .password(passwordEncoder.encode(tempPassword))
                    .role(Role.STUDENT)
                    .build());
            student.setAccount(account);
            sendWelcomeEmail(request.getEmail(), request.getName(),
                    studentId, tempPassword);
        }

        return toResponse(studentRepository.save(student));
    }

    /** Generates a unique student id of the form AUCA{YY}-{seq} (e.g. AUCA26-0001). */
    private String generateStudentId() {
        String prefix = "AUCA" + String.format("%02d", java.time.Year.now().getValue() % 100) + "-";
        for (int i = 0; i < 1000; i++) {
            int seq = (int) (studentRepository.count() + 1 + i);
            String candidate = prefix + String.format("%04d", seq);
            if (!studentRepository.existsByStudentId(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("Could not allocate a unique student id");
    }

    @Transactional
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

    @Transactional
    public void softDelete(Long id) {
        Student student = studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
        student.setDeletedAt(OffsetDateTime.now());
        studentRepository.save(student);
    }

    @Transactional
    public StudentResponse uploadPhoto(Long id, MultipartFile file) throws Exception {
        Student student = findStudent(id);
        String path = fileStorageService.storeProfilePhoto(id, file);
        student.setProfilePhotoPath(path);
        return toResponse(studentRepository.save(student));
    }

    public byte[] getPhoto(Long id) {
        Student student = findStudent(id);
        if (student.getProfilePhotoPath() == null) {
            throw new ResourceNotFoundException("No photo for student " + id);
        }
        return fileStorageService.loadFile(student.getProfilePhotoPath());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Student findStudent(Long id) {
        return studentRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + id));
    }

    @Transactional(readOnly = true)
    public StudentResponse toResponse(Student s) {
        boolean hasAccount = s.getAccount() != null;
        return StudentResponse.builder()
                .id(s.getId())
                .studentId(s.getStudentId())
                .name(s.getName())
                .email(s.getEmail())
                .cohortYear(s.getCohortYear())
                .program(s.getProgram())
                .phone(s.getPhone())
                .profilePhotoUrl(s.getProfilePhotoPath() != null ? "/api/v1/students/" + s.getId() + "/photo" : null)
                .hasAccount(hasAccount)
                .accountUserId(hasAccount ? s.getAccount().getId() : null)
                .build();
    }

    private String generateTempPassword(int length) {
        SecureRandom rng = new SecureRandom();
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(TEMP_CHARS.charAt(rng.nextInt(TEMP_CHARS.length())));
        }
        return sb.toString();
    }

    private void sendWelcomeEmail(String to, String name, String studentId, String tempPassword) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            mail.setSubject("[AUCA] Your student portal account");
            mail.setText(String.format(
                    "Hello %s,\n\n" +
                    "Your AUCA Attendance Portal account has been created.\n\n" +
                    "Student ID : %s\n" +
                    "Email      : %s\n" +
                    "Password   : %s\n\n" +
                    "Please log in and change your password immediately.\n\n" +
                    "AUCA Academic Administration",
                    name, studentId, to, tempPassword));
            mailSender.send(mail);
        } catch (Exception e) {
            log.warn("Failed to send welcome email to {}: {}", to, e.getMessage());
        }
    }
}
