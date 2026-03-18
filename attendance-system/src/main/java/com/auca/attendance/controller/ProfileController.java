package com.auca.attendance.controller;

import com.auca.attendance.dto.request.ConfirmEmailChangeRequest;
import com.auca.attendance.dto.request.RequestEmailChangeRequest;
import com.auca.attendance.dto.request.UpdateProfileRequest;
import com.auca.attendance.dto.response.ApiResponse;
import com.auca.attendance.entity.User;
import com.auca.attendance.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService profileService;

    /** Update display name for the authenticated user. */
    @PatchMapping
    public ResponseEntity<ApiResponse<Void>> updateName(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody UpdateProfileRequest request) {
        profileService.updateName(user, request.getName());
        return ResponseEntity.ok(ApiResponse.success("Name updated successfully", null));
    }

    /** Upload / replace profile photo. */
    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<String>> uploadPhoto(
            @AuthenticationPrincipal User user,
            @RequestParam("file") MultipartFile file) throws IOException {
        String photoUrl = profileService.uploadPhoto(user, file);
        return ResponseEntity.ok(ApiResponse.success("Photo uploaded", photoUrl));
    }

    /** Get own profile photo. */
    @GetMapping(value = "/photo", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getOwnPhoto(@AuthenticationPrincipal User user) {
        byte[] bytes = profileService.getOwnPhoto(user);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(bytes);
    }

    /** Get any user's profile photo by userId. */
    @GetMapping(value = "/photo/{userId}", produces = MediaType.IMAGE_JPEG_VALUE)
    public ResponseEntity<byte[]> getPhotoByUserId(@PathVariable Long userId) {
        byte[] bytes = profileService.getPhotoByUserId(userId);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .body(bytes);
    }

    /** Step 1: request email change — sends OTP to the new email address. */
    @PostMapping("/email/request")
    public ResponseEntity<ApiResponse<Void>> requestEmailChange(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RequestEmailChangeRequest request) {
        profileService.requestEmailChange(user, request.getNewEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Verification code sent to " + request.getNewEmail(), null));
    }

    /** Step 2: confirm email change with OTP. */
    @PostMapping("/email/confirm")
    public ResponseEntity<ApiResponse<Void>> confirmEmailChange(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ConfirmEmailChangeRequest request) {
        profileService.confirmEmailChange(user, request.getOtp());
        return ResponseEntity.ok(ApiResponse.success(
                "Email address updated. Please sign in again with your new email.", null));
    }
}
