package com.auca.attendance.service;

import com.auca.attendance.dto.request.BulkSeatAssignmentRequest;
import com.auca.attendance.dto.request.ClassroomLayoutRequest;
import com.auca.attendance.dto.request.SeatAssignmentRequest;
import com.auca.attendance.dto.response.ClassroomLayoutResponse;
import com.auca.attendance.dto.response.SeatAssignmentResponse;
import com.auca.attendance.entity.ClassroomLayout;
import com.auca.attendance.entity.SeatAssignment;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ClassroomLayoutRepository;
import com.auca.attendance.repository.SeatAssignmentRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.TeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Manages the school-wide classroom layout and per-student seat assignments.
 * The layout is a singleton: there is exactly one row in {@code classroom_layouts}
 * regardless of module. {@code moduleId} arguments are kept on the legacy
 * per-module endpoints for permission checks (team-leader scoping) but never
 * influence which layout/seat is read or written.
 */
@Service
@RequiredArgsConstructor
public class SeatingService {

    /**
     * AUCA evening-class classroom: 8 desks per row, split into 2 groups by a
     * centre aisle (4 desks either side), 7 rows deep — 56 seats, sized for
     * a cohort capped at 50 students. Admins can override via
     * POST /api/v1/seating/layout.
     */
    private static final int DEFAULT_ROWS    = 7;
    private static final int DEFAULT_COLS    = 8;
    private static final int DEFAULT_GROUPS  = 2;

    private final ClassroomLayoutRepository layoutRepo;
    private final SeatAssignmentRepository  seatRepo;
    private final StudentRepository         studentRepo;
    private final TeamService               teamService;
    private final TeamMemberRepository      teamMemberRepo;

    // ─── Layout (singleton) ──────────────────────────────────────────────────

    @Transactional
    public ClassroomLayoutResponse createOrUpdateLayout(ClassroomLayoutRequest request) {
        ClassroomLayout layout = layoutRepo.findFirstByOrderByIdAsc()
                .orElseGet(() -> ClassroomLayout.builder()
                        .totalRows(request.getTotalRows())
                        .columnsPerRow(request.getColumnsPerRow())
                        .columnGroups(request.getColumnGroups())
                        .build());

        layout.setTotalRows(request.getTotalRows());
        layout.setColumnsPerRow(request.getColumnsPerRow());
        layout.setColumnGroups(request.getColumnGroups());
        return toLayoutResponse(layoutRepo.save(layout));
    }

    @Transactional
    public ClassroomLayoutResponse getLayout() {
        return toLayoutResponse(getOrCreateSingleton());
    }

    // ─── Seats ───────────────────────────────────────────────────────────────

    @Transactional
    public SeatAssignmentResponse assignSeat(SeatAssignmentRequest request, User currentUser) {
        ClassroomLayout layout = getOrCreateSingleton();
        checkSeatPermission(request.getStudentId(), currentUser);
        return doAssign(layout, request, currentUser);
    }

    @Transactional
    public List<SeatAssignmentResponse> bulkAssignSeats(BulkSeatAssignmentRequest request, User currentUser) {
        List<SeatAssignmentResponse> results = new ArrayList<>();
        for (SeatAssignmentRequest single : request.getAssignments()) {
            results.add(assignSeat(single, currentUser));
        }
        return results;
    }

    @Transactional
    public void unassignSeat(Long studentId) {
        ClassroomLayout layout = getOrCreateSingleton();
        SeatAssignment seat = seatRepo.findByLayoutIdAndStudentId(layout.getId(), studentId)
                .orElseThrow(() -> new ResourceNotFoundException("No seat found for this student"));
        seatRepo.delete(seat);
    }

    @Transactional(readOnly = true)
    public SeatAssignmentResponse getMySeat(User currentUser) {
        Student student = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account"));
        ClassroomLayout layout = layoutRepo.findFirstByOrderByIdAsc().orElse(null);
        if (layout == null) return null;
        return seatRepo.findByLayoutIdAndStudentId(layout.getId(), student.getId())
                .map(this::toSeatResponse)
                .orElse(null);
    }

