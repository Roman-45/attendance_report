-- ─────────────────────────────────────────────────────────────────
-- Wipe demo data for the AUCA Attendance & Marks System.
-- Removes business records (modules, students, sessions, marks…)
-- WITHOUT touching:
--   • the schema itself (no DROP TABLE)
--   • the seeded admin / facilitator / instructor users
--   • Flyway's migration history
--
-- Order is FK-safe (children before parents).
-- Re-runnable; no FROZEN state required.
-- ─────────────────────────────────────────────────────────────────

BEGIN;

-- Attendance trail
DELETE FROM attendance_records;
DELETE FROM attendance_sessions;

-- Marks
DELETE FROM mark_entries;
DELETE FROM mark_columns;

-- Classroom (per-module layouts that V30 keyed off modules)
DELETE FROM seat_assignments;
DELETE FROM classroom_layouts;

-- Teams + claims (M6 work)
DELETE FROM claims;
DELETE FROM team_members;
DELETE FROM teams;

-- Notifications (orphan rows reference module/student)
DELETE FROM notifications;

-- Audit log (references modules/students)
DELETE FROM audit_log;

-- Enrollments (link table)
DELETE FROM enrollments;

-- Module ↔ instructor links
DELETE FROM module_instructors;

-- Modules + students
DELETE FROM modules;
DELETE FROM students;

-- Reset auto-incrementing sequences so the next INSERT starts at 1
SELECT setval(pg_get_serial_sequence('modules',              'id'), 1, false);
SELECT setval(pg_get_serial_sequence('students',             'id'), 1, false);
SELECT setval(pg_get_serial_sequence('attendance_sessions',  'id'), 1, false);
SELECT setval(pg_get_serial_sequence('attendance_records',   'id'), 1, false);
SELECT setval(pg_get_serial_sequence('mark_columns',         'id'), 1, false);
SELECT setval(pg_get_serial_sequence('mark_entries',         'id'), 1, false);
SELECT setval(pg_get_serial_sequence('enrollments',          'id'), 1, false);
SELECT setval(pg_get_serial_sequence('classroom_layouts',    'id'), 1, false);
SELECT setval(pg_get_serial_sequence('seat_assignments',     'id'), 1, false);
SELECT setval(pg_get_serial_sequence('notifications',        'id'), 1, false);

COMMIT;

-- ─── Summary check ──────────────────────────────────────────────
SELECT 'modules'              AS entity, COUNT(*) AS count FROM modules
UNION ALL SELECT 'students',             COUNT(*) FROM students
UNION ALL SELECT 'enrollments',          COUNT(*) FROM enrollments
UNION ALL SELECT 'attendance_sessions',  COUNT(*) FROM attendance_sessions
UNION ALL SELECT 'attendance_records',   COUNT(*) FROM attendance_records
UNION ALL SELECT 'mark_columns',         COUNT(*) FROM mark_columns
UNION ALL SELECT 'mark_entries',         COUNT(*) FROM mark_entries
UNION ALL SELECT 'classroom_layouts',    COUNT(*) FROM classroom_layouts
UNION ALL SELECT 'seat_assignments',     COUNT(*) FROM seat_assignments
UNION ALL SELECT 'notifications',        COUNT(*) FROM notifications
UNION ALL SELECT 'users (kept)',         COUNT(*) FROM users;
