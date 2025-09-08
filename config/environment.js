/**
 * Centralized Environment Configuration
 * Loads environment variables and validates required configurations
 * Throws errors for missing critical environment variables
 */

class EnvironmentConfig {
    constructor() {
        this.loadEnvironment();
        this.validateRequiredConfig();
    }

    loadEnvironment() {
        // Determine environment from NODE_ENV or default to development
        this.nodeEnv = process.env.NODE_ENV || 'development';
        
        // API Configuration
        this.apiBase = process.env.API_BASE;
        this.publicWebBase = process.env.PUBLIC_WEB_BASE;
        this.n8nBase = process.env.N8N_BASE;
        
        // Frontend URLs
        this.frontendUrl = process.env.FRONTEND_URL;
        this.nextPublicApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        
        // CDN Configuration
        this.cdnBaseUrl = process.env.CDN_BASE_URL;
        
        // Vapi Configuration
        this.vapiPublicKey = process.env.REACT_APP_VAPI_PUBLIC_KEY;
        this.vapiPrivateKey = process.env.REACT_APP_VAPI_PRIVATE_KEY;
        this.vapiAssistantId = process.env.REACT_APP_VAPI_ASSISTANT_ID;
        this.vapiApiKey = process.env.REACT_APP_VAPI_API_KEY;
        this.vapiBaseUrl = process.env.REACT_APP_VAPI_BASE_URL || 'https://api.vapi.ai';
        
        // Webhook URLs
        this.vapiToolsWebhook = process.env.VAPI_TOOLS_WEBHOOK;
        this.vapiEventsWebhook = process.env.VAPI_EVENTS_WEBHOOK;
        
        // CORS Configuration
        this.corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [];
        
        // Security
        this.trustProxy = process.env.TRUST_PROXY === 'true';
    }

    validateRequiredConfig() {
        const requiredConfigs = {
            'API_BASE': this.apiBase,
            'PUBLIC_WEB_BASE': this.publicWebBase,
            'FRONTEND_URL': this.frontendUrl
        };

        // Only validate production-specific configs in production
        if (this.nodeEnv === 'production') {
            requiredConfigs['N8N_BASE'] = this.n8nBase;
            requiredConfigs['CDN_BASE_URL'] = this.cdnBaseUrl;
            requiredConfigs['VAPI_TOOLS_WEBHOOK'] = this.vapiToolsWebhook;
            requiredConfigs['VAPI_EVENTS_WEBHOOK'] = this.vapiEventsWebhook;
        }

        const missingConfigs = [];
        for (const [key, value] of Object.entries(requiredConfigs)) {
            if (!value) {
                missingConfigs.push(key);
            }
        }

        if (missingConfigs.length > 0) {
            throw new Error(`Missing required environment variables: ${missingConfigs.join(', ')}. Please check your .env.${this.nodeEnv} file.`);
        }

        // Validate no localhost in production
        if (this.nodeEnv === 'production') {
            const localhostConfigs = [];
            for (const [key, value] of Object.entries(requiredConfigs)) {
                if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
                    localhostConfigs.push(`${key}: ${value}`);
                }
            }

            if (localhostConfigs.length > 0) {
                throw new Error(`Production build contains localhost references: ${localhostConfigs.join(', ')}. All URLs must be publicly accessible.`);
            }
        }
    }

    // Getter methods for easy access
    getApiBase() {
        return this.apiBase;
    }

    getPublicWebBase() {
        return this.publicWebBase;
    }

    getFrontendUrl() {
        return this.frontendUrl;
    }

    getCdnBaseUrl() {
        return this.cdnBaseUrl;
    }

    getN8nBase() {
        return this.n8nBase;
    }

    getVapiConfig() {
        return {
            publicKey: this.vapiPublicKey,
            privateKey: this.vapiPrivateKey,
            assistantId: this.vapiAssistantId,
            apiKey: this.vapiApiKey,
            baseUrl: this.vapiBaseUrl,
            toolsWebhook: this.vapiToolsWebhook,
            eventsWebhook: this.vapiEventsWebhook
        };
    }

    getCorsOrigins() {
        return this.corsOrigins;
    }

    isProduction() {
        return this.nodeEnv === 'production';
    }

    isStaging() {
        return this.nodeEnv === 'staging';
    }

    isDevelopment() {
        return this.nodeEnv === 'development';
    }

    shouldTrustProxy() {
        return this.trustProxy;
    }
}

// Create and export singleton instance
const environmentConfig = new EnvironmentConfig();

// Export both the instance and the class for flexibility
module.exports = environmentConfig;
module.exports.EnvironmentConfig = EnvironmentConfig;