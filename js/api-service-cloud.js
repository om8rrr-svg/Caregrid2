import { supabase, clinicsService } from '../config/supabase.js';

/**
 * Cloud-optimized API service for CareGrid
 * Replaces local API calls with Supabase cloud database
 */
class CloudAPIService {
    constructor() {
        this.cache = new Map();
        this.requestQueue = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.isOnline = navigator.onLine;
        
        // Monitor online status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.processOfflineQueue();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
    }
    
    /**
     * Search clinics with advanced filtering and pagination
     */
    async searchClinics(filters = {}, page = 1, limit = 20) {
        try {
            // Use the optimized service from supabase config
            return await clinicsService.searchClinics(filters, page, limit);
        } catch (error) {
            console.error('Cloud search failed:', error);
            
            // Fallback to cached data if available
            const fallbackData = this.getFallbackData('search', filters);
            if (fallbackData) {
                return fallbackData;
            }
            
            throw new Error(`Search failed: ${error.message}`);
        }
    }
    
    /**
     * Get clinic by ID with caching
     */
    async getClinicById(id) {
        try {
            return await clinicsService.getClinicById(id);
        } catch (error) {
            console.error('Get clinic failed:', error);
            
            const fallbackData = this.getFallbackData('clinic', id);
            if (fallbackData) {
                return fallbackData;
            }
            
            throw new Error(`Failed to get clinic: ${error.message}`);
        }
    }
    
    /**
     * Get all clinic types with caching
     */
    async getClinicTypes() {
        try {
            return await clinicsService.getClinicTypes();
        } catch (error) {
            console.error('Get clinic types failed:', error);
            
            // Return default types as fallback
            return [
                'General Practice',
                'Dental',
                'Pharmacy',
                'Optometry',
                'Physiotherapy',
                'Mental Health',
                'Specialist'
            ];
        }
    }
    
    /**
     * Get all cities with caching
     */
    async getCities() {
        try {
            return await clinicsService.getCities();
        } catch (error) {
            console.error('Get cities failed:', error);
            return []; // Return empty array as fallback
        }
    }
    
    /**
     * Get nearby clinics using geolocation
     */
    async getNearbyClinicss(lat, lng, radius = 10) {
        try {
            return await clinicsService.getNearbyClinicss(lat, lng, radius);
        } catch (error) {
            console.error('Get nearby clinics failed:', error);
            
            // Fallback to regular search
            return await this.searchClinics({}, 1, 50);
        }
    }
    
