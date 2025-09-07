-- CareGrid Supabase Database Schema
-- Run this SQL in your Supabase dashboard SQL editor

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
CREATE POLICY "Allow public read access to verified clinics" ON clinics
    FOR SELECT USING (verified = true);

-- Create policy for authenticated users to read all clinics
CREATE POLICY "Allow authenticated users to read all clinics" ON clinics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for service role to manage all data
CREATE POLICY "Allow service role full access" ON clinics
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON clinics TO anon, authenticated;
GRANT ALL ON clinics TO service_role;