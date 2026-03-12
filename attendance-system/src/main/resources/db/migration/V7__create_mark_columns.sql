CREATE TABLE mark_columns (
    id         BIGSERIAL      PRIMARY KEY,
    module_id  BIGINT         NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    name       VARCHAR(100)   NOT NULL,
    type       VARCHAR(20)    NOT NULL CHECK (type IN ('MIDTERM', 'FINAL', 'QUIZ', 'CUSTOM')),
    max_score  NUMERIC(5, 2)  NOT NULL,
    created_by BIGINT         NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);
