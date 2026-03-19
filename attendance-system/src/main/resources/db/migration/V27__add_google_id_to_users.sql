-- Allow users to link their Google account for sign-in
ALTER TABLE users ADD COLUMN google_id VARCHAR(100) UNIQUE;

-- Google-authenticated users have no password; make password nullable
ALTER TABLE users ALTER COLUMN password DROP NOT NULL;
