CREATE TABLE attendance_records (
    id                      BIGSERIAL   PRIMARY KEY,
    session_id              BIGINT      NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id              BIGINT      NOT NULL REFERENCES students(id),
    status                  VARCHAR(10) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')),
    consecutive_absent_flag BOOLEAN     NOT NULL DEFAULT FALSE,
    recorded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes                   TEXT,
    UNIQUE (session_id, student_id)
);

CREATE INDEX idx_attendance_student_session ON attendance_records(student_id, session_id);
CREATE INDEX idx_attendance_session ON attendance_records(session_id);
