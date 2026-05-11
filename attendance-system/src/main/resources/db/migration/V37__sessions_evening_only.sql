-- All AUCA evening classes run from 18:00 to 21:00.
-- Replace the MORNING/AFTERNOON CHECK with EVENING-only.

ALTER TABLE attendance_sessions
    DROP CONSTRAINT IF EXISTS attendance_sessions_period_check;

ALTER TABLE attendance_sessions
    ADD CONSTRAINT attendance_sessions_period_check
        CHECK (period IS NULL OR period = 'EVENING');

-- Default times for new rows that don't supply them explicitly
ALTER TABLE attendance_sessions
    ALTER COLUMN start_time SET DEFAULT '18:00';
ALTER TABLE attendance_sessions
    ALTER COLUMN end_time   SET DEFAULT '21:00';
