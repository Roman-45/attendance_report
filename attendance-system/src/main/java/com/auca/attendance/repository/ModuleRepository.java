package com.auca.attendance.repository;

import com.auca.attendance.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    Optional<Module> findByCode(String code);
    boolean existsByCode(String code);
}
