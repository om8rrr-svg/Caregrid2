/**
 * Backend Environment Configuration
 * Centralized configuration system for backend services
 * Validates required environment variables and prevents localhost in production
 */

const path = require('path');
const fs = require('fs');

class BackendEnvironmentConfig {
    constructor() {
        this.loadEnvironmentFile();
        this.loadEnvironment();
        this.validateRequiredConfig();
    }

    loadEnvironmentFile() {
        // Determine environment
        this.nodeEnv = process.env.NODE_ENV || 'development';
        
        // Load appropriate .env file
        const envFile = `.env.${this.nodeEnv}`;
        const envPath = path.resolve(__dirname, '../../', envFile);
        
        if (fs.existsSync(envPath)) {
            require('dotenv').config({ path: envPath });
            console.log(`Loaded environment configuration from ${envFile}`);
        } else {
            console.warn(`Environment file ${envFile} not found, using process.env variables`);
        }
    }

    loadEnvironment() {
        // API Configuration
        this.apiBase = process.env.API_BASE;
        this.publicWebBase = process.env.PUBLIC_WEB_BASE;
        this.frontendUrl = process.env.FRONTEND_URL;
        this.n8nBase = process.env.N8N_BASE;
        
        // Database Configuration
        this.databaseUrl = process.env.DATABASE_URL;
        this.externalDatabaseUrl = process.env.EXTERNAL_DATABASE_URL;
        
        // Server Configuration
        this.port = process.env.PORT || 3000;
        this.trustProxy = process.env.TRUST_PROXY === 'true';
        this.corsOrigins = process.env.CORS_ORIGINS;
        
        // Email Configuration
        this.emailService = process.env.EMAIL_SERVICE || 'development';
        this.emailFrom = process.env.EMAIL_FROM;
        this.emailReplyTo = process.env.EMAIL_REPLY_TO;
        this.smtpHost = process.env.SMTP_HOST;
        this.smtpPort = process.env.SMTP_PORT || 587;
        this.smtpSecure = process.env.SMTP_SECURE === 'true';
        this.smtpUser = process.env.SMTP_USER;
        this.smtpPass = process.env.SMTP_PASS;
        
        // SMS Configuration
        this.smsProvider = process.env.SMS_PROVIDER || 'mock';
        this.smsApiUrl = process.env.SMS_API_URL;
        this.smsApiKey = process.env.SMS_API_KEY;
        
        // Vapi Webhook Configuration
        this.vapiToolsWebhook = process.env.VAPI_TOOLS_WEBHOOK;
        this.vapiEventsWebhook = process.env.VAPI_EVENTS_WEBHOOK;
        
        // CORS Configuration
        this.corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : [];
        
        // JWT Configuration
        this.jwtSecret = process.env.JWT_SECRET;
        
        // Supabase Configuration
        this.supabaseUrl = process.env.SUPABASE_URL;
        this.supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
        this.supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    validateRequiredConfig() {
        const requiredConfigs = {
            'DATABASE_URL': this.databaseUrl,
            'FRONTEND_URL': this.frontendUrl,
            'JWT_SECRET': this.jwtSecret
        };

        // Production-specific required configs
        if (this.nodeEnv === 'production') {
            requiredConfigs['API_BASE'] = this.apiBase;
            requiredConfigs['PUBLIC_WEB_BASE'] = this.publicWebBase;
            requiredConfigs['N8N_BASE'] = this.n8nBase;
            requiredConfigs['EMAIL_FROM'] = this.emailFrom;
            requiredConfigs['SMTP_HOST'] = this.smtpHost;
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
            const urlConfigs = {
                'API_BASE': this.apiBase,
                'PUBLIC_WEB_BASE': this.publicWebBase,
                'FRONTEND_URL': this.frontendUrl,
                'N8N_BASE': this.n8nBase,
                'DATABASE_URL': this.databaseUrl,
                'VAPI_TOOLS_WEBHOOK': this.vapiToolsWebhook,
                'VAPI_EVENTS_WEBHOOK': this.vapiEventsWebhook
            };

            for (const [key, value] of Object.entries(urlConfigs)) {
                if (value && (value.includes('localhost') || value.includes('127.0.0.1'))) {
                    localhostConfigs.push(`${key}: ${value}`);
                }
            }

            if (localhostConfigs.length > 0) {
                throw new Error(`Production configuration contains localhost references: ${localhostConfigs.join(', ')}. All URLs must be publicly accessible.`);
            }
        }
    }

    // Database configuration
    getDatabaseConfig() {
        return {
            url: this.databaseUrl,
            externalUrl: this.externalDatabaseUrl,
            ssl: this.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
        };
    }

    // Email configuration
    getEmailConfig() {
        return {
            service: this.emailService,
            from: this.emailFrom,
            replyTo: this.emailReplyTo,
            smtp: {
                host: this.smtpHost,
                port: parseInt(this.smtpPort),
                secure: this.smtpSecure,
                auth: {
                    user: this.smtpUser,
                    pass: this.smtpPass
                }
            }
        };
    }

    // SMS configuration
    getSmsConfig() {
        return {
            provider: this.smsProvider,
            apiUrl: this.smsApiUrl,
            apiKey: this.smsApiKey
        };
    }

    // CORS configuration
    getCorsConfig() {
        return {
            origin: this.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        };
    }

    // Vapi webhook configuration
    getVapiWebhookConfig() {
        return {
            toolsWebhook: this.vapiToolsWebhook,
            eventsWebhook: this.vapiEventsWebhook
        };
    }

    // Server configuration
    getServerConfig() {
        return {
            port: this.port,
            trustProxy: this.trustProxy,
            nodeEnv: this.nodeEnv
        };
    }

    // JWT configuration
    getJwtConfig() {
        return {
            secret: this.jwtSecret,
            expiresIn: '24h'
        };
    }

    // Supabase configuration
    getSupabaseConfig() {
        return {
            url: this.supabaseUrl,
            anonKey: this.supabaseAnonKey,
            serviceRoleKey: this.supabaseServiceRoleKey
        };
    }

    // CORS configuration
    getCorsOrigins() {
        const defaultOrigins = 'http://localhost:3000,http://localhost:5173,http://localhost:8000,http://localhost:8080,http://127.0.0.1:8000,http://127.0.0.1:8080,https://www.caregrid.co.uk,https://caregrid.co.uk,https://caregrid-ops.vercel.app,https://caregrid2-ddk7.vercel.app,https://caregrid2.vercel.app';
        const origins = this.corsOrigins || defaultOrigins;
        return (typeof origins === 'string' ? origins : defaultOrigins)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
    }

    // Environment checks
    isProduction() {
        return this.nodeEnv === 'production';
    }

    isStaging() {
        return this.nodeEnv === 'staging';
    }

    isDevelopment() {
        return this.nodeEnv === 'development';
    }
}

// Create and export singleton instance
const backendConfig = new BackendEnvironmentConfig();

module.exports = backendConfig;
module.exports.BackendEnvironmentConfig = BackendEnvironmentConfig;