-- 1. Add module lifecycle status (DRAFT / ACTIVE / CLOSED)
ALTER TABLE modules ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE';

-- 2. Add direct instructor → module assignment on users table
ALTER TABLE users ADD COLUMN assigned_module_id BIGINT REFERENCES modules(id);

-- 3. Backfill: for existing instructors already in module_instructors, pick their first assignment
UPDATE users u
SET assigned_module_id = sub.module_id
FROM (
    SELECT DISTINCT ON (mi.instructor_id) mi.instructor_id, mi.module_id
    FROM module_instructors mi
    ORDER BY mi.instructor_id, mi.module_id
) sub
WHERE u.id = sub.instructor_id
  AND u.role = 'INSTRUCTOR'
  AND u.assigned_module_id IS NULL;
