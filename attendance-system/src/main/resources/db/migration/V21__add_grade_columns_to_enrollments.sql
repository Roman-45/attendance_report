ALTER TABLE enrollments ADD COLUMN final_grade NUMERIC(5,2);
ALTER TABLE enrollments ADD COLUMN grade_letter VARCHAR(5);
ALTER TABLE enrollments ADD COLUMN grade_computed_at TIMESTAMPTZ;
