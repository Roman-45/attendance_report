package com.auca.attendance.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RequestEmailChangeRequest {

    @Email(message = "Must be a valid email address")
    @NotBlank(message = "New email must not be blank")
    private String newEmail;
}
