package com.auca.attendance.service;

import com.auca.attendance.entity.ScheduledReportConfig;
import com.auca.attendance.repository.ScheduledReportConfigRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledReportService {

    private final ScheduledReportConfigRepository configRepo;
    private final ReportGenerationService reportService;
    private final JavaMailSender mailSender;

    @Scheduled(cron = "0 0 6 * * *") // Daily at 6 AM
    public void runDailyReports() {
        sendReports("DAILY");
    }

    @Scheduled(cron = "0 0 7 * * MON") // Weekly Monday 7 AM
    public void runWeeklyReports() {
        sendReports("WEEKLY");
    }

    @Scheduled(cron = "0 0 8 1 * *") // Monthly 1st at 8 AM
    public void runMonthlyReports() {
        sendReports("MONTHLY");
    }

    @Transactional
    public void sendReports(String frequency) {
        List<ScheduledReportConfig> configs = configRepo.findByEnabledTrueAndFrequency(frequency);
        for (ScheduledReportConfig cfg : configs) {
            try {
                Long moduleId = cfg.getModule().getId();
                String moduleName = cfg.getModule().getName();
                byte[] report;
                String filename;

                if ("MARKS".equalsIgnoreCase(cfg.getReportType())) {
                    report = reportService.generateMarksExcel(moduleId);
                    filename = moduleName.replaceAll("\\s+", "_") + "_marks.xlsx";
                } else {
                    report = reportService.generateAttendanceExcel(moduleId);
                    filename = moduleName.replaceAll("\\s+", "_") + "_attendance.xlsx";
                }

                sendEmailWithAttachment(cfg.getRecipientEmail(),
                        frequency + " Report: " + moduleName,
                        "Please find the attached " + cfg.getReportType().toLowerCase()
                                + " report for " + moduleName + ".",
                        filename, report);

                cfg.setLastSentAt(OffsetDateTime.now());
                configRepo.save(cfg);
                log.info("Sent {} {} report for module {} to {}", frequency, cfg.getReportType(), moduleId, cfg.getRecipientEmail());
            } catch (Exception e) {
                log.error("Failed to send scheduled report id={}: {}", cfg.getId(), e.getMessage());
            }
        }
    }

    private void sendEmailWithAttachment(String to, String subject, String body, String filename, byte[] attachment) {
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);
            helper.addAttachment(filename, () -> new java.io.ByteArrayInputStream(attachment));
            mailSender.send(msg);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
