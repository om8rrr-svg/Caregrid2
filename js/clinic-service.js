
// Use global Supabase client initialized in HTML
// The client is available as window.supabase after the CDN loads
import { CloudAssets } from './cloud-config.js';

/**
 * Cloud-based clinic data service
 * Replaces static clinic-data.js with dynamic API calls
 */
class ClinicService {
    constructor() {
        // Wait for config to be available
        this.waitForConfig();
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    waitForConfig() {
        // Use Supabase client exclusively - no more backend API calls
        if (window.supabase) {
            console.log('✅ Supabase client available, using direct database access');
        } else {
            console.warn('⚠️ Supabase client not available, waiting for initialization');
        }
    }

    /**
     * Wait for Supabase to be ready
     * @returns {Promise<void>}
     */
    async waitForSupabase() {
        if (window.supabase) {
            return Promise.resolve();
        }
        
        return new Promise((resolve) => {
            const checkSupabase = () => {
                if (window.supabase) {
                    resolve();
                } else {
                    window.addEventListener('supabaseReady', resolve, { once: true });
                }
            };
            checkSupabase();
        });
    }

    /**
     * Fetch all clinics from Supabase
     * @param {Object} filters - Optional filters for clinics
     * @returns {Promise<Array>} Array of clinic objects
     */
    async getClinics(filters = {}) {
        const cacheKey = 'clinics_' + JSON.stringify(filters);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 Returning cached clinics data');
                return cached.data;
            }
        }

