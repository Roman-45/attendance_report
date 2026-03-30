CREATE TABLE teams (
    id BIGSERIAL PRIMARY KEY,
    module_id BIGINT NOT NULL REFERENCES modules(id),
    name VARCHAR(100) NOT NULL,
    leader_student_id BIGINT REFERENCES students(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(module_id, name)
);

CREATE TABLE team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id BIGINT NOT NULL REFERENCES students(id),
    joined_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

CREATE INDEX idx_team_members_student ON team_members(student_id);
