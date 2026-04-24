-- Update role check constraint to include TEAM_LEADER
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
    ADD CONSTRAINT users_role_check
        CHECK (role IN ('ADMIN', 'FACILITATOR', 'INSTRUCTOR', 'STUDENT', 'TEAM_LEADER'));
