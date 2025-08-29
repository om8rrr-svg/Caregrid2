// Test Configuration for CareGrid - Environment-aware API endpoints
// This ensures test files work in both development and production environments

(function() {
    'use strict';
    
    // Define the test configuration
    window.TestConfig = {
        // Get API base URL with proper fallback chain
        getApiBase: function() {
            // Priority order:
            // 1. Window override (set by environment-specific configs)
            // 2. Environment variables (for build-time configuration)  
            // 3. Production default
            return window.__API_BASE__ ||
                   (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_BASE || process.env?.API_BASE)) ||
                   'https://caregrid-backend.onrender.com';
        },
        
        // Build complete URL for API endpoints
        buildApiUrl: function(endpoint) {
            const baseUrl = this.getApiBase();
            const cleanEndpoint = endpoint.replace(/^\//, ''); // Remove leading slash
            const apiBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
            
            // Add /api prefix if not present and not a root endpoint (like /health)
            if (!cleanEndpoint.startsWith('api/') && !cleanEndpoint.startsWith('health')) {
                return apiBase + 'api/' + cleanEndpoint;
            }
            
            return apiBase + cleanEndpoint;
        },
        
        // Build complete URL for health check
        buildHealthUrl: function() {
            const baseUrl = this.getApiBase();
            return baseUrl.endsWith('/') ? baseUrl + 'health' : baseUrl + '/health';
        },
        
        // Utility to log current configuration for debugging
        logConfig: function() {
            console.log('Test Configuration:', {
                apiBase: this.getApiBase(),
                healthUrl: this.buildHealthUrl(),
                sampleApiUrl: this.buildApiUrl('clinics'),
                environment: this.getEnvironment()
            });
        },
        
        // Detect current environment
        getEnvironment: function() {
            const apiBase = this.getApiBase();
            if (apiBase.includes('localhost') || apiBase.includes('127.0.0.1')) {
                return 'development';
            } else if (apiBase.includes('render.com')) {
                return 'production';
            } else if (apiBase.includes('vercel.app')) {
                return 'production';
            } else {
                return 'unknown';
            }
        },
        
        // Check if running in development mode
        isDevelopment: function() {
            return this.getEnvironment() === 'development';
        },
        
        // For development, set localhost override
        setDevelopmentMode: function(port = 3000) {
            if (typeof window !== 'undefined') {
                window.__API_BASE__ = `http://localhost:${port}`;
                console.log(`Test config set to development mode: ${window.__API_BASE__}`);
            }
        }
    };
    
    // Auto-detect if we should use development mode based on current page URL
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1') &&
        !window.__API_BASE__) {
        
        // Only auto-set localhost if no explicit API base is configured
        // This allows tests to work locally by default but respects explicit configuration
        window.TestConfig.setDevelopmentMode(3000);
    }
    
    // Log configuration on load for debugging
    if (typeof window !== 'undefined' && window.location && window.location.search && window.location.search.includes('debug')) {
        window.TestConfig.logConfig();
    }
    
})();