-- ─────────────────────────────────────────────────────────────────
-- Demo data for the AUCA Attendance & Marks Management System.
--
-- Populates: modules, students, enrollments, attendance sessions,
-- consecutive-absence flags (DNS Risk), mark columns + entries,
-- seat assignments, and notifications — so every screen reflects
-- realistic activity for documentation screenshots.
--
-- Idempotent: wipes existing business data first. Keeps the three
-- seeded login accounts (admin, facilitator, instructor) and adds
-- two extra INSTRUCTOR users so the "Assign instructor" candidate
-- dropdown is meaningful.
--
-- Apply via psql:
--   psql -U postgres -d attendance_db -f demo-seed.sql
-- ─────────────────────────────────────────────────────────────────

BEGIN;

-- ─── 1. WIPE business data (FK-safe order) ──────────────────────
UPDATE users SET assigned_module_id = NULL;

DELETE FROM attendance_records;
DELETE FROM attendance_sessions;
DELETE FROM mark_entries;
DELETE FROM mark_columns;
DELETE FROM seat_assignments;
DELETE FROM claims;
DELETE FROM team_members;
DELETE FROM teams;
DELETE FROM notifications;
DELETE FROM audit_log;
DELETE FROM enrollments;
DELETE FROM module_instructors;
DELETE FROM modules;
DELETE FROM students;

-- Drop auxiliary records belonging to extra users we are about to remove.
DELETE FROM refresh_tokens        WHERE user_id > 3;
DELETE FROM password_reset_tokens WHERE user_id > 3;
DELETE FROM mfa_challenges        WHERE user_id > 3;
DELETE FROM user_preferences      WHERE user_id > 3;
DELETE FROM users                 WHERE id      > 3;

-- Reset auto-incrementing sequences so IDs are deterministic.
SELECT setval(pg_get_serial_sequence('modules',              'id'), 1, false);
SELECT setval(pg_get_serial_sequence('students',             'id'), 1, false);
SELECT setval(pg_get_serial_sequence('attendance_sessions',  'id'), 1, false);
SELECT setval(pg_get_serial_sequence('attendance_records',   'id'), 1, false);
SELECT setval(pg_get_serial_sequence('mark_columns',         'id'), 1, false);
SELECT setval(pg_get_serial_sequence('mark_entries',         'id'), 1, false);
SELECT setval(pg_get_serial_sequence('enrollments',          'id'), 1, false);
SELECT setval(pg_get_serial_sequence('seat_assignments',     'id'), 1, false);
SELECT setval(pg_get_serial_sequence('notifications',        'id'), 1, false);
SELECT setval(pg_get_serial_sequence('audit_log',            'id'), 1, false);

-- ─── 2. EXTRA INSTRUCTOR USERS ──────────────────────────────────
-- Bcrypt hash for password 'Admin@1234' (matches V10 seed).
INSERT INTO users (id, name, email, password, role, active, email_verified) VALUES
  (4, 'Eric Habimana',   'eric.habimana@auca.ac.rw',
      '$2b$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii', 'INSTRUCTOR', true, true),
  (5, 'Liliane Uwineza', 'liliane.uwineza@auca.ac.rw',
      '$2b$10$ARR1W925Vg6QKiabe38WheykVYXCHKfQx2hqJDIxCup3ltK2evYii', 'INSTRUCTOR', true, true);
SELECT setval('users_id_seq', 5, true);

-- ─── 3. MODULES (3 active evening modules) ──────────────────────
INSERT INTO modules (id, code, name, description, start_date, end_date, status, absence_threshold_percent, created_by) VALUES
  (1, 'SE301', 'Software Engineering Principles',
      'Design patterns, software architecture, and team practices.',
      '2026-04-01', '2026-07-15', 'ACTIVE', 25, 1),
  (2, 'DB202', 'Database Systems',
      'Relational design, normalisation, transactions, and SQL.',
      '2026-04-01', '2026-07-15', 'ACTIVE', 25, 1),
  (3, 'AC101', 'Accounting Principles',
      'Bookkeeping, journals, and financial statements.',
      '2026-04-01', '2026-07-15', 'ACTIVE', 25, 1);
SELECT setval('modules_id_seq', 3, true);

-- ─── 4. INSTRUCTOR ASSIGNMENT (1-to-1 invariant) ────────────────
-- SE301 → Jane Instructor (id=3)
-- DB202 → Eric Habimana   (id=4)
-- AC101 → unassigned (so admin/facilitator can demonstrate the dialog)
INSERT INTO module_instructors (module_id, instructor_id) VALUES
  (1, 3),
  (2, 4);
UPDATE users SET assigned_module_id = 1 WHERE id = 3;
UPDATE users SET assigned_module_id = 2 WHERE id = 4;

