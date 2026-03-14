-- Seed initial users
-- Password for all: Admin@1234
INSERT INTO users (name, email, password, role) VALUES
    ('System Admin',   'admin@auca.ac.rw',       '$2b$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii', 'ADMIN'),
    ('John Facilitator', 'facilitator@auca.ac.rw', '$2b$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii', 'FACILITATOR'),
    ('Jane Instructor',  'instructor@auca.ac.rw',  '$2b$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii', 'INSTRUCTOR')
ON CONFLICT (email) DO NOTHING;
