CREATE TABLE students (
    id          BIGSERIAL    PRIMARY KEY,
    student_id  VARCHAR(20)  NOT NULL UNIQUE,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    cohort_year INT          NOT NULL,
    program     VARCHAR(100),
    phone       VARCHAR(20),
    deleted_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_students_cohort_year ON students(cohort_year);
