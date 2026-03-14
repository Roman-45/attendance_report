CREATE TABLE enrollments (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    module_id   BIGINT NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_enrollment UNIQUE (student_id, module_id)
);

CREATE INDEX idx_enrollments_module_id  ON enrollments(module_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
