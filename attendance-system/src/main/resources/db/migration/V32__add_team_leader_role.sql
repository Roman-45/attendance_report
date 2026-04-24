-- Allow TEAM_LEADER in users.role column (the column is VARCHAR(20), already big enough)
ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(20);

-- Add invitation_token column to users for email invitation flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_token VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by BIGINT REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP;
