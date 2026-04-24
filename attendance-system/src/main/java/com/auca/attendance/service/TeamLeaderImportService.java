package com.auca.attendance.service;

import com.auca.attendance.dto.response.ImportResult;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.TeamMember;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamLeaderImportService {

    private final StudentRepository studentRepo;
    private final UserRepository userRepo;
    private final TeamRepository teamRepo;
    private final TeamMemberRepository memberRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    @Value("${application.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    private static final String ALLOWED_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    private static final SecureRandom RANDOM = new SecureRandom();

    @Transactional
    public ImportResult importTeamMembers(Long teamId, MultipartFile file, User currentUser) {
        Team team = teamRepo.findById(teamId)
                .orElseThrow(() -> new ResourceNotFoundException("Team not found"));

        // Verify permission: current user must be the team leader, or ADMIN/FACILITATOR
        verifyPermission(team, currentUser);

        com.auca.attendance.entity.Module module = team.getModule();
        String teamName = team.getName();
        String moduleName = module.getName();
        String leaderName = currentUser.getName();

        List<String> errors = new ArrayList<>();
        int totalRows = 0;
        int imported = 0;
        int skipped = 0;

        try (InputStream is = file.getInputStream();
             Workbook workbook = new XSSFWorkbook(is)) {

            Sheet sheet = workbook.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();

            // Skip header row (row 0)
            for (int i = 1; i <= lastRow; i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                totalRows++;
                try {
                    String name = getCellStringValue(row.getCell(0));
                    String email = getCellStringValue(row.getCell(1));
                    String registrationNumber = getCellStringValue(row.getCell(2));

                    if (name == null || name.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Name is required");
                        continue;
                    }
                    if (email == null || email.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Email is required");
                        continue;
                    }
                    if (registrationNumber == null || registrationNumber.isBlank()) {
                        errors.add("Row " + (i + 1) + ": Registration number is required");
                        continue;
                    }

                    email = email.trim().toLowerCase();
                    name = name.trim();
                    registrationNumber = registrationNumber.trim();

                    // Check if student already exists by email or studentId
                    Student student = findExistingStudent(email, registrationNumber);

                    if (student != null) {
                        // Student exists — just add to team and enroll if needed
                        ensureEnrolled(student, module);
                        ensureTeamMember(team, student);
                        skipped++;
                    } else {
                        // Create new student + user account
                        String tempPassword = generateRandomPassword(12);
                        String otp = generateOtp();

                        // Create User account
                        User userAccount = User.builder()
                                .name(name)
                                .email(email)
                                .password(passwordEncoder.encode(tempPassword))
                                .role(Role.STUDENT)
                                .emailVerified(false)
                                .verificationToken(otp)
                                .emailOtpExpiresAt(LocalDateTime.now().plusHours(24))
                                .mfaEnabled(false)
                                .active(true)
                                .build();
                        userAccount = userRepo.save(userAccount);

                        // Create Student entity
                        String studentId = "STU" + registrationNumber;
                        student = Student.builder()
                                .studentId(studentId)
                                .name(name)
                                .email(email)
                                .cohortYear(java.time.Year.now().getValue())
                                .account(userAccount)
                                .build();
                        student = studentRepo.save(student);

                        // Enroll in module
                        ensureEnrolled(student, module);

                        // Add as team member
                        ensureTeamMember(team, student);

                        // Send invitation email
                        sendInvitationEmail(name, email, tempPassword, otp, teamName, moduleName, leaderName);

                        imported++;
                    }
                } catch (Exception e) {
                    log.error("Error processing row {}: {}", i + 1, e.getMessage(), e);
                    errors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Error reading Excel file: {}", e.getMessage(), e);
            throw new IllegalArgumentException("Failed to read Excel file: " + e.getMessage());
        }

        return ImportResult.builder()
                .totalRows(totalRows)
                .imported(imported)
                .skipped(skipped)
                .errors(errors)
                .build();
    }

    private void verifyPermission(Team team, User currentUser) {
        Role role = currentUser.getRole();
        if (role == Role.ADMIN || role == Role.FACILITATOR) {
            return; // admins and facilitators always allowed
        }

        // For TEAM_LEADER, verify they are actually this team's leader
        if (role == Role.TEAM_LEADER) {
            Student leaderStudent = studentRepo.findByAccountId(currentUser.getId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "No student profile linked to your account"));
            if (team.getLeader() == null || !team.getLeader().getId().equals(leaderStudent.getId())) {
                throw new IllegalArgumentException("You are not the leader of this team");
            }
            return;
        }

        throw new IllegalArgumentException("You do not have permission to import members for this team");
    }

    private Student findExistingStudent(String email, String registrationNumber) {
        // Try finding by email first
        Student student = studentRepo.findByEmailAndDeletedAtIsNull(email).orElse(null);
        if (student != null) return student;

        // Try finding by student ID
        String studentId = "STU" + registrationNumber;
        return studentRepo.findByStudentIdAndDeletedAtIsNull(studentId).orElse(null);
    }

    private void ensureEnrolled(Student student, com.auca.attendance.entity.Module module) {
        if (!enrollmentRepo.existsByStudentIdAndModuleId(student.getId(), module.getId())) {
            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .module(module)
                    .build();
            enrollmentRepo.save(enrollment);
        }
    }

    private void ensureTeamMember(Team team, Student student) {
        if (!memberRepo.existsByTeamIdAndStudentId(team.getId(), student.getId())) {
            memberRepo.save(TeamMember.builder()
                    .team(team)
                    .student(student)
                    .build());
        }
    }

    private void sendInvitationEmail(String name, String email, String tempPassword,
                                      String otp, String teamName, String moduleName, String leaderName) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(email);
            message.setSubject("AUCA Attendance System — Team Invitation");
            message.setText(
                    "Hello " + name + ",\n\n" +
                    "You've been added to team \"" + teamName + "\" in " + moduleName + " by " + leaderName + ".\n\n" +
                    "Your login credentials:\n" +
                    "Email: " + email + "\n" +
                    "Temporary Password: " + tempPassword + "\n\n" +
                    "Please log in at " + frontendUrl + "/login and verify your email.\n" +
                    "Your verification code is: " + otp + "\n\n" +
                    "AUCA Attendance System"
            );
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", email, e.getMessage());
            // Don't fail the import just because email failed
        }
    }

    private String getCellStringValue(Cell cell) {
        if (cell == null) return null;
        return switch (cell.getCellType()) {
            case STRING -> cell.getStringCellValue();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            default -> null;
        };
    }

    private String generateRandomPassword(int length) {
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALLOWED_CHARS.charAt(RANDOM.nextInt(ALLOWED_CHARS.length())));
        }
        return sb.toString();
    }

    private String generateOtp() {
        int otp = 100000 + RANDOM.nextInt(900000); // 6-digit
        return String.valueOf(otp);
    }
}
