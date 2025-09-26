/**
 * Production Configuration Manager
 * Handles environment-specific settings, feature flags, and runtime configuration
 */

export interface ProductionConfig {
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
  
  // Circuit Breaker Configuration
  circuitBreaker: {
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    successThreshold: number;
  };
  
  // Request Queue Configuration
  requestQueue: {
    maxConcurrent: number;
    maxQueueSize: number;
    defaultTimeout: number;
    retryDelay: number;
    maxRetryDelay: number;
  };
  
  // Health Monitoring Configuration
  healthMonitoring: {
    enabled: boolean;
    interval: number;
    timeout: number;
    endpoints: string[];
  };
  
  // Security Configuration
  security: {
    tokenRefreshThreshold: number; // Minutes before expiry to refresh
    maxTokenAge: number; // Maximum token age in minutes
    enableCSRF: boolean;
    enableCORS: boolean;
    allowedOrigins: string[];
  };
  
  // Logging Configuration
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableConsole: boolean;
    enableRemote: boolean;
    remoteEndpoint?: string;
    maxLogSize: number;
    retentionDays: number;
  };
  
  // Feature Flags
  features: {
    enableCircuitBreaker: boolean;
    enableRequestQueue: boolean;
    enableHealthMonitoring: boolean;
    enableMetrics: boolean;
    enableAlerts: boolean;
    enableMaintenanceMode: boolean;
    enableDebugMode: boolean;
  };
  
  // Performance Configuration
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableCompression: boolean;
    enableLazyLoading: boolean;
    maxConcurrentRequests: number;
  };
}

export const DEFAULT_PRODUCTION_CONFIG: ProductionConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.caregrid.com',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimitWindow: 60000,
    rateLimitMax: 100,
  },
  
  circuitBreaker: {
    failureThreshold: 5,
    recoveryTimeout: 60000,
    monitoringPeriod: 300000,
    successThreshold: 3,
  },
  
  requestQueue: {
    maxConcurrent: 10,
    maxQueueSize: 100,
    defaultTimeout: 30000,
    retryDelay: 1000,
    maxRetryDelay: 30000,
  },
  
  healthMonitoring: {
    enabled: true,
    interval: 30000,
    timeout: 5000,
    endpoints: ['/health', '/health/database', '/health/services'],
  },
  
  security: {
    tokenRefreshThreshold: 5,
    maxTokenAge: 60,
    enableCSRF: true,
    enableCORS: true,
    allowedOrigins: [
      'https://caregrid.com',
      'https://ops.caregrid.com',
      'https://admin.caregrid.com'
    ],
  },
  
  logging: {
    level: 'info',
    enableConsole: false,
    enableRemote: true,
    remoteEndpoint: process.env.NEXT_PUBLIC_LOG_ENDPOINT,
    maxLogSize: 10485760, // 10MB
    retentionDays: 30,
  },
  
  features: {
    enableCircuitBreaker: true,
    enableRequestQueue: true,
    enableHealthMonitoring: true,
    enableMetrics: true,
    enableAlerts: true,
    enableMaintenanceMode: false,
    enableDebugMode: false,
  },
  
  performance: {
    enableCaching: true,
    cacheTimeout: 300000, // 5 minutes
    enableCompression: true,
    enableLazyLoading: true,
    maxConcurrentRequests: 20,
  },
};

export const DEVELOPMENT_CONFIG: ProductionConfig = {
  ...DEFAULT_PRODUCTION_CONFIG,
  api: {
    ...DEFAULT_PRODUCTION_CONFIG.api,
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 10000,
    retryAttempts: 1,
  },
  
  healthMonitoring: {
    ...DEFAULT_PRODUCTION_CONFIG.healthMonitoring,
    enabled: false,
    interval: 60000,
  },
  
  security: {
    ...DEFAULT_PRODUCTION_CONFIG.security,
    enableCSRF: false,
    allowedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  },
  
  logging: {
    ...DEFAULT_PRODUCTION_CONFIG.logging,
    level: 'debug',
    enableConsole: true,
    enableRemote: false,
  },
  
  features: {
    ...DEFAULT_PRODUCTION_CONFIG.features,
    enableCircuitBreaker: false,
    enableRequestQueue: false,
    enableHealthMonitoring: false,
    enableDebugMode: true,
  },
  
  performance: {
    ...DEFAULT_PRODUCTION_CONFIG.performance,
    enableCaching: false,
    maxConcurrentRequests: 5,
  },
};

export class ProductionConfigManager {
  private config: ProductionConfig;
  private listeners: Array<(config: ProductionConfig) => void> = [];
  private remoteConfigCache: ProductionConfig | null = null;
  private lastRemoteConfigFetch = 0;
  private remoteConfigCacheTimeout = 300000; // 5 minutes