        try {
            console.log('🔍 Fetching clinics from Supabase...');
            
            // Wait for Supabase to be ready
            await this.waitForSupabase();
            
            if (!window.supabase) {
                throw new Error('Supabase client not available');
            }

            const supabaseClient = window.supabase;

            let query = supabaseClient.from('clinics').select('*');
            
            // Apply filters if provided
            if (filters.type) {
                query = query.eq('type', filters.type);
            }
            if (filters.city) {
                query = query.eq('location->>city', filters.city);
            }
            if (filters.verified) {
                query = query.eq('verified', true);
            }
            
            const { data, error } = await query;
            
            if (error) {
                throw new Error(error.message);
            }

            console.log(`✅ Fetched ${data.length} clinics from Supabase`);
            
            // Process image URLs through CloudAssets
            const processedClinics = data.map(clinic => ({
                ...clinic,
                image: (clinic.images && clinic.images[0]) || clinic.image ? CloudAssets.getImageUrl((clinic.images && clinic.images[0]) || clinic.image) : CloudAssets.getDefaultImage('clinic')
            }));
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: processedClinics,
                timestamp: Date.now()
            });
            
            return processedClinics;
        } catch (error) {
            console.error('❌ Error fetching clinics from Supabase:', error);
            console.log('🚫 API unavailable - not showing demo data');
            throw new Error('Clinic data service is currently unavailable. Please try again later.');
        }
    }

    /**
     * Fetch a single clinic by ID
     * @param {number} id - Clinic ID
     * @returns {Promise<Object|null>} Clinic object or null if not found
     */
    async getClinicById(id) {
        const cacheKey = `clinic_${id}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📦 Returning cached clinic data for ID: ${id}`);
                return cached.data;
            }
        }

        try {
            console.log(`🔍 Fetching clinic ${id} from Supabase...`);
            
            // Wait for Supabase to be ready
            await this.waitForSupabase();
            
            if (!window.supabase) {
                throw new Error('Supabase client not available');
            }

            const supabaseClient = window.supabase;
            
            const { data, error } = await supabaseClient
                .from('clinics')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                if (error.code === 'PGRST116') {
                    return null;
                }
                throw new Error(error.message);
            }
            
            const clinic = data;
            
            // Process image URL through CloudAssets
            const processedClinic = {
                ...clinic,
                image: (clinic.images && clinic.images[0]) || clinic.image ? CloudAssets.getImageUrl((clinic.images && clinic.images[0]) || clinic.image) : CloudAssets.getDefaultImage('clinic')
            };
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: processedClinic,
                timestamp: Date.now()
            });
            
            return processedClinic;
        } catch (error) {
            console.error(`❌ Error fetching clinic ${id} from Supabase:`, error);
            return this.getFallbackClinicById(id);
        }
    }

    /**
     * Search clinics by query
     * @param {string} query - Search query
     * @param {Object} filters - Additional filters
     * @returns {Promise<Array>} Array of matching clinics
     */
    async searchClinics(query, filters = {}) {
        try {
            const searchParams = new URLSearchParams({
                q: query,
                ...filters
            });
            
            const response = await fetch(`${this.baseUrl}/clinics/search?${searchParams}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const clinics = await response.json();
            
            // Process image URLs through CloudAssets
            return clinics.map(clinic => ({
                ...clinic,
                image: (clinic.images && clinic.images[0]) || clinic.image ? CloudAssets.getImageUrl((clinic.images && clinic.images[0]) || clinic.image) : CloudAssets.getDefaultImage('clinic')
            }));
        } catch (error) {
            console.error('Error searching clinics:', error);
            return this.searchFallbackData(query);
        }
    }

    /**
     * Get clinics by location
     * @param {string} location - Location name
     * @returns {Promise<Array>} Array of clinics in the location
     */
    async getClinicsByLocation(location) {
        return this.getClinics({ location });
    }

    /**
     * Get clinics by type
     * @param {string} type - Clinic type (e.g., 'Private GP', 'NHS GP')
     * @returns {Promise<Array>} Array of clinics of the specified type
     */
    async getClinicsByType(type) {
        return this.getClinics({ type });
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Fallback data when API is unavailable
     * Returns the full clinic dataset from script.js
     */
    getFallbackData() {
        // Use the full clinicsData array from script.js if available
        if (typeof window !== 'undefined' && window.clinicsData && Array.isArray(window.clinicsData) && window.clinicsData.length > 2) {
            return window.clinicsData;
        }
        
        // If script.js data not available, return minimal fallback
        return [
            {
                id: 1,
                name: "Pall Mall Medical Manchester",
                type: "Private GP",
                location: "Manchester",
                address: "61 King Street, Manchester M2 4PD",
                rating: 4.8,
                reviews: 342,
                image: "https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/pall_mall_medical.jpg",
                premium: true,
                phone: "0161 832 2111",
                website: "https://pallmallmedical.co.uk",
                description: "Private healthcare provider in Manchester's business district.",
                services: ["Private GP Consultations", "Health Screening", "Executive Health", "Travel Medicine"]
            },
            {
                id: 2,
                name: "Didsbury Dental Practice",
                type: "Private Dentist",
                location: "Manchester",
                address: "90 Barlow Moor Rd, Manchester M20 2PN",
                rating: 4.9,
                reviews: 567,
                image: "https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/didsbury_dental_practice.jpg",
                premium: true,
                phone: "0161 455 0005",
                website: "https://didsburydental.co.uk",
                description: "Modern dental clinic in Didsbury providing exceptional dental care.",
                services: ["General Dentistry", "Cosmetic Dentistry", "Invisalign", "Emergency Dental Care"]
            }
        ];
    }

    /**
     * Get fallback clinic by ID
     */
    getFallbackClinicById(id) {
        const fallbackData = this.getFallbackData();
        return fallbackData.find(clinic => clinic.id === parseInt(id)) || null;
    }

    /**
     * Search fallback data
     */
    searchFallbackData(query) {
        const fallbackData = this.getFallbackData();
        const lowerQuery = query.toLowerCase();
        
        return fallbackData.filter(clinic => 
            clinic.name.toLowerCase().includes(lowerQuery) ||
            clinic.type.toLowerCase().includes(lowerQuery) ||
            clinic.location.toLowerCase().includes(lowerQuery) ||
            clinic.description.toLowerCase().includes(lowerQuery)
        );
    }
}

// Create and export singleton instance
const clinicService = new ClinicService();

// Backward compatibility: expose global clinicsData for legacy code
if (typeof window !== 'undefined') {
    // Initialize with empty array, will be populated by first API call
    window.clinicsData = [];
    
    // Wait for Supabase to be ready before loading data
    const loadInitialData = () => {
        clinicService.getClinics().then(clinics => {
            window.clinicsData = clinics;
            // Dispatch event for components waiting for data
            window.dispatchEvent(new CustomEvent('clinicsDataLoaded', { detail: clinics }));
        }).catch(error => {
            console.warn('Failed to load initial clinic data:', error);
            window.clinicsData = clinicService.getFallbackData();
        });
    };
    
    // Check if CloudAssets is already ready
    if (window.supabase) {
        loadInitialData();
    } else {
        console.log('⏳ Waiting for Supabase to be ready...');
        window.addEventListener('supabaseReady', loadInitialData, { once: true });
    }
}

export default clinicService;
export { ClinicService };