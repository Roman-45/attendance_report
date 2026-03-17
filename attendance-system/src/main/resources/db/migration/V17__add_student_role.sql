-- Allow STUDENT as a valid role in the users table.
-- The original CHECK constraint in V1 only allowed ADMIN, FACILITATOR, INSTRUCTOR.

ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
        CHECK (role IN ('ADMIN', 'FACILITATOR', 'INSTRUCTOR', 'STUDENT'));
