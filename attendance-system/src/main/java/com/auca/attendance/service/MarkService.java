package com.auca.attendance.service;

import com.auca.attendance.dto.request.MarkColumnRequest;
import com.auca.attendance.dto.request.MarkEntryRequest;
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

    public List<MarkColumn> getColumns(Long moduleId) {
        return columnRepo.findByModuleId(moduleId);
    }

    public MarkColumn createColumn(Long moduleId, MarkColumnRequest request, User currentUser) {
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
        return columnRepo.save(column);
    }

    public void deleteColumn(Long columnId) {
        if (entryRepo.existsByColumnId(columnId)) {
            throw new ConflictException("Cannot delete column with existing entries");
        }
        columnRepo.deleteById(columnId);
    }

    public List<MarkEntry> getMarks(Long moduleId) {
        List<Long> columnIds = columnRepo.findByModuleId(moduleId)
                .stream().map(MarkColumn::getId).toList();
        return entryRepo.findByColumnIdIn(columnIds);
    }

    @Transactional
    public List<MarkEntry> submitMarks(Long moduleId, Long columnId,
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
            return entryRepo.save(entry);
        }).toList();
    }

    public MarkEntry updateMark(Long entryId, MarkEntryRequest request, User currentUser) {
        MarkEntry entry = entryRepo.findById(entryId)
                .orElseThrow(() -> new ResourceNotFoundException("Mark entry not found: " + entryId));
        entry.setScore(request.getScore());
        entry.setEnteredBy(currentUser);
        return entryRepo.save(entry);
    }
}
