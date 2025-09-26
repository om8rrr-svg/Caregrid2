-- CareGrid Supabase Database Schema
-- Run this SQL in your Supabase dashboard SQL editor

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'clinic_admin')),
    is_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    reset_token VARCHAR(255),
    reset_token_expires TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- Enable Row Level Security for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Allow service role full access to users" ON users
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow users to read their own profile" ON users
    FOR SELECT USING (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email');

CREATE POLICY "Allow users to update their own profile" ON users
    FOR UPDATE USING (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email');

-- Create clinics table if not exists
CREATE TABLE IF NOT EXISTS clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    location JSONB NOT NULL,
    contact JSONB,
    services TEXT[],
    rating DECIMAL(3,2) DEFAULT 0,
    reviews_count INTEGER DEFAULT 0,
    opening_hours JSONB,
    images TEXT[],
    verified BOOLEAN DEFAULT false,
    description TEXT,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinics_type ON clinics(type);
CREATE INDEX IF NOT EXISTS idx_clinics_location_city ON clinics USING GIN ((location->>'city'));
CREATE INDEX IF NOT EXISTS idx_clinics_services ON clinics USING GIN (services);
CREATE INDEX IF NOT EXISTS idx_clinics_rating ON clinics(rating DESC);
CREATE INDEX IF NOT EXISTS idx_clinics_verified ON clinics(verified) WHERE verified = true;
CREATE INDEX IF NOT EXISTS idx_clinics_created_at ON clinics(created_at DESC);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_clinics_search ON clinics USING GIN (
    to_tsvector('english', name || ' ' || type || ' ' || COALESCE(location->>'city', ''))
);

-- Function for nearby clinics (requires PostGIS extension)
CREATE OR REPLACE FUNCTION get_nearby_clinics(
    lat FLOAT,
    lng FLOAT,
    radius_km FLOAT DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    type VARCHAR,
    location JSONB,
    contact JSONB,
    rating DECIMAL,
    distance_km FLOAT
)
LANGUAGE SQL
AS $$
    SELECT 
        c.id,
        c.name,
        c.type,
        c.location,
        c.contact,
        c.rating,
        CASE 
            WHEN (c.location->'coordinates') IS NOT NULL 
            AND jsonb_array_length(c.location->'coordinates') = 2
            THEN (
                6371 * acos(
                    cos(radians(lat)) * 
                    cos(radians((c.location->'coordinates'->>1)::float)) * 
                    cos(radians((c.location->'coordinates'->>0)::float) - radians(lng)) + 
                    sin(radians(lat)) * 
                    sin(radians((c.location->'coordinates'->>1)::float))
                )
            )
            ELSE 999999 -- Large number for clinics without coordinates
        END AS distance_km
    FROM clinics c
    WHERE c.verified = true
    AND CASE 
        WHEN (c.location->'coordinates') IS NOT NULL 
        AND jsonb_array_length(c.location->'coordinates') = 2
        THEN (
            6371 * acos(
                cos(radians(lat)) * 
                cos(radians((c.location->'coordinates'->>1)::float)) * 
                cos(radians((c.location->'coordinates'->>0)::float) - radians(lng)) + 
                sin(radians(lat)) * 
                sin(radians((c.location->'coordinates'->>1)::float))
            )
        ) <= radius_km
        ELSE false
    END
    ORDER BY distance_km;
$$;

-- Enable Row Level Security (RLS)
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to all clinics" ON clinics
    FOR SELECT USING (true);

-- Create policy for authenticated users to read all clinics
CREATE POLICY "Allow authenticated users to read all clinics" ON clinics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for service role to manage all data
CREATE POLICY "Allow service role full access" ON clinics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference VARCHAR(50) UNIQUE NOT NULL,
    clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    patient_email VARCHAR(255) NOT NULL,
    patient_phone VARCHAR(50) NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    service_type VARCHAR(100) NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed', 'no-show')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for appointments table
CREATE INDEX IF NOT EXISTS idx_appointments_clinic_id ON appointments(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_reference ON appointments(reference);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_email ON appointments(patient_email);
CREATE INDEX IF NOT EXISTS idx_appointments_datetime ON appointments(appointment_date, appointment_time);

-- Enable Row Level Security for appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointments
CREATE POLICY "Allow service role full access to appointments" ON appointments
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow authenticated users to read their own appointments" ON appointments
    FOR SELECT USING (auth.role() = 'authenticated' AND patient_email = auth.jwt() ->> 'email');

-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT 'General Inquiry',
    message TEXT NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    source VARCHAR(50) DEFAULT 'website',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for contact_submissions table
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_source ON contact_submissions(source);

-- Enable Row Level Security for contact_submissions
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for contact_submissions
CREATE POLICY "Allow service role full access to contact_submissions" ON contact_submissions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow authenticated users to read their own submissions" ON contact_submissions
    FOR SELECT USING (auth.role() = 'authenticated' AND email = auth.jwt() ->> 'email');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON clinics TO anon, authenticated;
GRANT ALL ON clinics TO service_role;
GRANT SELECT, INSERT, UPDATE ON users TO anon, authenticated;
GRANT ALL ON users TO service_role;
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT ALL ON appointments TO service_role;
GRANT INSERT ON contact_submissions TO anon, authenticated;
GRANT ALL ON contact_submissions TO service_role;