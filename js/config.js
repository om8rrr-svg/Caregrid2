// Configuration for CareGrid application
// This file centralizes all configuration settings using environment variables

// Import centralized environment configuration
// Note: In browser environment, we'll use a simplified version
class FrontendConfig {
    constructor() {
        this.loadConfig();
    }

    loadConfig() {
        // Get environment from meta tag or default to production
        const envMeta = document.querySelector('meta[name="environment"]');
        this.environment = envMeta ? envMeta.content : 'production';
        
        // Load configuration based on environment
        if (this.environment === 'development') {
            this.apiBase = 'http://localhost:3000';
            this.publicWebBase = 'http://localhost:8000';
            this.cdnBase = 'http://localhost:8000';
        } else if (this.environment === 'staging') {
            this.apiBase = 'https://api-staging.caregrid.co.uk';
            this.publicWebBase = 'https://staging.caregrid.co.uk';
            this.cdnBase = 'https://staging.caregrid.co.uk';
        } else {
            // Production configuration
            this.apiBase = 'https://www.caregrid.co.uk';
            this.publicWebBase = 'https://caregrid.co.uk';
            this.cdnBase = 'https://caregrid.co.uk';
        }
        
        // Validate no localhost in production
        if (this.environment === 'production' && 
            (this.apiBase.includes('localhost') || this.publicWebBase.includes('localhost'))) {
            throw new Error('Production build contains localhost references. Check environment configuration.');
        }
    }

    getApiBase() {
        return this.apiBase;
    }

    getPublicWebBase() {
        return this.publicWebBase;
    }

    getCdnBase() {
        return this.cdnBase;
    }

    getEnvironment() {
        return this.environment;
    }
}

// Create global configuration instance
const frontendConfig = new FrontendConfig();

// Set global API base for backward compatibility
window.__API_BASE__ = frontendConfig.getApiBase();
window.__CONFIG__ = frontendConfig;

console.log(`Environment: ${frontendConfig.getEnvironment()}`);
console.log(`API Base URL: ${frontendConfig.getApiBase()}`);
console.log(`Public Web Base: ${frontendConfig.getPublicWebBase()}`);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = frontendConfig;
}