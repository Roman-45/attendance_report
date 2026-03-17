package com.auca.attendance.service;

import com.auca.attendance.dto.request.MarkColumnRequest;
import com.auca.attendance.dto.request.MarkEntryRequest;
import com.auca.attendance.dto.response.MarkColumnResponse;
import com.auca.attendance.dto.response.MarkEntryResponse;
import com.auca.attendance.entity.MarkColumn;
import com.auca.attendance.entity.MarkEntry;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarkService {

    private final MarkColumnRepository columnRepo;
    private final MarkEntryRepository entryRepo;
    private final ModuleRepository moduleRepo;
    private final StudentRepository studentRepo;

    @Transactional(readOnly = true)
    public List<MarkColumnResponse> getColumns(Long moduleId) {
        return columnRepo.findByModuleId(moduleId)
                .stream().map(this::toColumnResponse).toList();
    }

    @Transactional
    public MarkColumnResponse createColumn(Long moduleId, MarkColumnRequest request, User currentUser) {
        var module = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + moduleId));

        if (columnRepo.existsByModuleIdAndName(moduleId, request.getName())) {
            throw new ConflictException("Column already exists: " + request.getName());
        }

        MarkColumn column = MarkColumn.builder()
                .module(module)
                .name(request.getName())
                .type(request.getType())
                .maxScore(request.getMaxScore())
                .createdBy(currentUser)
                .build();
        return toColumnResponse(columnRepo.save(column));
    }

    public void deleteColumn(Long columnId) {
        if (entryRepo.existsByColumnId(columnId)) {
            throw new ConflictException("Cannot delete column with existing entries");
        }
        columnRepo.deleteById(columnId);
    }

    @Transactional(readOnly = true)
    public List<MarkEntryResponse> getMarks(Long moduleId) {
        List<Long> columnIds = columnRepo.findByModuleId(moduleId)
                .stream().map(MarkColumn::getId).toList();
        return entryRepo.findByColumnIdIn(columnIds)
                .stream().map(this::toEntryResponse).toList();
    }

    @Transactional
    public List<MarkEntryResponse> submitMarks(Long moduleId, Long columnId,
                                               List<MarkEntryRequest> requests, User currentUser) {
        MarkColumn column = columnRepo.findById(columnId)
                .orElseThrow(() -> new ResourceNotFoundException("Column not found: " + columnId));

        return requests.stream().map(req -> {
            Student student = studentRepo.findById(req.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student not found: " + req.getStudentId()));

            MarkEntry entry = entryRepo.findByColumnIdAndStudentId(columnId, req.getStudentId())
                    .orElse(MarkEntry.builder().column(column).student(student).enteredBy(currentUser).build());

            entry.setScore(req.getScore());
            entry.setEnteredBy(currentUser);
            return toEntryResponse(entryRepo.save(entry));
        }).toList();
    }

    @Transactional
    public MarkEntryResponse updateMark(Long entryId, MarkEntryRequest request, User currentUser) {
        MarkEntry entry = entryRepo.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Mark entry not found: " + entryId));
        entry.setScore(request.getScore());
        entry.setEnteredBy(currentUser);
        return toEntryResponse(entryRepo.save(entry));
    }

    // ─── Mappers ────────────────────────────────────────────────────────────
    private MarkColumnResponse toColumnResponse(MarkColumn c) {
        return MarkColumnResponse.builder()
                .id(c.getId())
                .moduleId(c.getModule().getId())
                .moduleName(c.getModule().getName())
                .name(c.getName())
                .type(c.getType())
                .maxScore(c.getMaxScore())
                .weight(c.getWeight())
                .createdBy(c.getCreatedBy().getName())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private MarkEntryResponse toEntryResponse(MarkEntry e) {
        return MarkEntryResponse.builder()
                .id(e.getId())
                .columnId(e.getColumn().getId())
                .columnName(e.getColumn().getName())
                .columnType(e.getColumn().getType())
                .maxScore(e.getColumn().getMaxScore())
                .studentId(e.getStudent().getId())
                .studentName(e.getStudent().getName())
                .studentCode(e.getStudent().getStudentId())
                .score(e.getScore())
                .enteredBy(e.getEnteredBy().getName())
                .enteredAt(e.getEnteredAt())
                .build();
    }
}
