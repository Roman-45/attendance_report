package com.auca.attendance.repository;

import com.auca.attendance.entity.User;
import com.auca.attendance.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findAllByRole(Role role);
    boolean existsByEmail(String email);
    Optional<User> findByVerificationToken(String verificationToken);
    Optional<User> findByGoogleId(String googleId);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))")
    Page<User> searchByNameOrEmail(@Param("q") String query, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.role = :role AND (" +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<User> searchByNameOrEmailAndRole(@Param("q") String query, @Param("role") Role role, Pageable pageable);

    Page<User> findByRole(Role role, Pageable pageable);

    Optional<User> findByInvitationToken(String invitationToken);
}
