package com.auca.attendance.service;

import com.auca.attendance.dto.response.GradeResponse;
import com.auca.attendance.entity.AttendanceRecord;
import com.auca.attendance.entity.AttendanceSession;
import com.auca.attendance.entity.Enrollment;
import com.auca.attendance.entity.MarkColumn;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Student;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportGenerationService {

    private final ModuleRepository moduleRepo;
    private final EnrollmentRepository enrollmentRepo;
    private final AttendanceSessionRepository sessionRepo;
    private final AttendanceRecordRepository recordRepo;
    private final GradeComputationService gradeService;
    private final MarkColumnRepository columnRepo;

    // ─── Attendance Excel ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateAttendanceExcel(Long moduleId) throws IOException {
        Module module = findModule(moduleId);
        List<Enrollment> enrollments = enrollmentRepo.findByModuleId(moduleId);
        List<AttendanceSession> sessions = sessionRepo.findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Attendance - " + module.getCode());

            // Header style
            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            // Header row
            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Student ID");
            header.createCell(1).setCellValue("Student Name");
            int col = 2;
            DateTimeFormatter df = DateTimeFormatter.ofPattern("MM/dd");
            for (AttendanceSession s : sessions) {
                header.createCell(col++).setCellValue(s.getSessionDate().format(df));
            }
            header.createCell(col).setCellValue("Attendance %");
            for (int i = 0; i <= col; i++) header.getCell(i).setCellStyle(headerStyle);

            // Data rows
            int rowIdx = 1;
            for (Enrollment e : enrollments) {
                Student student = e.getStudent();
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(student.getStudentId());
                row.createCell(1).setCellValue(student.getName());

                int present = 0;
                int total = 0;
                int c = 2;
                for (AttendanceSession s : sessions) {
                    var rec = recordRepo.findBySessionIdAndStudentId(s.getId(), student.getId());
                    String status = rec.map(AttendanceRecord::getStatus).orElse("-");
                    row.createCell(c++).setCellValue(status);
                    if (!"\u2212".equals(status) && !"-".equals(status)) {
                        total++;
                        if ("PRESENT".equals(status) || "LATE".equals(status)) present++;
                    }
                }
                double pct = total > 0 ? Math.round((double) present / total * 1000.0) / 10.0 : 0;
                row.createCell(c).setCellValue(pct + "%");
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─── Attendance PDF ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateAttendancePdf(Long moduleId) throws IOException {
        Module module = findModule(moduleId);
        List<Enrollment> enrollments = enrollmentRepo.findByModuleId(moduleId);
        List<AttendanceSession> sessions = sessionRepo.findByModuleIdOrderBySessionDateDescStartTimeDesc(moduleId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4.rotate());
        Document doc = new Document(pdf);

        doc.add(new Paragraph("Attendance Report: " + module.getName() + " (" + module.getCode() + ")")
                .setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph(" "));

        int cols = Math.min(sessions.size(), 10) + 3; // cap columns for readability
        Table table = new Table(UnitValue.createPercentArray(cols)).useAllAvailableWidth();

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Name").setBold()));
        DateTimeFormatter df = DateTimeFormatter.ofPattern("MM/dd");
        int sessionLimit = Math.min(sessions.size(), 10);
        for (int i = 0; i < sessionLimit; i++) {
            table.addHeaderCell(new Cell().add(new Paragraph(sessions.get(i).getSessionDate().format(df)).setBold()));
        }
        table.addHeaderCell(new Cell().add(new Paragraph("Att%").setBold()));

        for (Enrollment e : enrollments) {
            Student student = e.getStudent();
            table.addCell(student.getStudentId());
            table.addCell(student.getName());
            int present = 0, total = 0;
            for (int i = 0; i < sessionLimit; i++) {
                var rec = recordRepo.findBySessionIdAndStudentId(sessions.get(i).getId(), student.getId());
                String status = rec.map(AttendanceRecord::getStatus).orElse("-");
                table.addCell(status.substring(0, 1)); // P/A/L/E/-
                if (!"-".equals(status)) {
                    total++;
                    if ("PRESENT".equals(status) || "LATE".equals(status)) present++;
                }
            }
            double pct = total > 0 ? Math.round((double) present / total * 1000.0) / 10.0 : 0;
            table.addCell(pct + "%");
        }

        doc.add(table);
        doc.close();
        return out.toByteArray();
    }

    // ─── Marks Excel ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateMarksExcel(Long moduleId) throws IOException {
        Module module = findModule(moduleId);
        List<GradeResponse> grades = gradeService.computeGradesForModule(moduleId);
        List<MarkColumn> columns = columnRepo.findByModuleId(moduleId);

        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Marks - " + module.getCode());

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            Row header = sheet.createRow(0);
            header.createCell(0).setCellValue("Student ID");
            header.createCell(1).setCellValue("Student Name");
            int col = 2;
            for (MarkColumn mc : columns) {
                header.createCell(col++).setCellValue(mc.getName() + " (/" + mc.getMaxScore() + ")");
            }
            header.createCell(col).setCellValue("Average (%)");
            header.createCell(col + 1).setCellValue("Grade");
            for (int i = 0; i <= col + 1; i++) header.getCell(i).setCellStyle(headerStyle);

            int rowIdx = 1;
            for (GradeResponse g : grades) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(g.getStudentCode());
                row.createCell(1).setCellValue(g.getStudentName());
                int c = 2;
                for (MarkColumn mc : columns) {
                    var bd = g.getBreakdown().stream()
                            .filter(b -> b.getColumnId().equals(mc.getId()))
                            .findFirst();
                    row.createCell(c++).setCellValue(bd.map(b -> b.getScore().doubleValue()).orElse(0.0));
                }
                row.createCell(c).setCellValue(g.getWeightedAverage().doubleValue());
                row.createCell(c + 1).setCellValue(g.getGradeLetter());
            }

            wb.write(out);
            return out.toByteArray();
        }
    }

    // ─── Marks PDF ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public byte[] generateMarksPdf(Long moduleId) throws IOException {
        Module module = findModule(moduleId);
        List<GradeResponse> grades = gradeService.computeGradesForModule(moduleId);
        List<MarkColumn> columns = columnRepo.findByModuleId(moduleId);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = new PdfWriter(out);
        PdfDocument pdf = new PdfDocument(writer);
        pdf.setDefaultPageSize(com.itextpdf.kernel.geom.PageSize.A4.rotate());
        Document doc = new Document(pdf);

        doc.add(new Paragraph("Marks Report: " + module.getName() + " (" + module.getCode() + ")")
                .setBold().setFontSize(14).setTextAlignment(TextAlignment.CENTER));
        doc.add(new Paragraph(" "));

        int colCount = columns.size() + 4; // ID, Name, columns..., Avg, Grade
        Table table = new Table(UnitValue.createPercentArray(colCount)).useAllAvailableWidth();

        table.addHeaderCell(new Cell().add(new Paragraph("ID").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Name").setBold()));
        for (MarkColumn mc : columns) {
            table.addHeaderCell(new Cell().add(new Paragraph(mc.getName()).setBold()));
        }
        table.addHeaderCell(new Cell().add(new Paragraph("Avg%").setBold()));
        table.addHeaderCell(new Cell().add(new Paragraph("Grade").setBold()));

        for (GradeResponse g : grades) {
            table.addCell(g.getStudentCode());
            table.addCell(g.getStudentName());
            for (MarkColumn mc : columns) {
                var bd = g.getBreakdown().stream()
                        .filter(b -> b.getColumnId().equals(mc.getId()))
                        .findFirst();
                table.addCell(bd.map(b -> b.getScore().toPlainString()).orElse("0"));
            }
            table.addCell(g.getWeightedAverage().toPlainString());
            table.addCell(g.getGradeLetter());
        }

        doc.add(table);
        doc.close();
        return out.toByteArray();
    }

    private Module findModule(Long moduleId) {
        return moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));
    }
}
