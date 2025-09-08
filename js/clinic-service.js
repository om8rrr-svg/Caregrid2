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
        // Check if config is already loaded
        if (window.__API_BASE__) {
            this.baseUrl = window.__API_BASE__ + '/api';
            console.log('✅ Config loaded, API base:', this.baseUrl);
        } else {
            // Always use production backend URL
    this.baseUrl = 'https://caregrid-backend-latest.onrender.com/api';
            console.log('⚠️ Config not loaded, using fallback:', this.baseUrl);
        }
    }

    /**
     * Fetch all clinics from the API
     * @param {Object} filters - Optional filters for clinics
     * @returns {Promise<Array>} Array of clinic objects
     */
    async getClinics(filters = {}) {
        const cacheKey = 'clinics_' + JSON.stringify(filters);
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const queryParams = new URLSearchParams(filters);
            const url = `${this.baseUrl}/clinics?${queryParams}`;
            console.log('🔍 Fetching clinics from:', url);
            console.log('📡 API Base URL:', window.__API_BASE__);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const clinics = await response.json();
            
            // Process image URLs through CloudAssets
            const processedClinics = clinics.map(clinic => ({
                ...clinic,
                image: clinic.image ? CloudAssets.getImageUrl(clinic.image) : CloudAssets.getDefaultImage('clinic')
            }));
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: processedClinics,
                timestamp: Date.now()
            });
            
            return processedClinics;
        } catch (error) {
            console.error('Error fetching clinics:', error);
            return this.getFallbackData();
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
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/clinics/${id}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const clinic = await response.json();
            
            // Process image URL through CloudAssets
            const processedClinic = {
                ...clinic,
                image: clinic.image ? CloudAssets.getImageUrl(clinic.image) : CloudAssets.getDefaultImage('clinic')
            };
            
            // Cache the result
            this.cache.set(cacheKey, {
                data: processedClinic,
                timestamp: Date.now()
            });
            
            return processedClinic;
        } catch (error) {
            console.error(`Error fetching clinic ${id}:`, error);
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
                image: clinic.image ? CloudAssets.getImageUrl(clinic.image) : CloudAssets.getDefaultImage('clinic')
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
                image: CloudAssets.getImageUrl("pall_mall_medical.jpg"),
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
                image: CloudAssets.getImageUrl("didsbury_dental_practice.jpg"),
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
    
    // Load initial data
    clinicService.getClinics().then(clinics => {
        window.clinicsData = clinics;
        // Dispatch event for components waiting for data
        window.dispatchEvent(new CustomEvent('clinicsDataLoaded', { detail: clinics }));
    }).catch(error => {
        console.warn('Failed to load initial clinic data:', error);
        window.clinicsData = clinicService.getFallbackData();
    });
}

export default clinicService;
export { ClinicService };