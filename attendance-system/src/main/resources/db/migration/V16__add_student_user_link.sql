-- V16: Link students table to users table for the STUDENT role self-service portal.
-- A student may optionally have a user account (user_id nullable).
-- When an admin creates a student with createAccount=true, a User row is created
-- and this FK is set. One student ↔ one user account (UNIQUE).

ALTER TABLE students ADD COLUMN IF NOT EXISTS user_id BIGINT
    REFERENCES users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id)
    WHERE user_id IS NOT NULL;
