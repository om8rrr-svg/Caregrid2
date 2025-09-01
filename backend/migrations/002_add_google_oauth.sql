-- Add Google OAuth support to users table
-- Migration to add google_id column and make password_hash optional

-- Add google_id column for Google OAuth users
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password_hash optional (for Google OAuth users)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add constraint to ensure either password_hash or google_id is present
ALTER TABLE users ADD CONSTRAINT check_auth_method 
    CHECK (
        (password_hash IS NOT NULL AND google_id IS NULL) OR 
        (password_hash IS NULL AND google_id IS NOT NULL) OR
        (password_hash IS NOT NULL AND google_id IS NOT NULL)
    );

-- Create index for google_id for better performance
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Add comment to document the change
COMMENT ON COLUMN users.google_id IS 'Google OAuth user identifier';
COMMENT ON CONSTRAINT check_auth_method ON users IS 'Ensures user has at least one authentication method (password or Google OAuth)';