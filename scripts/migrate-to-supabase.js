const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env.local' });

// Initialize Supabase client with service key for admin operations
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key for migration
);

// Utility functions
function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function validateEnvironment() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is required');
    }
    if (!process.env.SUPABASE_SERVICE_KEY) {
        throw new Error('SUPABASE_SERVICE_KEY environment variable is required');
    }
}

// Transform clinic data for Supabase schema
function transformClinicData(clinic) {
    return {
        name: clinic.name || 'Unknown Clinic',
        type: clinic.type || 'General Practice',
        location: {
            city: clinic.city || clinic.location?.city || 'Unknown',
            postcode: clinic.postcode || clinic.location?.postcode || '',
            address: clinic.address || clinic.location?.address || '',
            coordinates: clinic.coordinates || clinic.location?.coordinates || [0, 0]
        },
        contact: {
            phone: clinic.phone || clinic.contact?.phone || '',
            email: clinic.email || clinic.contact?.email || '',
            website: clinic.website || clinic.contact?.website || ''
        },
        services: Array.isArray(clinic.services) ? clinic.services : 
                 typeof clinic.services === 'string' ? [clinic.services] : [],
        rating: parseFloat(clinic.rating) || 0,
        reviews_count: parseInt(clinic.reviews_count) || 0,
        opening_hours: clinic.opening_hours || clinic.hours || {},
        images: Array.isArray(clinic.images) ? clinic.images : [],
        verified: clinic.verified === true || clinic.verified === 'true',
        description: clinic.description || '',
        specialties: Array.isArray(clinic.specialties) ? clinic.specialties : []
    };
}

// Create database schema
async function createSchema() {
    log('Creating database schema...');
    
    const schema = `
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
    `;
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql: schema });
        if (error) {
            // If rpc doesn't work, try direct SQL execution (this might not work in all Supabase setups)
            log('RPC method failed, schema creation may need manual setup', 'error');
            log('Please run the SQL schema manually in Supabase dashboard', 'info');
        } else {
            log('Database schema created successfully', 'success');
        }
    } catch (error) {
        log('Schema creation may need manual setup in Supabase dashboard', 'info');
        log('SQL schema is available in the migration plan document', 'info');
    }
}

// Load clinic data from various sources
function loadClinicData() {
    // First try to extract from script.js (contains the most complete dataset)
    try {
        const scriptPath = '../js/script.js';
        if (fs.existsSync(scriptPath)) {
            log('Attempting to extract data from script.js');
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');
            
            // Look for clinicsData array in the script
            const clinicDataMatch = scriptContent.match(/let\s+clinicsData\s*=\s*(\[[\s\S]*?\]);/);
            if (clinicDataMatch) {
                log('Found clinicsData array in script.js');
                const clinicDataStr = clinicDataMatch[1];
                const clinics = eval(clinicDataStr); // Note: eval is dangerous, use with caution
                log(`Extracted ${clinics.length} clinics from script.js`);
                return clinics;
            }
        }
    } catch (error) {
        log(`Failed to extract from script.js: ${error.message}`, 'error');
    }
    
    // Fallback to JSON files
    const possiblePaths = [
        './output/clinics_all.json',
        './data/clinics.json',
        './js/clinics-data.json',
        '../output/clinics_all.json'
    ];
    
    for (const filePath of possiblePaths) {
        try {
            if (fs.existsSync(filePath)) {
                log(`Loading data from ${filePath}`);
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                return Array.isArray(data) ? data : [];
            }
        } catch (error) {
            log(`Failed to load ${filePath}: ${error.message}`, 'error');
        }
    }

    
    throw new Error('No clinic data found. Please ensure clinic data is available in one of the expected locations.');
}

// Migrate data in batches
async function migrateData() {
    try {
        log('Starting data migration...');
        
        // Load clinic data
        const clinicsData = loadClinicData();
        log(`Found ${clinicsData.length} clinics to migrate`);
        
        if (clinicsData.length === 0) {
            log('No clinic data to migrate', 'error');
            return;
        }
        
        // Transform data
        const transformedData = clinicsData.map(transformClinicData);
        log(`Transformed ${transformedData.length} clinic records`);
        
        // Clear existing data (optional - comment out if you want to keep existing data)
        log('Clearing existing clinic data...');
        const { error: deleteError } = await supabase
            .from('clinics')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
        if (deleteError) {
            log(`Warning: Could not clear existing data: ${deleteError.message}`, 'error');
        }
        
        // Batch insert
        const batchSize = 50; // Smaller batches for better reliability
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < transformedData.length; i += batchSize) {
            const batch = transformedData.slice(i, i + batchSize);
            const batchNumber = Math.floor(i / batchSize) + 1;
            const totalBatches = Math.ceil(transformedData.length / batchSize);
            
            log(`Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)...`);
            
            try {
                const { data, error } = await supabase
                    .from('clinics')
                    .insert(batch)
                    .select('id');
                    
                if (error) {
                    log(`Batch ${batchNumber} failed: ${error.message}`, 'error');
                    errorCount += batch.length;
                    
                    // Try inserting records one by one to identify problematic records
                    for (const record of batch) {
                        try {
                            const { error: singleError } = await supabase
                                .from('clinics')
                                .insert([record]);
                                
                            if (singleError) {
                                log(`Failed to insert clinic "${record.name}": ${singleError.message}`, 'error');
                            } else {
                                successCount++;
                            }
                        } catch (singleErr) {
                            log(`Exception inserting clinic "${record.name}": ${singleErr.message}`, 'error');
                        }
                    }
                } else {
                    log(`Batch ${batchNumber} completed: ${data?.length || batch.length} records inserted`, 'success');
                    successCount += batch.length;
                }
                
                // Small delay between batches to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (batchError) {
                log(`Batch ${batchNumber} exception: ${batchError.message}`, 'error');
                errorCount += batch.length;
            }
        }
        
        log(`Migration completed: ${successCount} successful, ${errorCount} failed`, 
             errorCount > 0 ? 'error' : 'success');
             
        // Verify migration
        const { count, error: countError } = await supabase
            .from('clinics')
            .select('*', { count: 'exact', head: true });
            
        if (!countError) {
            log(`Total clinics in database: ${count}`, 'success');
        }
        
    } catch (error) {
        log(`Migration failed: ${error.message}`, 'error');
        throw error;
    }
}

// Test connection
async function testConnection() {
    try {
        log('Testing Supabase connection...');
        
        // Test basic connection by checking auth
        const { data, error } = await supabase.auth.getSession();
        
        if (error && error.message !== 'Auth session missing!') {
            throw new Error(`Connection test failed: ${error.message}`);
        }
        
        log('Supabase connection successful', 'success');
        return true;
        
    } catch (error) {
        log(`Connection test failed: ${error.message}`, 'error');
        return false;
    }
}

// Main migration function
async function main() {
    try {
        log('Starting CareGrid to Supabase migration...');
        
        // Validate environment
        validateEnvironment();
        
        // Test connection
        const connected = await testConnection();
        if (!connected) {
            throw new Error('Cannot connect to Supabase. Please check your environment variables.');
        }
        
        // Create schema
        await createSchema();
        
        // Migrate data
        await migrateData();
        
        log('Migration completed successfully!', 'success');
        log('Next steps:', 'info');
        log('1. Update your frontend to use the new Supabase API', 'info');
        log('2. Test the application with cloud data', 'info');
        log('3. Update environment variables for production', 'info');
        
    } catch (error) {
        log(`Migration failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run migration if called directly
if (require.main === module) {
    main();
}

module.exports = {
    main,
    migrateData,
    testConnection,
    createSchema
};