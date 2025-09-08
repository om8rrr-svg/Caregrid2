// Cloud Configuration for CareGrid
// Handles CDN and API base URLs for different environments using centralized config

// Get configuration based on environment
function getCloudConfig() {
    let cdnBaseUrl, apiBaseUrl;
    
    if (typeof window !== 'undefined' && window.__CONFIG__) {
        // Use centralized configuration
        cdnBaseUrl = window.__CONFIG__.getCdnBase();
        apiBaseUrl = window.__CONFIG__.getApiBase();
    } else {
        // Fallback configuration
        const envMeta = typeof document !== 'undefined' ? document.querySelector('meta[name="environment"]') : null;
        const environment = envMeta ? envMeta.content : 'production';
        
        if (environment === 'development') {
            cdnBaseUrl = 'http://localhost:8000';
            apiBaseUrl = 'http://localhost:3000';
        } else if (environment === 'staging') {
            cdnBaseUrl = 'https://staging.caregrid.co.uk';
            apiBaseUrl = 'https://api-staging.caregrid.co.uk';
        } else {
            // Production
            cdnBaseUrl = 'https://caregrid.co.uk';
            apiBaseUrl = 'https://api.caregrid.co.uk';
        }
    }
    
    // Validate no localhost in production
    if (typeof window !== 'undefined') {
        const envMeta = document.querySelector('meta[name="environment"]');
        const environment = envMeta ? envMeta.content : 'production';
        
        if (environment === 'production' && 
            (cdnBaseUrl.includes('localhost') || apiBaseUrl.includes('localhost'))) {
            throw new Error('Production build contains localhost references in cloud config. Check environment configuration.');
        }
    }
    
    return {
        CDN_BASE_URL: cdnBaseUrl,
        API_BASE_URL: apiBaseUrl,
        ASSETS_BASE: cdnBaseUrl + '/assets',
        IMAGES_BASE: cdnBaseUrl + '/images',
        
        // Image optimization settings
        IMAGE_OPTIMIZATION: {
            quality: 85,
            format: 'webp',
            fallback: 'jpg',
            sizes: {
                thumbnail: 150,
                small: 300,
                medium: 600,
                large: 1200
            }
        },
        
        // Asset paths mapping
        ASSETS: {
            // Core branding
            logo: 'logo.svg',
            favicon: 'favicon.ico',
            defaultAvatar: 'default-avatar.svg',
            
            // Clinic placeholder images
            clinicPlaceholders: [
                'clinic1.svg',
                'clinic2.svg',
                'clinic3.svg',
                'clinic4.svg',
                'clinic5.svg',
                'clinic6.svg',
                'clinic7.svg',
                'clinic8.svg',
                'clinic9.svg',
                'clinic10.svg'
            ],
            
            // Real clinic images
            clinicImages: {
                'pall_mall_medical': 'pall_mall_medical.jpg',
                'didsbury_dental': 'didsbury_dental_practice.jpg',
                'city_rehab_liverpool': 'City Rehab Liverpool.avif',
                'pall_mall_liverpool': 'Pall Mall Medical Liverpool.jpg',
                'dental_care_manchester': '207 Dental Care Manchester.jpeg',
                'spire_manchester': 'Spire Manchester Hospital Physiotherapy.jpg',
                'regent_street': 'Regent Street Medical Practice.jpg',
                'droylsden_dental': 'Droylsden Road Dental Practice.webp',
                'dental_team_manchester': 'The Dental Team Manchester.png',
                'regent_medical': 'regent_medical_practice.jpg',
                'sameday_doctor': 'samedaydoctor_manchester.jpg',
                'private_gp_extra': 'private_gp_extra_manchester.jpg'
            }
        }
    };
}

export const CLOUD_CONFIG = getCloudConfig();

// Helper functions for cloud asset URLs
const CloudAssets = {
    /**
     * Get optimized image URL with CDN
     * @param {string} imagePath - Image path or filename
     * @param {string} size - Size variant (thumbnail, small, medium, large)
     * @param {string} format - Image format (webp, jpg, png)
     * @returns {string} Optimized image URL
     */
    getImageUrl(imagePath, size = 'medium', format = 'webp') {
        const baseUrl = CLOUD_CONFIG.CDN_BASE_URL;
        const cleanPath = imagePath.replace(/^images\//, '').replace(/^\//, '');
        
        if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1')) {
            // Use cloud CDN with optimization parameters
            return `${baseUrl}/${cleanPath}?w=${CLOUD_CONFIG.IMAGE_OPTIMIZATION.sizes[size]}&f=${format}&q=${CLOUD_CONFIG.IMAGE_OPTIMIZATION.quality}`;
        } else {
            // Local development - use original images
            return `${baseUrl}/${cleanPath}`;
        }
    },
    
    /**
     * Get logo URL
     * @param {string} size - Size variant
     * @returns {string} Logo URL
     */
    getLogo(size = 'medium') {
        return this.getImageUrl(CLOUD_CONFIG.ASSETS.logo, size, 'svg');
    },
    
    /**
     * Get clinic placeholder image
     * @param {number} index - Placeholder index (1-10)
     * @param {string} size - Size variant
     * @returns {string} Placeholder image URL
     */
    getClinicPlaceholder(index = 1, size = 'medium') {
        const placeholderIndex = Math.max(1, Math.min(10, index)) - 1;
        const placeholder = CLOUD_CONFIG.ASSETS.clinicPlaceholders[placeholderIndex];
        return this.getImageUrl(placeholder, size, 'svg');
    },
    
    /**
     * Get clinic image with fallback
     * @param {string} imagePath - Original image path
     * @param {string} size - Size variant
     * @param {number} fallbackIndex - Fallback placeholder index
     * @returns {string} Clinic image URL
     */
    getClinicImage(imagePath, size = 'medium', fallbackIndex = 1) {
        if (!imagePath) {
            return this.getClinicPlaceholder(fallbackIndex, size);
        }
        return this.getImageUrl(imagePath, size);
    },
    
    /**
     * Get API endpoint URL
     * @param {string} endpoint - API endpoint path
     * @returns {string} Full API URL
     */
    getApiUrl(endpoint) {
        const cleanEndpoint = endpoint.replace(/^\//, '');
        return `${CLOUD_CONFIG.API_BASE_URL}/${cleanEndpoint}`;
    }
};

// Export for use in other modules
export { CloudAssets };

// Also make available globally for non-module scripts
if (typeof window !== 'undefined') {
    window.CLOUD_CONFIG = CLOUD_CONFIG;
    window.CloudAssets = CloudAssets;
}