package com.auca.attendance.repository;

import com.auca.attendance.entity.ClassroomLayout;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ClassroomLayoutRepository extends JpaRepository<ClassroomLayout, Long> {
    /** The classroom layout is school-wide — there is at most one row. */
    Optional<ClassroomLayout> findFirstByOrderByIdAsc();
}
