const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);

// Helper function to convert Supabase results to PostgreSQL-like format
function formatSupabaseResult(data, error) {
    if (error) {
        throw new Error(error.message);
    }
    return {
        rows: data || [],
        rowCount: data ? data.length : 0
    };
}

// Query wrapper to mimic PostgreSQL client interface
const query = async (text, params = []) => {
    try {
        // Simple SELECT COUNT(*) query
        if (text.includes('SELECT COUNT(*)') && text.includes('FROM clinics')) {
            const { data, error, count } = await supabase
                .from('clinics')
                .select('*', { count: 'exact', head: true });
            
            if (error) throw error;
            return { rows: [{ count: count }], rowCount: 1 };
        }
        
        // Main clinics query
        if (text.includes('SELECT') && text.includes('FROM clinics c')) {
            let query = supabase.from('clinics').select('*');
            
            // Skip is_active filter since it doesn't exist in Supabase table
            // The Supabase table contains all active clinics by default
            
            // Add limit if specified in params or query
            const limitMatch = text.match(/LIMIT (\d+)/);
            if (limitMatch) {
                query = query.limit(parseInt(limitMatch[1]));
            }
            
            // Add offset if specified
            const offsetMatch = text.match(/OFFSET (\d+)/);
            if (offsetMatch) {
                query = query.range(parseInt(offsetMatch[1]), parseInt(offsetMatch[1]) + (limitMatch ? parseInt(limitMatch[1]) : 1000) - 1);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Transform Supabase data to match expected PostgreSQL format
            const transformedData = data ? data.map(clinic => ({
                id: clinic.id,
                name: clinic.name,
                type: clinic.type,
                description: clinic.description,
                address: clinic.location?.address || clinic.address,
                city: clinic.location?.city || clinic.city,
                postcode: clinic.location?.postcode || clinic.postcode,
                phone: clinic.contact?.phone || clinic.phone,
                email: clinic.contact?.email || clinic.email,
                website: clinic.contact?.website || clinic.website,
                rating: clinic.rating,
                review_count: clinic.reviews_count || clinic.review_count,
                is_premium: clinic.is_premium,
                logo_url: clinic.logo_url,
                created_at: clinic.created_at,
                updated_at: clinic.updated_at,
                frontend_id: clinic.frontend_id
            })) : [];
            
            return { rows: transformedData, rowCount: transformedData.length };
        }
        
        // Fallback for other queries - you may need to implement more specific handlers
        console.warn('Unhandled query:', text);
        return { rows: [], rowCount: 0 };
        
    } catch (error) {
        console.error('Supabase query error:', error);
        throw error;
    }
};

// Function to create/get Supabase client
const createSupabaseClient = () => {
    return supabase;
};

// Alias for the query function
const querySupabase = query;

module.exports = {
    supabase,
    query,
    querySupabase,
    createSupabaseClient,
    formatSupabaseResult
};