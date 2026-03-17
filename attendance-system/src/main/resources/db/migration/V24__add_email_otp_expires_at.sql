-- Add expiry column for email verification OTP (6-digit code)
-- verification_token column (already added in V23) now stores the 6-digit OTP string
ALTER TABLE users
    ADD COLUMN email_otp_expires_at TIMESTAMP;
