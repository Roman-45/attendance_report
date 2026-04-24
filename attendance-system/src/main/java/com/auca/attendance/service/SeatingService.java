package com.auca.attendance.service;

import com.auca.attendance.dto.request.BulkSeatAssignmentRequest;
import com.auca.attendance.dto.request.ClassroomLayoutRequest;
import com.auca.attendance.dto.request.SeatAssignmentRequest;
import com.auca.attendance.dto.response.ClassroomLayoutResponse;
import com.auca.attendance.dto.response.SeatAssignmentResponse;
import com.auca.attendance.entity.ClassroomLayout;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.SeatAssignment;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ClassroomLayoutRepository;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.SeatAssignmentRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SeatingService {

    private final ClassroomLayoutRepository layoutRepo;
    private final SeatAssignmentRepository seatRepo;
    private final ModuleRepository moduleRepo;
    private final StudentRepository studentRepo;
    private final TeamService teamService;
    private final TeamMemberRepository teamMemberRepo;

    @Transactional
    public ClassroomLayoutResponse createOrUpdateLayout(Long moduleId, ClassroomLayoutRequest request) {
        Module module = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        ClassroomLayout layout = layoutRepo.findByModuleId(moduleId).orElse(null);
        if (layout == null) {
            layout = ClassroomLayout.builder()
                    .module(module)
                    .totalRows(request.getTotalRows())
                    .columnsPerRow(request.getColumnsPerRow())
                    .columnGroups(request.getColumnGroups())
                    .build();
        } else {
            layout.setTotalRows(request.getTotalRows());
            layout.setColumnsPerRow(request.getColumnsPerRow());
            layout.setColumnGroups(request.getColumnGroups());
        }

        layout = layoutRepo.save(layout);
        return toLayoutResponse(layout);
    }

    @Transactional(readOnly = true)
    public ClassroomLayoutResponse getLayout(Long moduleId) {
        ClassroomLayout layout = layoutRepo.findByModuleId(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("No classroom layout for this module"));
        return toLayoutResponse(layout);
    }

    @Transactional
    public SeatAssignmentResponse assignSeat(Long moduleId, SeatAssignmentRequest request, User currentUser) {
        checkSeatPermission(moduleId, request.getStudentId(), currentUser);

        ClassroomLayout layout = layoutRepo.findByModuleId(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("No classroom layout for this module"));

        // Validate seat position is within bounds
        if (request.getRowNumber() < 1 || request.getRowNumber() > layout.getTotalRows()
                || request.getColumnNumber() < 1 || request.getColumnNumber() > layout.getColumnsPerRow()) {
            throw new IllegalArgumentException("Seat position is out of bounds");
        }

        // Check seat is not already taken
        if (seatRepo.existsByLayoutIdAndRowNumberAndColumnNumber(layout.getId(), request.getRowNumber(), request.getColumnNumber())) {
            throw new IllegalArgumentException("This seat is already taken");
        }

        // Check student doesn't already have a seat
        if (seatRepo.existsByLayoutIdAndStudentId(layout.getId(), request.getStudentId())) {
            throw new IllegalArgumentException("This student already has a seat assigned");
        }

        Student student = studentRepo.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        Student assignedByStudent = null;
        if (currentUser.getRole() == Role.STUDENT) {
            assignedByStudent = studentRepo.findByAccountId(currentUser.getId()).orElse(null);
        }

        SeatAssignment seat = SeatAssignment.builder()
                .layout(layout)
                .student(student)
                .rowNumber(request.getRowNumber())
                .columnNumber(request.getColumnNumber())
                .assignedBy(assignedByStudent)
                .build();

        return toSeatResponse(seatRepo.save(seat));
    }

    @Transactional
    public List<SeatAssignmentResponse> bulkAssignSeats(Long moduleId, BulkSeatAssignmentRequest request, User currentUser) {
        List<SeatAssignmentResponse> results = new ArrayList<>();
        for (SeatAssignmentRequest single : request.getAssignments()) {
            results.add(assignSeat(moduleId, single, currentUser));
        }
        return results;
    }

    @Transactional
    public void unassignSeat(Long moduleId, Long studentId) {
        ClassroomLayout layout = layoutRepo.findByModuleId(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("No classroom layout for this module"));
        SeatAssignment seat = seatRepo.findByLayoutIdAndStudentId(layout.getId(), studentId)
                .orElseThrow(() -> new ResourceNotFoundException("No seat found for this student"));
        seatRepo.delete(seat);
    }

    @Transactional(readOnly = true)
    public SeatAssignmentResponse getMySeat(Long moduleId, User currentUser) {
        Student student = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account"));
        ClassroomLayout layout = layoutRepo.findByModuleId(moduleId).orElse(null);
        if (layout == null) return null;
        return seatRepo.findByLayoutIdAndStudentId(layout.getId(), student.getId())
                .map(this::toSeatResponse)
                .orElse(null);
    }

    private void checkSeatPermission(Long moduleId, Long targetStudentId, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.FACILITATOR) {
            return; // Admin/Facilitator can assign anyone
        }

        if (currentUser.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only admins, facilitators, or team leaders can assign seats");
        }

        // Student must be a team leader
        Student currentStudent = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked"));

        if (!teamService.isTeamLeader(currentStudent.getId(), moduleId)) {
            throw new AccessDeniedException("Only team leaders can assign seats");
        }

        // Target student must be in the leader's team
        var leaderMembership = teamMemberRepo.findByStudentIdAndTeamModuleId(currentStudent.getId(), moduleId);
        if (leaderMembership.isEmpty()) {
            throw new AccessDeniedException("You are not a member of any team in this module");
        }

        Long leaderTeamId = leaderMembership.get().getTeam().getId();
        boolean targetInTeam = teamMemberRepo.existsByTeamIdAndStudentId(leaderTeamId, targetStudentId);
        // Also allow assigning self
        if (!targetInTeam && !targetStudentId.equals(currentStudent.getId())) {
            throw new AccessDeniedException("You can only assign seats to your team members");
        }
    }

    private ClassroomLayoutResponse toLayoutResponse(ClassroomLayout layout) {
        List<SeatAssignmentResponse> seats = seatRepo.findByLayoutId(layout.getId())
                .stream().map(this::toSeatResponse).toList();

        return ClassroomLayoutResponse.builder()
                .id(layout.getId())
                .moduleId(layout.getModule().getId())
                .moduleName(layout.getModule().getName())
                .totalRows(layout.getTotalRows())
                .columnsPerRow(layout.getColumnsPerRow())
                .columnGroups(layout.getColumnGroups())
                .seats(seats)
                .build();
    }

    private SeatAssignmentResponse toSeatResponse(SeatAssignment seat) {
        return SeatAssignmentResponse.builder()
                .id(seat.getId())
                .studentId(seat.getStudent().getId())
                .studentName(seat.getStudent().getName())
                .registrationNumber(seat.getStudent().getStudentId())
                .rowNumber(seat.getRowNumber())
                .columnNumber(seat.getColumnNumber())
                .assignedByName(seat.getAssignedBy() != null ? seat.getAssignedBy().getName() : null)
                .assignedAt(seat.getAssignedAt())
                .build();
    }
}
