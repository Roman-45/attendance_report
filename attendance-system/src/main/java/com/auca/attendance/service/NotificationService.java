package com.auca.attendance.service;

import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Notification;
import com.auca.attendance.entity.Student;
import com.auca.attendance.enums.Role;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.NotificationRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final ModuleRepository moduleRepository;
    private final JavaMailSender mailSender;

    /**
     * Notify all ADMIN users that a student has exceeded the module's absence threshold.
     *
     * @param studentId   student who crossed the threshold
     * @param moduleId    module in which the threshold was crossed
     * @param currentPct  current absence percentage (for the notification message)
     * @param threshold   the configured threshold that was crossed
     */
    @Async
    @Transactional
    public void notifyAdminsThresholdAlert(Long studentId, Long moduleId,
                                           int currentPct, int threshold) {
        Student student = studentRepository.findById(studentId).orElse(null);
        Module module   = moduleRepository.findById(moduleId).orElse(null);

        if (student == null || module == null) return;

        String title   = "Absence Threshold Exceeded";
        String message = String.format(
                "Student %s (%s) has reached %d%% absences in module '%s' (threshold: %d%%)",
                student.getName(), student.getStudentId(), currentPct, module.getName(), threshold);

        userRepository.findAllByRole(Role.ADMIN).forEach(admin -> {
            Notification notification = Notification.builder()
                    .recipient(admin)
                    .type("THRESHOLD_ALERT")
                    .title(title)
                    .message(message)
                    .student(student)
                    .module(module)
                    .build();
            notificationRepository.save(notification);

            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setTo(admin.getEmail());
                mail.setSubject("[AUCA] " + title);
                mail.setText(message);
                mailSender.send(mail);
            } catch (Exception e) {
                log.warn("Failed to send threshold alert email to {}: {}", admin.getEmail(), e.getMessage());
            }
        });
    }

    @Async
    @Transactional
    public void notifyAdmins(Long studentId, Long moduleId) {
        Student student = studentRepository.findById(studentId).orElse(null);
        Module module = moduleRepository.findById(moduleId).orElse(null);

        if (student == null || module == null) return;

        String title = "Consecutive Absence Alert";
        String message = String.format(
                "Student %s (%s) has been absent for 2 consecutive sessions in module: %s",
                student.getName(), student.getStudentId(), module.getName()
        );

        userRepository.findAllByRole(Role.ADMIN).forEach(admin -> {
            Notification notification = Notification.builder()
                    .recipient(admin)
                    .type("CONSECUTIVE_ABSENCE")
                    .title(title)
                    .message(message)
                    .student(student)
                    .module(module)
                    .build();
            notificationRepository.save(notification);

            try {
                SimpleMailMessage mail = new SimpleMailMessage();
                mail.setTo(admin.getEmail());
                mail.setSubject("[AUCA] " + title);
                mail.setText(message);
                mailSender.send(mail);
            } catch (Exception e) {
                log.warn("Failed to send email to {}: {}", admin.getEmail(), e.getMessage());
            }
        });
    }
}
