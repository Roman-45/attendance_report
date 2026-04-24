package com.auca.attendance.service;

import com.auca.attendance.dto.request.AcceptInvitationRequest;
import com.auca.attendance.dto.request.InviteTeamLeaderRequest;
import com.auca.attendance.dto.response.AuthResponse;
import com.auca.attendance.entity.Student;
import com.auca.attendance.entity.Team;
import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import com.auca.attendance.exception.ConflictException;
import com.auca.attendance.exception.ResourceNotFoundException;
import com.auca.attendance.repository.StudentRepository;
import com.auca.attendance.repository.TeamRepository;
import com.auca.attendance.repository.UserRepository;
import com.auca.attendance.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvitationService {

    private final UserRepository userRepo;
    private final StudentRepository studentRepo;
    private final TeamRepository teamRepo;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Value("${application.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    /**
     * Admin invites a team leader: creates a User + Student account, assigns them
     * as the team leader, and sends an invitation email with a unique token link.
     */
    @Transactional
    public User inviteTeamLeader(InviteTeamLeaderRequest request, User admin) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepo.existsByEmail(email)) {
            throw new ConflictException("A user with email " + email + " already exists");
        }

        Team team = teamRepo.findById(request.getTeamId())
                .orElseThrow(() -> new ResourceNotFoundException("Team not found: " + request.getTeamId()));

        String invitationToken = UUID.randomUUID().toString();

        // Create user account (no password yet — set during invitation acceptance)
        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(UUID.randomUUID().toString())) // placeholder
                .role(Role.TEAM_LEADER)
                .emailVerified(false)
                .active(true)
                .mfaEnabled(false)
                .invitationToken(invitationToken)
                .invitedBy(admin)
                .invitationSentAt(LocalDateTime.now())
                .build();
        user = userRepo.save(user);

        // Create student profile
        String studentId = "STU" + request.getRegistrationNumber().trim();
        Student student = Student.builder()
                .studentId(studentId)
                .name(request.getName().trim())
                .email(email)
                .cohortYear(Year.now().getValue())
                .account(user)
                .build();
        student = studentRepo.save(student);

        // Assign as team leader
        team.setLeader(student);
        teamRepo.save(team);

        // Send invitation email
        sendInvitationEmail(user, team, invitationToken);

        log.info("Admin {} invited team leader {} for team '{}'",
                admin.getEmail(), email, team.getName());

        return user;
    }

    /**
     * Accept an invitation: validates the token, lets the user set their password,
     * marks the account as email-verified, and returns auth tokens so they can log in.
     */
    @Transactional
    public AuthResponse acceptInvitation(AcceptInvitationRequest request) {
        User user = userRepo.findByInvitationToken(request.getToken())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid or expired invitation token"));

        // Set the real password
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(true);
        user.setInvitationToken(null); // one-time use
        user = userRepo.save(user);

        // Generate tokens so user is logged in immediately
        String accessToken = jwtService.generateToken(user);

        String photoUrl = user.getProfilePhotoPath() != null ? "/api/v1/profile/photo" : null;
        return AuthResponse.builder()
                .token(accessToken)
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .photoUrl(photoUrl)
                .build();
    }

    /**
     * Validates that an invitation token exists and is still usable.
     * Returns basic info about the invitation (user name, team name).
     */
    @Transactional(readOnly = true)
    public User validateInvitationToken(String token) {
        return userRepo.findByInvitationToken(token)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Invalid or expired invitation token"));
    }

    private void sendInvitationEmail(User user, Team team, String invitationToken) {
        try {
            String acceptUrl = frontendUrl + "/accept-invitation?token=" + invitationToken;

            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(user.getEmail());
            message.setSubject("AUCA Attendance System — Team Leader Invitation");
            message.setText(
                    "Hello " + user.getName() + ",\n\n" +
                    "You've been invited as the Team Leader of \"" + team.getName() +
                    "\" in " + team.getModule().getName() + ".\n\n" +
                    "Click the link below to set your password and activate your account:\n" +
                    acceptUrl + "\n\n" +
                    "This link is single-use. Once you set your password, you can log in normally.\n\n" +
                    "AUCA Attendance System"
            );
            mailSender.send(message);
            log.info("Invitation email sent to {}", user.getEmail());
        } catch (Exception e) {
            log.warn("Failed to send invitation email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}
