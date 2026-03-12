CREATE TABLE module_instructors (
    module_id     BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    instructor_id BIGINT NOT NULL REFERENCES users(id)   ON DELETE CASCADE,
    assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (module_id, instructor_id)
);