-- ─── 5. STUDENTS (25 evening-cohort students) ───────────────────
INSERT INTO students (id, student_id, name, email, cohort_year, program) VALUES
  (1,  'AUCA26-0001', 'Aline Mukamana',         'aline.m@auca.ac.rw',     2026, 'Software Engineering'),
  (2,  'AUCA26-0002', 'Eric Niyonsenga',        'eric.n@auca.ac.rw',      2026, 'Software Engineering'),
  (3,  'AUCA26-0003', 'Liliane Mutesi',         'liliane.m@auca.ac.rw',   2026, 'Software Engineering'),
  (4,  'AUCA26-0004', 'Kevin Bizimana',         'kevin.b@auca.ac.rw',     2026, 'Software Engineering'),
  (5,  'AUCA26-0005', 'Jean Marie Habimana',    'jeanmarie.h@auca.ac.rw', 2026, 'Software Engineering'),
  (6,  'AUCA26-0006', 'Solange Uwase',          'solange.u@auca.ac.rw',   2026, 'Software Engineering'),
  (7,  'AUCA26-0007', 'Patrick Hakizimana',     'patrick.h@auca.ac.rw',   2026, 'Software Engineering'),
  (8,  'AUCA26-0008', 'Diane Murekatete',       'diane.m@auca.ac.rw',     2026, 'Software Engineering'),
  (9,  'AUCA26-0009', 'Olivier Niyonzima',      'olivier.n@auca.ac.rw',   2026, 'Information Systems'),
  (10, 'AUCA26-0010', 'Esperance Nyiraneza',    'esperance.n@auca.ac.rw', 2026, 'Information Systems'),
  (11, 'AUCA26-0011', 'Innocent Tuyishime',     'innocent.t@auca.ac.rw',  2026, 'Information Systems'),
  (12, 'AUCA26-0012', 'Gilbert Munyaneza',      'gilbert.m@auca.ac.rw',   2026, 'Information Systems'),
  (13, 'AUCA26-0013', 'Christine Akimana',      'christine.a@auca.ac.rw', 2026, 'Information Systems'),
  (14, 'AUCA26-0014', 'Pierre Niyibizi',        'pierre.n@auca.ac.rw',    2026, 'Information Systems'),
  (15, 'AUCA26-0015', 'Marie Claire Ingabire',  'marie.i@auca.ac.rw',     2026, 'Accounting'),
  (16, 'AUCA26-0016', 'David Munyaneza',        'david.m@auca.ac.rw',     2026, 'Accounting'),
  (17, 'AUCA26-0017', 'Joyeuse Mukasekuru',     'joyeuse.m@auca.ac.rw',   2026, 'Accounting'),
  (18, 'AUCA26-0018', 'Samuel Bizimungu',       'samuel.b@auca.ac.rw',    2026, 'Accounting'),
  (19, 'AUCA26-0019', 'Esther Uwizeyimana',     'esther.u@auca.ac.rw',    2026, 'Accounting'),
  (20, 'AUCA26-0020', 'Bernard Nshimyumukiza',  'bernard.n@auca.ac.rw',   2026, 'Accounting'),
  (21, 'AUCA26-0021', 'Therese Mukantagara',    'therese.m@auca.ac.rw',   2026, 'Business Administration'),
  (22, 'AUCA26-0022', 'Jean Pierre Hagenimana', 'jeanp.h@auca.ac.rw',     2026, 'Business Administration'),
  (23, 'AUCA26-0023', 'Yvonne Ishimwe',         'yvonne.i@auca.ac.rw',    2026, 'Business Administration'),
  (24, 'AUCA26-0024', 'Fred Iradukunda',        'fred.i@auca.ac.rw',      2026, 'Business Administration'),
  (25, 'AUCA26-0025', 'Annette Tuyisabe',       'annette.t@auca.ac.rw',   2026, 'Business Administration');
SELECT setval('students_id_seq', 25, true);

-- ─── 6. ENROLLMENTS ─────────────────────────────────────────────
-- SE301 (id=1): software-engineering + information-systems majors (1..14)
-- DB202 (id=2): same group (cross-discipline core)
-- AC101 (id=3): accounting + business-administration majors (15..25)
INSERT INTO enrollments (student_id, module_id) SELECT id, 1 FROM students WHERE id BETWEEN 1 AND 14;
INSERT INTO enrollments (student_id, module_id) SELECT id, 2 FROM students WHERE id BETWEEN 1 AND 14;
INSERT INTO enrollments (student_id, module_id) SELECT id, 3 FROM students WHERE id BETWEEN 15 AND 25;

