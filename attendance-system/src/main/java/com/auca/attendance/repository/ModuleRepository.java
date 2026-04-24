package com.auca.attendance.repository;

import com.auca.attendance.entity.Module;
import com.auca.attendance.enums.ModuleStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    Optional<Module> findByCode(String code);
    boolean existsByCode(String code);

    /** Modules that no instructor has been assigned to yet (available for first-login selection). */
    @Query("SELECT m FROM Module m WHERE m.instructors IS EMPTY")
    List<Module> findUnassignedModules();

    /** Find the module assigned to a specific instructor via the users.assigned_module_id FK. */
    @Query("SELECT m FROM Module m JOIN User u ON u.assignedModule = m WHERE u.id = :instructorId")
    Optional<Module> findByAssignedInstructorId(@Param("instructorId") Long instructorId);

    List<Module> findByStatus(ModuleStatus status);
}
