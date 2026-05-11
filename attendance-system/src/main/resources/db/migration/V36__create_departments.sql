-- Departments are first-class entities. Students and modules optionally
-- belong to a department. Admins manage the list via /api/v1/departments.

CREATE TABLE departments (
    id          BIGSERIAL    PRIMARY KEY,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE students
    ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE modules
    ADD COLUMN department_id BIGINT REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_modules_department  ON modules(department_id);
