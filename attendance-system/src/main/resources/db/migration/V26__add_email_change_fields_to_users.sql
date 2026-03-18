ALTER TABLE users
  ADD COLUMN pending_email VARCHAR(150),
  ADD COLUMN email_change_otp VARCHAR(6),
  ADD COLUMN email_change_otp_expires_at TIMESTAMP;
