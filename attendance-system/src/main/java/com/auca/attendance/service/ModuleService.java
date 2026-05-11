package com.auca.attendance.service;

import com.auca.attendance.dto.request.ModuleRequest;
import com.auca.attendance.dto.response.InstructorCandidate;
import com.auca.attendance.dto.response.ModuleResponse;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.ModuleStatus;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

    // ─── Existing (unchanged) ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ModuleResponse> getAll() {
        return moduleRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public ModuleResponse getById(Long id) {
        return toResponse(findModule(id));
    }

    @Transactional
    public ModuleResponse create(ModuleRequest request, User currentUser) {
        if (moduleRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Module code already exists: " + request.getCode());
        }
        Module module = Module.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .createdBy(currentUser)
                .build();
        return toResponse(moduleRepository.save(module));
    }

    @Transactional
    public ModuleResponse update(Long id, ModuleRequest request) {
        Module module = findModule(id);
        module.setCode(request.getCode());
        module.setName(request.getName());
        module.setDescription(request.getDescription());
        module.setStartDate(request.getStartDate());
        module.setEndDate(request.getEndDate());
        return toResponse(moduleRepository.save(module));
    }

    /**
     * Assign an instructor to a module enforcing 1-to-1:
     *  - the user must have role INSTRUCTOR
     *  - if they already teach a different module, they are unbound from it first
     *  - the target module must not already have a *different* instructor
     */
    @Transactional
    public ModuleResponse assignInstructor(Long moduleId, Long instructorId) {
        Module module = findModule(moduleId);
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + instructorId));

        if (instructor.getRole() != Role.INSTRUCTOR) {
            throw new ConflictException("User " + instructor.getName() + " is not an instructor");
        }

        // If the module already has an instructor, refuse unless it's the same one.
        if (!module.getInstructors().isEmpty()
                && module.getInstructors().stream().noneMatch(u -> u.getId().equals(instructorId))) {
            User current = module.getInstructors().iterator().next();
            throw new ConflictException(
                    "Module already has an instructor (" + current.getName()
                            + "). Unassign them first.");
        }

        // If this instructor was bound to a different module, unbind them first.
        Module previous = instructor.getAssignedModule();
        if (previous != null && !previous.getId().equals(moduleId)) {
            previous.getInstructors().removeIf(u -> u.getId().equals(instructorId));
            moduleRepository.save(previous);
        }

        module.getInstructors().add(instructor);
        instructor.setAssignedModule(module);
        userRepository.save(instructor);
        return toResponse(moduleRepository.save(module));
    }

    /** Every active INSTRUCTOR with the module they currently teach (or null if free). */
    @Transactional(readOnly = true)
    public List<InstructorCandidate> listInstructorCandidates() {
        return userRepository.findAllByRole(Role.INSTRUCTOR).stream()
                .filter(u -> Boolean.TRUE.equals(u.getActive()))
                .map(u -> {
                    Module assigned = u.getAssignedModule();
                    return InstructorCandidate.builder()
                            .id(u.getId())
                            .name(u.getName())
                            .email(u.getEmail())
                            .currentModuleId(assigned != null ? assigned.getId() : null)
                            .currentModuleCode(assigned != null ? assigned.getCode() : null)
                            .build();
                })
                .toList();
    }

    /** Unbind an instructor from a module (their assigned_module_id is cleared). */
    @Transactional
    public ModuleResponse unassignInstructor(Long moduleId, Long instructorId) {
        Module module = findModule(moduleId);
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + instructorId));

        module.getInstructors().removeIf(u -> u.getId().equals(instructorId));
        if (instructor.getAssignedModule() != null
                && instructor.getAssignedModule().getId().equals(moduleId)) {
            instructor.setAssignedModule(null);
            userRepository.save(instructor);
        }
        return toResponse(moduleRepository.save(module));
    }

    // ─── Instructor Module Selection (first login) ───────────────────────────

    /** Returns modules that have no instructor assigned yet. */
    @Transactional(readOnly = true)
    public List<ModuleResponse> getAvailableForSelection() {
        return moduleRepository.findUnassignedModules().stream().map(this::toResponse).toList();
    }

    /** Returns the single module assigned to this instructor. */
    @Transactional(readOnly = true)
    public ModuleResponse getForInstructor(User instructor) {
        Module module = moduleRepository.findByAssignedInstructorId(instructor.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No module assigned to this instructor"));
        return toResponse(module);
    }

    /** Role-aware: instructors see only their module; admins/facilitators see all. */
    @Transactional(readOnly = true)
    public List<ModuleResponse> getForUser(User user) {
        if (user.getRole() == Role.INSTRUCTOR) {
            return moduleRepository.findByAssignedInstructorId(user.getId())
                    .map(m -> List.of(toResponse(m)))
                    .orElse(List.of());
        }
        return getAll();
    }

    /** One-time module selection for an instructor. */
    @Transactional
    public ModuleResponse selectModule(User instructor, Long moduleId) {
        if (instructor.getAssignedModule() != null) {
            throw new ConflictException("You have already selected a module");
        }

        Module module = findModule(moduleId);

        // Check that no other instructor is already assigned
        if (!module.getInstructors().isEmpty()) {
            throw new ConflictException("This module already has an instructor assigned");
        }

        // Set both the direct FK and the join table
        instructor.setAssignedModule(module);
        module.getInstructors().add(instructor);
        userRepository.save(instructor);
        moduleRepository.save(module);

        return toResponse(module);
    }

    // ─── Module Lifecycle (Start / Close) ────────────────────────────────────

    /** Transition a module's status. Only the assigned instructor can do this. */
    @Transactional
    public ModuleResponse updateStatus(Long moduleId, ModuleStatus newStatus, User instructor) {
        Module module = findModule(moduleId);

        // Verify this instructor owns the module
        if (instructor.getAssignedModule() == null || !instructor.getAssignedModule().getId().equals(moduleId)) {
            throw new AccessDeniedException("You are not assigned to this module");
        }

        ModuleStatus current = module.getStatus();

        // Validate transitions: DRAFT -> ACTIVE, ACTIVE -> CLOSED
        if (current == ModuleStatus.DRAFT && newStatus == ModuleStatus.ACTIVE) {
            module.setStatus(ModuleStatus.ACTIVE);
        } else if (current == ModuleStatus.ACTIVE && newStatus == ModuleStatus.CLOSED) {
            module.setStatus(ModuleStatus.CLOSED);
        } else {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + current + " -> " + newStatus);
        }

        return toResponse(moduleRepository.save(module));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Module findModule(Long id) {
        return moduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Module not found: " + id));
    }

    private ModuleResponse toResponse(Module m) {
        return ModuleResponse.builder()
                .id(m.getId())
                .code(m.getCode())
                .name(m.getName())
                .description(m.getDescription())
                .startDate(m.getStartDate())
                .endDate(m.getEndDate())
                .status(m.getStatus().name())
                .instructors(m.getInstructors().stream().map(User::getName).toList())
                .build();
    }
}
