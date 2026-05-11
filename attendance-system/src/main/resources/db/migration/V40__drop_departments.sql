-- Departments removed: students.program now stands in for department.
-- Drop FK columns first, then the parent table.

ALTER TABLE students DROP COLUMN IF EXISTS department_id;
ALTER TABLE modules  DROP COLUMN IF EXISTS department_id;

DROP TABLE IF EXISTS departments;
