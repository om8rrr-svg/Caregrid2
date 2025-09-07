import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    },
    realtime: {
        params: {
            eventsPerSecond: 10
        }
    }
});

// Database service with caching and optimization
export class ClinicsService {
    static cache = new Map();
    static cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    static clearCache() {
        this.cache.clear();
    }
    
    static getCacheKey(filters, page = 1, limit = 20) {
        return JSON.stringify({ filters, page, limit });
    }
    
    static async searchClinics(filters = {}, page = 1, limit = 20) {
        const cacheKey = this.getCacheKey(filters, page, limit);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const offset = (page - 1) * limit;
            
            let query = supabase
                .from('clinics')
                .select('*', { count: 'exact' })
                .eq('verified', true)
                .range(offset, offset + limit - 1)
                .order('rating', { ascending: false });
                
            // Apply filters
            if (filters.city && filters.city !== 'all') {
                query = query.ilike('location->>city', `%${filters.city}%`);
            }
            
            if (filters.type && filters.type !== 'all') {
                query = query.eq('type', filters.type);
            }
            
            if (filters.services && filters.services.length > 0) {
                query = query.overlaps('services', filters.services);
            }
            
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,type.ilike.%${filters.search}%`);
            }
            
            if (filters.minRating) {
                query = query.gte('rating', filters.minRating);
            }
            
            const { data, error, count } = await query;
            
            if (error) throw error;
            
            const result = {
                clinics: data || [],
                total: count || 0,
                page,
                limit,
                totalPages: Math.ceil((count || 0) / limit),
                hasMore: offset + limit < (count || 0)
            };
            
            // Cache results
            this.cache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
            
            return result;
            
        } catch (error) {
            console.error('Search clinics failed:', error);
            throw new Error(`Failed to search clinics: ${error.message}`);
        }
    }
    
    static async getClinicById(id) {
        const cacheKey = `clinic-${id}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('id', id)
                .single();
                
            if (error) throw error;
            
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error('Get clinic by ID failed:', error);
            throw new Error(`Failed to get clinic: ${error.message}`);
        }
    }
    
    static async getClinicTypes() {
        const cacheKey = 'clinic-types';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('type')
                .eq('verified', true);
                
            if (error) throw error;
            
            const types = [...new Set(data.map(item => item.type))]
                .filter(Boolean)
                .sort();
            
            this.cache.set(cacheKey, {
                data: types,
                timestamp: Date.now()
            });
            
            return types;
            
        } catch (error) {
            console.error('Get clinic types failed:', error);
            return [];
        }
    }
    
    static async getCities() {
        const cacheKey = 'cities';
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('location')
                .eq('verified', true);
                
            if (error) throw error;
            
            const cities = [...new Set(data.map(item => item.location?.city))]
                .filter(Boolean)
                .sort();
                
            this.cache.set(cacheKey, {
                data: cities,
                timestamp: Date.now()
            });
            
            return cities;
            
        } catch (error) {
            console.error('Get cities failed:', error);
            return [];
        }
    }
    
    static async getNearbyClinicss(lat, lng, radius = 10) {
        try {
            const { data, error } = await supabase
                .rpc('get_nearby_clinics', {
                    lat: parseFloat(lat),
                    lng: parseFloat(lng),
                    radius_km: parseFloat(radius)
                });
                
            if (error) throw error;
            return data || [];
            
        } catch (error) {
            console.error('Get nearby clinics failed:', error);
            // Fallback to basic search if geospatial function not available
            return this.searchClinics({}, 1, 50);
        }
    }
    
    // Real-time subscriptions
    static subscribeToClinicUpdates(callback) {
        return supabase
            .channel('clinic-updates')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'clinics'
            }, (payload) => {
                // Clear cache when data changes
                this.clearCache();
                callback(payload);
            })
            .subscribe();
    }
    
    // Health check
    static async healthCheck() {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('count')
                .limit(1);
                
            return !error;
        } catch (error) {
            console.error('Supabase health check failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const clinicsService = ClinicsService;