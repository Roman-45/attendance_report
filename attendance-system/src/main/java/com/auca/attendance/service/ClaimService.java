package com.auca.attendance.service;

import com.auca.attendance.dto.request.ClaimRequest;
import com.auca.attendance.dto.request.ClaimResolutionRequest;
import com.auca.attendance.dto.response.ClaimResponse;
import com.auca.attendance.entity.Claim;
import com.auca.attendance.entity.Module;
import com.auca.attendance.entity.Notification;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.ClaimStatus;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.ClaimRepository;
import com.auca.attendance.repository.ModuleRepository;
import com.auca.attendance.repository.NotificationRepository;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ClaimService {

    private final ClaimRepository claimRepo;
    private final StudentRepository studentRepo;
    private final ModuleRepository moduleRepo;
    private final UserRepository userRepo;
    private final NotificationRepository notificationRepo;
    private final SseEmitterService sseEmitterService;

    @Transactional
    public ClaimResponse submitClaim(ClaimRequest request, User currentUser) {
        Student student = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account"));

        Module module = moduleRepo.findById(request.getModuleId())
                .orElseThrow(() -> new ResourceNotFoundException("Module not found"));

        Claim claim = Claim.builder()
                .student(student)
                .module(module)
                .claimType(request.getClaimType())
                .targetId(request.getTargetId())
                .description(request.getDescription())
                .status(ClaimStatus.PENDING)
                .build();

        claim = claimRepo.save(claim);

        // Notify admins
        String title = "New " + request.getClaimType() + " Claim";
        String message = String.format("Student %s submitted a %s claim for module %s",
                student.getName(), request.getClaimType(), module.getName());

        userRepo.findAllByRole(Role.ADMIN).forEach(admin -> {
            Notification notification = Notification.builder()
                    .recipient(admin)
                    .type("CLAIM")
                    .title(title)
                    .message(message)
                    .student(student)
                    .module(module)
                    .build();
            notificationRepo.save(notification);
            sseEmitterService.send(admin.getId(), Map.of(
                    "type", "CLAIM",
                    "title", title,
                    "message", message,
                    "studentName", student.getName()
            ));
        });

        return toResponse(claim);
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getMyClaims(User currentUser) {
        Student student = studentRepo.findByAccountId(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No student profile linked to this account"));
        return claimRepo.findByStudentIdOrderByCreatedAtDesc(student.getId())
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getClaimsForModule(Long moduleId, ClaimStatus status) {
        if (status != null) {
            return claimRepo.findByModuleIdAndStatus(moduleId, status)
                    .stream().map(this::toResponse).toList();
        }
        return claimRepo.findByModuleIdOrderByCreatedAtDesc(moduleId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ClaimResponse> getPendingClaims() {
        return claimRepo.findByStatusOrderByCreatedAtDesc(ClaimStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ClaimResponse resolveClaim(Long claimId, ClaimResolutionRequest request, User currentUser) {
        Claim claim = claimRepo.findById(claimId)
                .orElseThrow(() -> new ResourceNotFoundException("Claim not found"));

        if (claim.getStatus() != ClaimStatus.PENDING) {
            throw new IllegalArgumentException("Claim has already been resolved");
        }

        claim.setStatus(request.getStatus());
        claim.setResolutionNote(request.getResolutionNote());
        claim.setResolvedBy(currentUser);
        claim.setResolvedAt(OffsetDateTime.now());
        claim = claimRepo.save(claim);

        // Notify the student
        User studentUser = claim.getStudent().getAccount();
        if (studentUser != null) {
            String title = "Claim " + request.getStatus().name();
            String message = String.format("Your %s claim for %s has been %s",
                    claim.getClaimType(), claim.getModule().getName(),
                    request.getStatus().name().toLowerCase());
            if (request.getResolutionNote() != null) {
                message += ": " + request.getResolutionNote();
            }

            Notification notification = Notification.builder()
                    .recipient(studentUser)
                    .type("CLAIM_RESOLVED")
                    .title(title)
                    .message(message)
                    .student(claim.getStudent())
                    .module(claim.getModule())
                    .build();
            notificationRepo.save(notification);
            sseEmitterService.send(studentUser.getId(), Map.of(
                    "type", "CLAIM_RESOLVED",
                    "title", title,
                    "message", message
            ));
        }

        return toResponse(claim);
    }

    private ClaimResponse toResponse(Claim claim) {
        return ClaimResponse.builder()
                .id(claim.getId())
                .studentId(claim.getStudent().getId())
                .studentName(claim.getStudent().getName())
                .moduleId(claim.getModule().getId())
                .moduleName(claim.getModule().getName())
                .claimType(claim.getClaimType())
                .targetId(claim.getTargetId())
                .description(claim.getDescription())
                .status(claim.getStatus())
                .resolutionNote(claim.getResolutionNote())
                .resolvedByName(claim.getResolvedBy() != null ? claim.getResolvedBy().getName() : null)
                .resolvedAt(claim.getResolvedAt())
                .createdAt(claim.getCreatedAt())
                .build();
    }
}
