-- Students are populated manually during testing — only the name should be
-- mandatory. studentId stays NOT NULL because the service layer auto-generates
-- it on insert. Email/cohort_year/program/phone become optional.

ALTER TABLE students ALTER COLUMN email       DROP NOT NULL;
ALTER TABLE students ALTER COLUMN cohort_year DROP NOT NULL;

-- Drop the unique constraint on email so multiple "no email yet" students
-- can coexist. Service layer still rejects duplicates when an email is given.
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
