import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getApiConfig, API_CONFIG, HTTP_STATUS } from './config';
import { getFromStorage, setToStorage, removeFromStorage } from '../utils';
import type { ApiResponse } from '@/types';
import { circuitBreakerManager } from './circuit-breaker';
import { requestQueueManager } from './request-queue';
import { healthMonitor } from './health-monitor';

// API Client Class
class ApiClient {
  private careGridClient: AxiosInstance;
  private opsClient: AxiosInstance;
  private config = getApiConfig();
  private isProduction: boolean = process.env.NODE_ENV === 'production';

  constructor() {
    // CareGrid Production API Client
    this.careGridClient = axios.create({
      baseURL: this.config.CAREGRID_API_URL,
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // CareGrid Ops API Client
    this.opsClient = axios.create({
      baseURL: this.config.OPS_API_URL,
      timeout: API_CONFIG.DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptors for authentication
    const requestInterceptor = (config: any) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    };

    // Response interceptors for error handling
    const responseInterceptor = (response: AxiosResponse) => response;
    const errorInterceptor = async (error: any) => {
      const originalRequest = error.config;

      // Handle 401 errors (unauthorized)
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          await this.refreshToken();
          const token = this.getAuthToken();
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          }
        } catch (refreshError) {
          this.clearAuth();
          // Redirect to login or emit auth error event
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      }

      return Promise.reject(error);
    };

    // Apply interceptors to both clients
    [this.careGridClient, this.opsClient].forEach(client => {
      client.interceptors.request.use(requestInterceptor);
      client.interceptors.response.use(responseInterceptor, errorInterceptor);
    });
  }

  // Authentication methods
  private getAuthToken(): string | null {
    return getFromStorage(API_CONFIG.TOKEN_STORAGE_KEY, null);
  }

  private setAuthToken(token: string): void {
    setToStorage(API_CONFIG.TOKEN_STORAGE_KEY, token);
  }

  private getRefreshToken(): string | null {
    return getFromStorage(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, null);
  }

  private setRefreshToken(token: string): void {
    setToStorage(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY, token);
  }

  private clearAuth(): void {
    removeFromStorage(API_CONFIG.TOKEN_STORAGE_KEY);
    removeFromStorage(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.opsClient.post('/api/auth/refresh', {
      refreshToken,
    });

    const { token, refreshToken: newRefreshToken } = response.data;
    this.setAuthToken(token);
    if (newRefreshToken) {
      this.setRefreshToken(newRefreshToken);
    }
  }

  // Retry logic
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = API_CONFIG.MAX_RETRIES
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }

        if (attempt < maxRetries) {
          const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt); // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  // Enhanced request method with circuit breaker and queue
  private async request<T>(
    client: AxiosInstance,
    config: AxiosRequestConfig,
    serviceName: string = 'default'
  ): Promise<ApiResponse<T>> {
    // Create AbortController for 30s timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), API_CONFIG.DEFAULT_TIMEOUT);
    
    try {
      const requestConfig = {
        ...config,
        signal: abortController.signal,
      };

      let response;
      
      // Always use circuit breaker and request queue for hardening
      const circuitBreaker = circuitBreakerManager.getBreaker(serviceName);
      const requestQueue = requestQueueManager.getQueue(serviceName);
      
      response = await requestQueue.enqueue(
        () => circuitBreaker.execute(() => this.withRetry(() => client.request<T>(requestConfig))),
        { priority: 'medium' }
      );
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Request Error:', error);
      
      // Handle AbortController timeout
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout after 30 seconds',
          data: undefined,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'An error occurred',
        data: undefined,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // CareGrid Production API methods
  async careGridGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.careGridClient, { ...config, method: 'GET', url }, 'caregrid-api');
  }

  async careGridPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.careGridClient, { ...config, method: 'POST', url, data }, 'caregrid-api');
  }

  async careGridPut<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.careGridClient, { ...config, method: 'PUT', url, data }, 'caregrid-api');
  }

  async careGridDelete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.careGridClient, { ...config, method: 'DELETE', url }, 'caregrid-api');
  }

  // CareGrid Ops API methods
  async opsGet<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.opsClient, { ...config, method: 'GET', url }, 'ops-api');
  }

  async opsPost<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.opsClient, { ...config, method: 'POST', url, data }, 'ops-api');
  }

  async opsPut<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.opsClient, { ...config, method: 'PUT', url, data }, 'ops-api');
  }

  async opsDelete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(this.opsClient, { ...config, method: 'DELETE', url }, 'ops-api');
  }

  // Health check methods (no retry for faster feedback)
  async healthCheck(url: string, timeout: number = API_CONFIG.HEALTH_CHECK_TIMEOUT): Promise<ApiResponse<any>> {
    try {
      const response = await this.careGridClient.get(url, { timeout });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  // Production monitoring methods
  getCircuitBreakerStats() {
    return circuitBreakerManager.getAllStats();
  }

  getRequestQueueStats() {
    return requestQueueManager.getAllStats();
  }

  getHealthMonitorStatus() {
    return healthMonitor.getHealthStatus();
  }

  async startHealthMonitoring() {
    if (this.isProduction) {
      healthMonitor.start();
    }
  }

  stopHealthMonitoring() {
    healthMonitor.stop();
  }

  // Force health check
  async forceHealthCheck() {
    return healthMonitor.forceHealthCheck();
  }

  // Get overall system health
  async getSystemHealth() {
    const [circuitStats, queueStats, healthStatus] = await Promise.all([
      this.getCircuitBreakerStats(),
      this.getRequestQueueStats(),
      this.getHealthMonitorStatus()
    ]);

    const queueHealth = requestQueueManager.getOverallHealth();
    const healthyServices = circuitBreakerManager.getHealthyServices();
    const unhealthyServices = circuitBreakerManager.getUnhealthyServices();

    return {
      timestamp: new Date().toISOString(),
      overall: {
        status: queueHealth.status === 'healthy' && unhealthyServices.length === 0 ? 'healthy' : 'degraded',
        healthyServices,
        unhealthyServices
      },
      circuitBreakers: circuitStats,
      requestQueues: {
        stats: queueStats,
        health: queueHealth
      },
      healthMonitor: healthStatus
    };
  }

  // Reset all circuit breakers
  resetCircuitBreakers() {
    circuitBreakerManager.resetAll();
  }

  // Clear all request queues
  clearRequestQueues() {
    requestQueueManager.clearAll();
  }

  // Helper method for internal API calls (like auth endpoints) with hardening
  private async internalFetch<T>(
    url: string,
    options: RequestInit = {},
    serviceName: string = 'internal-api'
  ): Promise<ApiResponse<T>> {
    // Create AbortController for 30s timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), API_CONFIG.DEFAULT_TIMEOUT);
    
    try {
      const fetchOptions = {
        ...options,
        signal: abortController.signal,
      };

      let response;
      
      // Always use circuit breaker and request queue for hardening
      const circuitBreaker = circuitBreakerManager.getBreaker(serviceName);
      const requestQueue = requestQueueManager.getQueue(serviceName);
      
      response = await requestQueue.enqueue(
        () => circuitBreaker.execute(() => this.withRetry(() => fetch(url, fetchOptions))),
        { priority: 'high' } // Auth calls get high priority
      );
      
      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
        };
      } else {
        return {
          success: false,
          error: data.error || 'Request failed',
          data: undefined,
        };
      }
    } catch (error: any) {
      console.error('Internal API Request Error:', error);
      
      // Handle AbortController timeout
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'Request timeout after 30 seconds',
          data: undefined,
        };
      }
      
      return {
        success: false,
        error: error.message || 'Network error',
        data: undefined,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Authentication methods (using local API routes)
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string; refreshToken: string }>> {
    const result = await this.internalFetch<{ user: any; token: string; refreshToken: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
      'auth-api'
    );

    if (result.success && result.data) {
      this.setAuthToken(result.data.token);
      this.setRefreshToken(result.data.refreshToken);
      return {
        success: true,
        data: result.data,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Login failed',
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    const result = await this.internalFetch<void>(
      '/api/auth/logout',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      'auth-api'
    );

    this.clearAuth();
    return result;
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    const token = this.getAuthToken();
    const result = await this.internalFetch<any>(
      '/api/auth/profile',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      },
      'auth-api'
    );

    return result;
  }

  // Update configuration (useful for environment switching)
  updateConfig(newConfig: Partial<typeof API_CONFIG>) {
    this.config = { ...this.config, ...newConfig };
    
    // Update base URLs if changed
    if (newConfig.CAREGRID_API_URL) {
      this.careGridClient.defaults.baseURL = newConfig.CAREGRID_API_URL;
    }
    if (newConfig.OPS_API_URL) {
      this.opsClient.defaults.baseURL = newConfig.OPS_API_URL;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;