    /**
     * Get user's current location
     */
    async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }
    
    /**
     * Health check for cloud services
     */
    async healthCheck() {
        try {
            const isHealthy = await clinicsService.healthCheck();
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: isHealthy,
                    api: true,
                    cache: this.cache.size > 0
                }
            };
        } catch (error) {
            return {
                status: 'error',
                timestamp: new Date().toISOString(),
                error: error.message,
                services: {
                    database: false,
                    api: false,
                    cache: this.cache.size > 0
                }
            };
        }
    }
    
    /**
     * Subscribe to real-time updates
     */
    subscribeToUpdates(callback) {
        return clinicsService.subscribeToClinicUpdates((payload) => {
            // Clear relevant cache entries
            this.clearRelatedCache(payload);
            
            // Notify callback
            if (typeof callback === 'function') {
                callback(payload);
            }
        });
    }
    
    /**
     * Advanced search with multiple criteria
     */
    async advancedSearch(criteria) {
        const {
            query = '',
            type = 'all',
            city = 'all',
            services = [],
            minRating = 0,
            maxDistance = null,
            userLocation = null,
            sortBy = 'rating',
            sortOrder = 'desc',
            page = 1,
            limit = 20
        } = criteria;
        
        try {
            let filters = {
                search: query,
                type: type !== 'all' ? type : undefined,
                city: city !== 'all' ? city : undefined,
                services: services.length > 0 ? services : undefined,
                minRating: minRating > 0 ? minRating : undefined
            };
            
            // Remove undefined values
            filters = Object.fromEntries(
                Object.entries(filters).filter(([_, value]) => value !== undefined)
            );
            
            let results;
            
            // Use geolocation search if location and distance specified
            if (userLocation && maxDistance) {
                results = await this.getNearbyClinicss(
                    userLocation.lat,
                    userLocation.lng,
                    maxDistance
                );
                
                // Apply additional filters to geolocation results
                if (Object.keys(filters).length > 0) {
                    results = this.filterResults(results, filters);
                }
            } else {
                results = await this.searchClinics(filters, page, limit);
            }
            
            // Apply sorting if different from default
            if (sortBy !== 'rating' || sortOrder !== 'desc') {
                results.clinics = this.sortResults(results.clinics, sortBy, sortOrder);
            }
            
            return results;
            
        } catch (error) {
            console.error('Advanced search failed:', error);
            throw error;
        }
    }
    
    /**
     * Get popular clinics (high rating, many reviews)
     */
    async getPopularClinics(limit = 10) {
        try {
            return await this.searchClinics(
                { minRating: 4.0 },
                1,
                limit
            );
        } catch (error) {
            console.error('Get popular clinics failed:', error);
            return { clinics: [], total: 0 };
        }
    }
    
    /**
     * Get recently added clinics
     */
    async getRecentClinics(limit = 10) {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('*')
                .eq('verified', true)
                .order('created_at', { ascending: false })
                .limit(limit);
                
            if (error) throw error;
            
            return {
                clinics: data || [],
                total: data?.length || 0
            };
        } catch (error) {
            console.error('Get recent clinics failed:', error);
            return { clinics: [], total: 0 };
        }
    }
    
    /**
     * Get clinic statistics
     */
    async getStatistics() {
        try {
            const { data, error } = await supabase
                .from('clinics')
                .select('type, location, rating, verified')
                .eq('verified', true);
                
            if (error) throw error;
            
            const stats = {
                total: data.length,
                byType: {},
                byCity: {},
                averageRating: 0,
                verified: data.filter(c => c.verified).length
            };
            
            // Calculate statistics
            let totalRating = 0;
            let ratedClinics = 0;
            
            data.forEach(clinic => {
                // Count by type
                stats.byType[clinic.type] = (stats.byType[clinic.type] || 0) + 1;
                
                // Count by city
                const city = clinic.location?.city || 'Unknown';
                stats.byCity[city] = (stats.byCity[city] || 0) + 1;
                
                // Calculate average rating
                if (clinic.rating > 0) {
                    totalRating += clinic.rating;
                    ratedClinics++;
                }
            });
            
            stats.averageRating = ratedClinics > 0 ? 
                Math.round((totalRating / ratedClinics) * 100) / 100 : 0;
            
            return stats;
            
        } catch (error) {
            console.error('Get statistics failed:', error);
            return {
                total: 0,
                byType: {},
                byCity: {},
                averageRating: 0,
                verified: 0
            };
        }
    }
    
    // Helper methods
    
    getFallbackData(type, key) {
        const fallbackKey = `fallback_${type}_${JSON.stringify(key)}`;
        const cached = this.cache.get(fallbackKey);
        
        if (cached && Date.now() - cached.timestamp < 3600000) { // 1 hour
            return cached.data;
        }
        
        return null;
    }
    
    clearRelatedCache(payload) {
        // Clear cache entries related to the updated data
        const keysToDelete = [];
        
        for (const [key] of this.cache) {
            if (key.includes('clinic') || key.includes('search')) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.cache.delete(key));
    }
    
    filterResults(results, filters) {
        return results.filter(clinic => {
            if (filters.search) {
                const searchLower = filters.search.toLowerCase();
                const matchesSearch = 
                    clinic.name.toLowerCase().includes(searchLower) ||
                    clinic.type.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }
            
            if (filters.type && clinic.type !== filters.type) {
                return false;
            }
            
            if (filters.city && clinic.location?.city !== filters.city) {
                return false;
            }
            
            if (filters.minRating && clinic.rating < filters.minRating) {
                return false;
            }
            
            if (filters.services && filters.services.length > 0) {
                const hasService = filters.services.some(service => 
                    clinic.services?.includes(service)
                );
                if (!hasService) return false;
            }
            
            return true;
        });
    }
    
    sortResults(results, sortBy, sortOrder) {
        return results.sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Handle nested properties
            if (sortBy.includes('.')) {
                const keys = sortBy.split('.');
                aValue = keys.reduce((obj, key) => obj?.[key], a);
                bValue = keys.reduce((obj, key) => obj?.[key], b);
            }
            
            // Handle different data types
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }
    
    async processOfflineQueue() {
        // Process any queued requests when coming back online
        if (this.requestQueue.size > 0) {
            console.log('Processing offline queue...');
            // Implementation for offline queue processing
        }
    }
    
    /**
     * Clear all caches
     */
    clearCache() {
        this.cache.clear();
        clinicsService.clearCache();
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            memoryUsage: JSON.stringify(Array.from(this.cache.values())).length
        };
    }
}

// Export singleton instance
export const cloudAPI = new CloudAPIService();

// Export class for testing
export { CloudAPIService };

// Backward compatibility - replace global API object
if (typeof window !== 'undefined') {
    window.cloudAPI = cloudAPI;
    
    // Migration helper - gradually replace old API calls
    window.legacyAPI = {
        searchClinics: (...args) => {
            console.warn('Using legacy API - please migrate to cloudAPI');
            return cloudAPI.searchClinics(...args);
        },
        getClinicById: (...args) => {
            console.warn('Using legacy API - please migrate to cloudAPI');
            return cloudAPI.getClinicById(...args);
        }
    };
}