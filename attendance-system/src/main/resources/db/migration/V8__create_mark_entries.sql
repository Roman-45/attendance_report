CREATE TABLE mark_entries (
    id          BIGSERIAL     PRIMARY KEY,
    column_id   BIGINT        NOT NULL REFERENCES mark_columns(id) ON DELETE CASCADE,
    student_id  BIGINT        NOT NULL REFERENCES students(id),
    score       NUMERIC(5, 2),
    entered_by  BIGINT        NOT NULL REFERENCES users(id),
    entered_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (column_id, student_id)
);
