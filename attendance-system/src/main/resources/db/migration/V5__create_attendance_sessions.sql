CREATE TABLE attendance_sessions (
    id             BIGSERIAL   PRIMARY KEY,
    module_id      BIGINT      NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    session_date   DATE        NOT NULL,
    start_time     TIME        NOT NULL,
    end_time       TIME,
    period         VARCHAR(20) CHECK (period IN ('MORNING', 'AFTERNOON')),
    created_by     BIGINT      NOT NULL REFERENCES users(id),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_module_date ON attendance_sessions(module_id, session_date DESC);
