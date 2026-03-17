-- Existing admin-created users are already verified (DEFAULT TRUE)
-- New self-registered users will be created with email_verified = FALSE via Java code
ALTER TABLE users
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN verification_token VARCHAR(255);
