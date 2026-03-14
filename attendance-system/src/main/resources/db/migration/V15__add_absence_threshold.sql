-- V15: Per-module configurable absence threshold (default 25%)
-- AbsenceDetectionService fires a THRESHOLD_ALERT notification when a student
-- crosses this boundary for the first time in a given module.

ALTER TABLE modules ADD COLUMN IF NOT EXISTS absence_threshold_percent INTEGER NOT NULL DEFAULT 25;

-- Track whether a threshold alert has already been sent for a student+module
-- to avoid spamming admins on every subsequent absence
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS threshold_alert_sent BOOLEAN NOT NULL DEFAULT FALSE;