    // ─── Legacy per-module endpoints (keep working for team-leader flow) ─────
    // moduleId is used only for permission scoping; the layout/seat is global.

    @Transactional
    public ClassroomLayoutResponse createOrUpdateLayout(Long moduleId, ClassroomLayoutRequest request) {
        return createOrUpdateLayout(request);
    }

    @Transactional(readOnly = true)
    public ClassroomLayoutResponse getLayout(Long moduleId) {
        return getLayout();
    }

    @Transactional
    public SeatAssignmentResponse assignSeat(Long moduleId, SeatAssignmentRequest request, User currentUser) {
        ClassroomLayout layout = getOrCreateSingleton();
        checkSeatPermissionPerModule(moduleId, request.getStudentId(), currentUser);
        return doAssign(layout, request, currentUser);
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
        unassignSeat(studentId);
    }

    @Transactional(readOnly = true)
    public SeatAssignmentResponse getMySeat(Long moduleId, User currentUser) {
        return getMySeat(currentUser);
    }

    // ─── Internals ───────────────────────────────────────────────────────────

    private ClassroomLayout getOrCreateSingleton() {
        return layoutRepo.findFirstByOrderByIdAsc().orElseGet(() ->
                layoutRepo.save(ClassroomLayout.builder()
                        .totalRows(DEFAULT_ROWS)
                        .columnsPerRow(DEFAULT_COLS)
                        .columnGroups(DEFAULT_GROUPS)
                        .build()));
    }

    private SeatAssignmentResponse doAssign(
            ClassroomLayout layout,
            SeatAssignmentRequest request,
            User currentUser) {

        if (request.getRowNumber() < 1 || request.getRowNumber() > layout.getTotalRows()
                || request.getColumnNumber() < 1 || request.getColumnNumber() > layout.getColumnsPerRow()) {
            throw new IllegalArgumentException("Seat position is out of bounds");
        }

        if (seatRepo.existsByLayoutIdAndRowNumberAndColumnNumber(
                layout.getId(), request.getRowNumber(), request.getColumnNumber())) {
            throw new IllegalArgumentException("This seat is already taken");
        }

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

    private void checkSeatPermission(Long targetStudentId, User currentUser) {
        // Global seating: only ADMIN/FACILITATOR can assign.
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.FACILITATOR) {
            throw new AccessDeniedException("Only admins or facilitators can assign global seats");
        }
    }

    private void checkSeatPermissionPerModule(Long moduleId, Long targetStudentId, User currentUser) {
        if (currentUser.getRole() == Role.ADMIN || currentUser.getRole() == Role.FACILITATOR) {
            return;
        }

        if (currentUser.getRole() != Role.STUDENT) {
            throw new AccessDeniedException("Only admins, facilitators, or team leaders can assign seats");
        }

        Student currentStudent = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked"));

        if (!teamService.isTeamLeader(currentStudent.getId(), moduleId)) {
            throw new AccessDeniedException("Only team leaders can assign seats");
        }

        var leaderMembership = teamMemberRepo.findByStudentIdAndTeamModuleId(currentStudent.getId(), moduleId);
        if (leaderMembership.isEmpty()) {
            throw new AccessDeniedException("You are not a member of any team in this module");
        }

        Long leaderTeamId = leaderMembership.get().getTeam().getId();
        boolean targetInTeam = teamMemberRepo.existsByTeamIdAndStudentId(leaderTeamId, targetStudentId);
        if (!targetInTeam && !targetStudentId.equals(currentStudent.getId())) {
            throw new AccessDeniedException("You can only assign seats to your team members");
        }
    }

    private ClassroomLayoutResponse toLayoutResponse(ClassroomLayout layout) {
        List<SeatAssignmentResponse> seats = seatRepo.findByLayoutId(layout.getId())
                .stream().map(this::toSeatResponse).toList();

        return ClassroomLayoutResponse.builder()
                .id(layout.getId())
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