  constructor() {
    this.config = this.getInitialConfig();
    this.loadRemoteConfig();
  }

  /**
   * Get initial configuration based on environment
   */
  private getInitialConfig(): ProductionConfig {
    const isProduction = process.env.NODE_ENV === 'production';
    return isProduction ? DEFAULT_PRODUCTION_CONFIG : DEVELOPMENT_CONFIG;
  }

  /**
   * Get current configuration
   */
  getConfig(): ProductionConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ProductionConfig>): void {
    this.config = this.mergeConfig(this.config, updates);
    this.notifyListeners();
  }

  /**
   * Deep merge configuration objects
   */
  private mergeConfig(base: ProductionConfig, updates: Partial<ProductionConfig>): ProductionConfig {
    const merged = { ...base };
    
    for (const [key, value] of Object.entries(updates)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        merged[key as keyof ProductionConfig] = {
          ...merged[key as keyof ProductionConfig],
          ...value,
        } as any;
      } else {
        merged[key as keyof ProductionConfig] = value as any;
      }
    }
    
    return merged;
  }

  /**
   * Load remote configuration
   */
  async loadRemoteConfig(): Promise<void> {
    const now = Date.now();
    
    // Check cache validity
    if (
      this.remoteConfigCache &&
      now - this.lastRemoteConfigFetch < this.remoteConfigCacheTimeout
    ) {
      return;
    }

    try {
      const configEndpoint = process.env.NEXT_PUBLIC_CONFIG_ENDPOINT;
      if (!configEndpoint) {
        console.info('No remote config endpoint configured');
        return;
      }

      // Use hardened fetch with 30s timeout and AbortController
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 30000);

      try {
        const response = await fetch(configEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-cache',
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch remote config: ${response.status}`);
        }

        const remoteConfig = await response.json();
        this.remoteConfigCache = remoteConfig;
        this.lastRemoteConfigFetch = now;
        
        // Merge remote config with current config
        this.updateConfig(remoteConfig);
        
        console.info('Remote configuration loaded successfully');
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Remote configuration fetch timeout after 30 seconds');
      } else {
        console.warn('Failed to load remote configuration:', error);
      }
    }
  }

  /**
   * Subscribe to configuration changes
   */
  subscribe(listener: (config: ProductionConfig) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getConfig());
      } catch (error) {
        console.error('Error notifying config listener:', error);
      }
    });
  }

  /**
   * Get feature flag value
   */
  isFeatureEnabled(feature: keyof ProductionConfig['features']): boolean {
    return this.config.features[feature];
  }

  /**
   * Enable/disable feature flag
   */
  setFeatureFlag(feature: keyof ProductionConfig['features'], enabled: boolean): void {
    this.updateConfig({
      features: {
        ...this.config.features,
        [feature]: enabled,
      },
    });
  }

  /**
   * Get API configuration
   */
  getApiConfig() {
    return this.config.api;
  }

  /**
   * Get circuit breaker configuration
   */
  getCircuitBreakerConfig() {
    return this.config.circuitBreaker;
  }

  /**
   * Get request queue configuration
   */
  getRequestQueueConfig() {
    return this.config.requestQueue;
  }

  /**
   * Get health monitoring configuration
   */
  getHealthMonitoringConfig() {
    return this.config.healthMonitoring;
  }

  /**
   * Get security configuration
   */
  getSecurityConfig() {
    return this.config.security;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.config.logging;
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.config.performance;
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.config = this.getInitialConfig();
    this.notifyListeners();
  }

  /**
   * Export current configuration
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  importConfig(configJson: string): void {
    try {
      const importedConfig = JSON.parse(configJson);
      this.updateConfig(importedConfig);
    } catch (error) {
      throw new Error('Invalid configuration JSON');
    }
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Partial<ProductionConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate API configuration
    if (config.api) {
      if (config.api.timeout && config.api.timeout < 1000) {
        errors.push('API timeout must be at least 1000ms');
      }
      if (config.api.retryAttempts && config.api.retryAttempts < 0) {
        errors.push('API retry attempts must be non-negative');
      }
    }

    // Validate circuit breaker configuration
    if (config.circuitBreaker) {
      if (config.circuitBreaker.failureThreshold && config.circuitBreaker.failureThreshold < 1) {
        errors.push('Circuit breaker failure threshold must be at least 1');
      }
    }

    // Validate request queue configuration
    if (config.requestQueue) {
      if (config.requestQueue.maxConcurrent && config.requestQueue.maxConcurrent < 1) {
        errors.push('Request queue max concurrent must be at least 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export const productionConfigManager = new ProductionConfigManager();
export default productionConfigManager;