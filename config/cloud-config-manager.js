/**
 * Cloud Configuration Manager
 * Secure environment variables and secrets management for all cloud services
 */

class CloudConfigManager {
    constructor() {
        this.config = new Map();
        this.secrets = new Map();
        this.environment = this.detectEnvironment();
        this.encryptionKey = null;
        
        this.init();
    }
    
    /**
     * Initialize the configuration manager
     */
    async init() {
        try {
            // Load environment-specific configuration
            await this.loadEnvironmentConfig();
            
            // Initialize encryption for sensitive data
            await this.initializeEncryption();
            
            // Load secrets securely
            await this.loadSecrets();
            
            // Validate required configurations
            this.validateConfiguration();
            
            console.log(`🔧 Cloud Config Manager initialized for ${this.environment} environment`);
        } catch (error) {
            console.error('Failed to initialize Cloud Config Manager:', error);
            throw error;
        }
    }
    
    /**
     * Detect current environment
     */
    detectEnvironment() {
        // Check for Vercel environment
        if (typeof process !== 'undefined' && process.env.VERCEL) {
            return process.env.VERCEL_ENV || 'production';
        }
        
        // Check for Netlify environment
        if (typeof process !== 'undefined' && process.env.NETLIFY) {
            return process.env.CONTEXT || 'production';
        }
        
        // Check for development environment
        if (typeof process !== 'undefined' && process.env.NODE_ENV) {
            return process.env.NODE_ENV;
        }
        
        // Browser environment detection
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('.local')) {
                return 'development';
            }
            if (hostname.includes('vercel.app') || hostname.includes('netlify.app')) {
                return 'preview';
            }
            return 'production';
        }
        
        return 'development';
    }
    
    /**
     * Load environment-specific configuration
     */
    async loadEnvironmentConfig() {
        const configs = {
            development: {
                // Development configuration
                api: {
                    baseUrl: null, // No longer needed - using Supabase directly
                    timeout: 10000,
                    retries: 3
                },
                database: {
                    url: process?.env?.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/caregrid_dev',
                    ssl: false,
                    poolSize: 5
                },
                storage: {
                    provider: 'local',
                    path: './uploads'
                },
                cache: {
                    provider: 'memory',
                    ttl: 300
                },
                logging: {
                    level: 'debug',
                    console: true
                }
            },
            
            preview: {
                // Preview/staging configuration
                api: {
                    baseUrl: process?.env?.NEXT_PUBLIC_API_URL || 'https://caregrid-preview.vercel.app/api',
                    timeout: 15000,
                    retries: 3
                },
                database: {
                    url: process?.env?.DATABASE_URL,
                    ssl: true,
                    poolSize: 10
                },
                storage: {
                    provider: 'cloudinary',
                    cloudName: process?.env?.CLOUDINARY_CLOUD_NAME,
                    folder: 'caregrid-preview'
                },
                cache: {
                    provider: 'redis',
                    url: process?.env?.REDIS_URL,
                    ttl: 600
                },
                logging: {
                    level: 'info',
                    console: true
                }
            },
            
            production: {
                // Production configuration
                api: {
                    baseUrl: process?.env?.NEXT_PUBLIC_API_URL || 'https://caregrid.vercel.app/api',
                    timeout: 20000,
                    retries: 5
                },
                database: {
                    url: process?.env?.DATABASE_URL,
                    ssl: true,
                    poolSize: 20
                },
                storage: {
                    provider: 'cloudinary',
                    cloudName: process?.env?.CLOUDINARY_CLOUD_NAME,
                    folder: 'caregrid-production'
                },
                cache: {
                    provider: 'redis',
                    url: process?.env?.REDIS_URL,
                    ttl: 3600
                },
                logging: {
                    level: 'error',
                    console: false
                }
            }
        };
        
        const envConfig = configs[this.environment] || configs.development;
        
        // Store configuration
        Object.entries(envConfig).forEach(([key, value]) => {
            this.config.set(key, value);
        });
    }
    
    /**
     * Initialize encryption for sensitive data
     */
    async initializeEncryption() {
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            // Browser environment - use Web Crypto API
            try {
                this.encryptionKey = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    false,
                    ['encrypt', 'decrypt']
                );
            } catch (error) {
                console.warn('Web Crypto API not available, using fallback encryption');
            }
        }
    }
    
    /**
     * Load secrets securely
     */
    async loadSecrets() {
        const secretKeys = [
            'DATABASE_URL',
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'CLOUDINARY_CLOUD_NAME',
            'CLOUDINARY_API_KEY',
            'CLOUDINARY_API_SECRET',
            'REDIS_URL',
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'SENDGRID_API_KEY',
            'STRIPE_SECRET_KEY',
            'GOOGLE_MAPS_API_KEY'
        ];
        
        secretKeys.forEach(key => {
            const value = this.getEnvironmentVariable(key);
            if (value) {
                this.secrets.set(key, this.encryptSecret(value));
            }
        });
    }
    
    /**
     * Get environment variable safely
     */
    getEnvironmentVariable(key) {
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key];
        }
        
        // Browser environment - only allow public variables
        if (typeof window !== 'undefined' && key.startsWith('NEXT_PUBLIC_')) {
            return window.ENV?.[key];
        }
        
        return null;
    }
    
    /**
     * Encrypt a secret value
     */
    encryptSecret(value) {
        if (!value) return null;
        
        // Simple obfuscation for client-side (not real encryption)
        if (typeof window !== 'undefined') {
            return btoa(value).split('').reverse().join('');
        }
        
        // Server-side would use proper encryption
        return value;
    }
    
    /**
     * Decrypt a secret value
     */
    decryptSecret(encryptedValue) {
        if (!encryptedValue) return null;
        
        // Simple deobfuscation for client-side
        if (typeof window !== 'undefined') {
            try {
                return atob(encryptedValue.split('').reverse().join(''));
            } catch (error) {
                console.error('Failed to decrypt secret:', error);
                return null;
            }
        }
        
        // Server-side would use proper decryption
        return encryptedValue;
    }
    
    /**
     * Get configuration value
     */
    get(key, defaultValue = null) {
        return this.config.get(key) || defaultValue;
    }
    
    /**
     * Get nested configuration value
     */
    getNestedConfig(path, defaultValue = null) {
        const keys = path.split('.');
        let current = Object.fromEntries(this.config);
        
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            } else {
                return defaultValue;
            }
        }
        
        return current;
    }
    
    /**
     * Get secret value
     */
    getSecret(key) {
        const encryptedValue = this.secrets.get(key);
        return this.decryptSecret(encryptedValue);
    }
    
    /**
     * Set configuration value
     */
    set(key, value) {
        this.config.set(key, value);
    }
    
    /**
     * Set secret value
     */
    setSecret(key, value) {
        this.secrets.set(key, this.encryptSecret(value));
    }
    
    /**
     * Validate required configuration
     */
    validateConfiguration() {
        const requiredConfigs = {
            development: ['api.baseUrl'],
            preview: ['api.baseUrl', 'database.url'],
            production: ['api.baseUrl', 'database.url']
        };
        
        const required = requiredConfigs[this.environment] || [];
        const missing = [];
        
        required.forEach(configPath => {
            if (this.getNestedConfig(configPath) === null) {
                missing.push(configPath);
            }
        });
        
        if (missing.length > 0) {
            throw new Error(`Missing required configuration: ${missing.join(', ')}`);
        }
    }
    
    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        return {
            url: this.getSecret('DATABASE_URL') || this.getNestedConfig('database.url'),
            ssl: this.getNestedConfig('database.ssl', false),
            poolSize: this.getNestedConfig('database.poolSize', 10)
        };
    }
    
    /**
     * Get Supabase configuration
     */
    getSupabaseConfig() {
        return {
            url: this.getSecret('SUPABASE_URL'),
            anonKey: this.getSecret('SUPABASE_ANON_KEY'),
            serviceRoleKey: this.getSecret('SUPABASE_SERVICE_ROLE_KEY')
        };
    }
    
    /**
     * Get Cloudinary configuration
     */
    getCloudinaryConfig() {
        return {
            cloudName: this.getSecret('CLOUDINARY_CLOUD_NAME'),
            apiKey: this.getSecret('CLOUDINARY_API_KEY'),
            apiSecret: this.getSecret('CLOUDINARY_API_SECRET'),
            folder: this.getNestedConfig('storage.folder', 'caregrid')
        };
    }
    
    /**
     * Get API configuration
     */
    getApiConfig() {
        return {
            baseUrl: this.getNestedConfig('api.baseUrl'),
            timeout: this.getNestedConfig('api.timeout', 10000),
            retries: this.getNestedConfig('api.retries', 3)
        };
    }
    
    /**
     * Get cache configuration
     */
    getCacheConfig() {
        return {
            provider: this.getNestedConfig('cache.provider', 'memory'),
            url: this.getSecret('REDIS_URL'),
            ttl: this.getNestedConfig('cache.ttl', 300)
        };
    }
    
    /**
     * Get logging configuration
     */
    getLoggingConfig() {
        return {
            level: this.getNestedConfig('logging.level', 'info'),
            console: this.getNestedConfig('logging.console', true)
        };
    }
    
    /**
     * Check if running in production
     */
    isProduction() {
        return this.environment === 'production';
    }
    
    /**
     * Check if running in development
     */
    isDevelopment() {
        return this.environment === 'development';
    }
    
    /**
     * Check if running in preview/staging
     */
    isPreview() {
        return this.environment === 'preview';
    }
    
    /**
     * Get current environment
     */
    getEnvironment() {
        return this.environment;
    }
    
    /**
     * Get all configuration (excluding secrets)
     */
    getAllConfig() {
        return Object.fromEntries(this.config);
    }
    
    /**
     * Get configuration summary for debugging
     */
    getConfigSummary() {
        return {
            environment: this.environment,
            configKeys: Array.from(this.config.keys()),
            secretKeys: Array.from(this.secrets.keys()),
            isProduction: this.isProduction(),
            isDevelopment: this.isDevelopment(),
            isPreview: this.isPreview()
        };
    }
    
    /**
     * Refresh configuration
     */
    async refresh() {
        await this.loadEnvironmentConfig();
        await this.loadSecrets();
        this.validateConfiguration();
    }
    
    /**
     * Clear all configuration and secrets
     */
    clear() {
        this.config.clear();
        this.secrets.clear();
    }
}

// Create global instance
const cloudConfig = new CloudConfigManager();

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudConfigManager, cloudConfig };
}

if (typeof window !== 'undefined') {
    window.CloudConfigManager = CloudConfigManager;
    window.cloudConfig = cloudConfig;
}

// Export for ES6 modules
export { CloudConfigManager, cloudConfig };