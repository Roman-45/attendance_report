package com.auca.attendance.repository;

import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findAllByRole(Role role);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByGoogleId(String googleId);
}
