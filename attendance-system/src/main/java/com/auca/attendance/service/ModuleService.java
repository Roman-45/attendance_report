package com.auca.attendance.service;

import com.auca.attendance.dto.request.ModuleRequest;
import com.auca.attendance.dto.response.ModuleResponse;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.User;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ModuleService {

    private final ModuleRepository moduleRepository;
    private final UserRepository userRepository;

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

    @Transactional
    public ModuleResponse assignInstructor(Long moduleId, Long instructorId) {
        Module module = findModule(moduleId);
        User instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + instructorId));
        module.getInstructors().add(instructor);
        return toResponse(moduleRepository.save(module));
    }

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
                .instructors(m.getInstructors().stream().map(User::getName).toList())
                .build();
    }
}