-- ─── 7. ATTENDANCE SESSIONS for SE301 (4 evening sessions) ──────
INSERT INTO attendance_sessions (id, module_id, session_date, start_time, end_time, period, created_by) VALUES
  (1, 1, '2026-04-30', '18:00', '21:00', 'EVENING', 2),
  (2, 1, '2026-05-04', '18:00', '21:00', 'EVENING', 2),
  (3, 1, '2026-05-06', '18:00', '21:00', 'EVENING', 2),
  (4, 1, '2026-05-07', '18:00', '21:00', 'EVENING', 2);
SELECT setval('attendance_sessions_id_seq', 4, true);

-- ─── 8. ATTENDANCE RECORDS ──────────────────────────────────────
-- Realistic mix; chronic absentees Aline (id=1) and Kevin (id=4)
-- accumulate consecutive absences → consecutive_absent_flag=true.
DO $$
DECLARE
  s_id INT;
BEGIN
  -- Session 1 (2026-04-30): 2 absent, 1 late
  FOR s_id IN SELECT id FROM students WHERE id BETWEEN 1 AND 14 LOOP
    IF s_id IN (1, 4) THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (1, s_id, 'ABSENT');
    ELSIF s_id = 7 THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (1, s_id, 'LATE');
    ELSE
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (1, s_id, 'PRESENT');
    END IF;
  END LOOP;

  -- Session 2 (2026-05-04): Aline+Kevin absent for 2nd time → DNS-risk fires
  FOR s_id IN SELECT id FROM students WHERE id BETWEEN 1 AND 14 LOOP
    IF s_id IN (1, 4) THEN
      INSERT INTO attendance_records (session_id, student_id, status, consecutive_absent_flag)
      VALUES (2, s_id, 'ABSENT', true);
    ELSIF s_id = 11 THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (2, s_id, 'EXCUSED');
    ELSIF s_id = 5 THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (2, s_id, 'LATE');
    ELSE
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (2, s_id, 'PRESENT');
    END IF;
  END LOOP;

  -- Session 3 (2026-05-06): Aline returns; Kevin still absent (3rd consecutive)
  FOR s_id IN SELECT id FROM students WHERE id BETWEEN 1 AND 14 LOOP
    IF s_id = 4 THEN
      INSERT INTO attendance_records (session_id, student_id, status, consecutive_absent_flag)
      VALUES (3, s_id, 'ABSENT', true);
    ELSIF s_id IN (8, 13) THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (3, s_id, 'LATE');
    ELSE
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (3, s_id, 'PRESENT');
    END IF;
  END LOOP;

  -- Session 4 (2026-05-07): Kevin still absent (4th); 2 new absences
  FOR s_id IN SELECT id FROM students WHERE id BETWEEN 1 AND 14 LOOP
    IF s_id = 4 THEN
      INSERT INTO attendance_records (session_id, student_id, status, consecutive_absent_flag)
      VALUES (4, s_id, 'ABSENT', true);
    ELSIF s_id IN (9, 12) THEN
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (4, s_id, 'ABSENT');
    ELSE
      INSERT INTO attendance_records (session_id, student_id, status) VALUES (4, s_id, 'PRESENT');
    END IF;
  END LOOP;
END $$;

-- ─── 9. MARK COLUMNS for SE301 ──────────────────────────────────
INSERT INTO mark_columns (id, module_id, name, type, max_score, weight, created_by) VALUES
  (1, 1, 'Quiz 1',  'QUIZ',     10.00, 10.00, 3),
  (2, 1, 'Midterm', 'MIDTERM',  50.00, 40.00, 3),
  (3, 1, 'Final',   'FINAL',   100.00, 50.00, 3);
SELECT setval('mark_columns_id_seq', 3, true);

-- ─── 10. MARK ENTRIES ───────────────────────────────────────────
-- Quiz 1: every enrolled student graded (column complete).
INSERT INTO mark_entries (column_id, student_id, score, entered_by) VALUES
  (1, 1, 7.0, 3), (1, 2, 9.0, 3), (1, 3, 8.5, 3), (1, 4, 5.5, 3), (1, 5, 7.5, 3),
  (1, 6, 9.5, 3), (1, 7, 6.5, 3), (1, 8, 8.0, 3), (1, 9, 7.0, 3), (1, 10, 8.5, 3),
  (1, 11, 9.0, 3), (1, 12, 6.5, 3), (1, 13, 7.5, 3), (1, 14, 8.0, 3);

-- Midterm: only first 8 entered → marks grid shows partial state.
INSERT INTO mark_entries (column_id, student_id, score, entered_by) VALUES
  (2, 1, 32.0, 3), (2, 2, 41.0, 3), (2, 3, 38.5, 3), (2, 4, 22.0, 3), (2, 5, 35.0, 3),
  (2, 6, 44.0, 3), (2, 7, 31.0, 3), (2, 8, 36.5, 3);

