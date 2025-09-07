-- Add missing columns to clinics table
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS frontend_id VARCHAR(50);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS postcode VARCHAR(20);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE clinics ADD COLUMN IF NOT EXISTS address VARCHAR(500);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_clinics_city ON clinics(city);
CREATE INDEX IF NOT EXISTS idx_clinics_postcode ON clinics(postcode);
CREATE INDEX IF NOT EXISTS idx_clinics_is_premium ON clinics(is_premium);
CREATE INDEX IF NOT EXISTS idx_clinics_location ON clinics(latitude, longitude);