-- Final: blank (not yet entered) — illustrates the "ungraded" column state.

-- ─── 11. SEAT ASSIGNMENTS (singleton 7×8 layout) ────────────────
-- 18 of 56 seats occupied (rows 1-2 full + 3A, 3B). Demonstrates
-- the partially-populated chart with available "click to assign" slots.
INSERT INTO seat_assignments (layout_id, student_id, row_number, column_number) VALUES
  (1, 1,  1, 1), (1, 2,  1, 2), (1, 3,  1, 3), (1, 4,  1, 4),
  (1, 5,  1, 5), (1, 6,  1, 6), (1, 7,  1, 7), (1, 8,  1, 8),
  (1, 9,  2, 1), (1, 10, 2, 2), (1, 11, 2, 3), (1, 12, 2, 4),
  (1, 13, 2, 5), (1, 14, 2, 6), (1, 15, 2, 7), (1, 16, 2, 8),
  (1, 17, 3, 1), (1, 18, 3, 2);

-- ─── 12. NOTIFICATIONS to admin (recipient_id=1) ────────────────
INSERT INTO notifications (recipient_id, type, title, message, student_id, module_id) VALUES
  (1, 'CONSECUTIVE_ABSENCE',
      'DNS Risk: Kevin Bizimana',
      'Kevin Bizimana has been absent in 4 consecutive sessions of SE301 — Software Engineering Principles.',
      4, 1),
  (1, 'CONSECUTIVE_ABSENCE',
      'DNS Risk: Aline Mukamana',
      'Aline Mukamana has been absent in 2 consecutive sessions of SE301 — Software Engineering Principles.',
      1, 1),
  (1, 'THRESHOLD_ALERT',
      'Threshold reached: Kevin Bizimana',
      'Kevin Bizimana has crossed the 25% absence threshold for SE301. Consider scheduling a review meeting.',
      4, 1);

-- ─── 13. AUDIT LOG entries ──────────────────────────────────────
INSERT INTO audit_log (user_id, user_email, action, entity_type, entity_id, details, created_at) VALUES
  (1, 'admin@auca.ac.rw', 'CREATE_MODULE',     'MODULE', 1, 'Created SE301 — Software Engineering Principles', NOW() - interval '5 days'),
  (1, 'admin@auca.ac.rw', 'CREATE_MODULE',     'MODULE', 2, 'Created DB202 — Database Systems',                NOW() - interval '5 days'),
  (1, 'admin@auca.ac.rw', 'CREATE_MODULE',     'MODULE', 3, 'Created AC101 — Accounting Principles',           NOW() - interval '5 days'),
  (1, 'admin@auca.ac.rw', 'ASSIGN_INSTRUCTOR', 'MODULE', 1, 'Assigned Jane Instructor to SE301',                NOW() - interval '4 days'),
  (1, 'admin@auca.ac.rw', 'ASSIGN_INSTRUCTOR', 'MODULE', 2, 'Assigned Eric Habimana to DB202',                  NOW() - interval '4 days'),
  (1, 'admin@auca.ac.rw', 'CREATE_USER',       'USER',   4, 'Created instructor account for Eric Habimana',     NOW() - interval '6 days'),
  (1, 'admin@auca.ac.rw', 'CREATE_USER',       'USER',   5, 'Created instructor account for Liliane Uwineza',   NOW() - interval '6 days');

COMMIT;

-- ─── Summary ────────────────────────────────────────────────────
SELECT 'modules'                   AS entity, COUNT(*) AS count FROM modules
UNION ALL SELECT 'students',                   COUNT(*) FROM students
UNION ALL SELECT 'enrollments',                COUNT(*) FROM enrollments
UNION ALL SELECT 'sessions',                   COUNT(*) FROM attendance_sessions
UNION ALL SELECT 'attendance_records',         COUNT(*) FROM attendance_records
UNION ALL SELECT 'consecutive_absent_flagged', COUNT(*) FROM attendance_records WHERE consecutive_absent_flag = true
UNION ALL SELECT 'mark_columns',               COUNT(*) FROM mark_columns
UNION ALL SELECT 'mark_entries',               COUNT(*) FROM mark_entries
UNION ALL SELECT 'seat_assignments',           COUNT(*) FROM seat_assignments
UNION ALL SELECT 'notifications',              COUNT(*) FROM notifications
UNION ALL SELECT 'audit_log',                  COUNT(*) FROM audit_log
UNION ALL SELECT 'instructors',                COUNT(*) FROM users WHERE role = 'INSTRUCTOR'
UNION ALL SELECT 'users (total)',              COUNT(*) FROM users;
