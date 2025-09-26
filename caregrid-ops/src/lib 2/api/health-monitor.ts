import { apiClient } from './client';
import { ENDPOINTS } from './config';
import type { HealthCheck, ApiResponse } from '@/types';

// Health monitoring service for production CareGrid backend
export class HealthMonitor {
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private healthStatus: Map<string, HealthCheck> = new Map();
  private listeners: Array<(status: Map<string, HealthCheck>) => void> = [];
  private isMonitoring = false;

  constructor(private intervalMs: number = 30000) {} // Default 30 seconds

  /**
   * Start health monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      console.warn('Health monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    this.performHealthChecks(); // Initial check
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.intervalMs);

    console.log('Health monitoring started');
  }

  /**
   * Stop health monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isMonitoring = false;
    console.log('Health monitoring stopped');
  }

  /**
   * Perform health checks on all endpoints
   */
  private async performHealthChecks(): Promise<void> {
    const healthChecks = [
      { name: 'caregrid-api', endpoint: ENDPOINTS.CAREGRID.HEALTH },
      { name: 'database', endpoint: ENDPOINTS.HEALTH.DATABASE },
      { name: 'services', endpoint: ENDPOINTS.HEALTH.SERVICES },
      { name: 'external', endpoint: ENDPOINTS.HEALTH.EXTERNAL },
    ];

    const checkPromises = healthChecks.map(async (check) => {
      const startTime = Date.now();
      try {
        const response = await apiClient.healthCheck(check.endpoint, 5000); // 5s timeout
        const responseTime = Date.now() - startTime;

        const healthCheck: HealthCheck = {
          id: check.name,
          service: check.name,
          status: response.success ? 'healthy' : 'unhealthy',
          timestamp: new Date(),
          responseTime,
          details: {
            endpoint: check.endpoint,
            data: response.data || {},
            error: response.error,
          },
        };

        this.healthStatus.set(check.name, healthCheck);
      } catch (error: any) {
        const responseTime = Date.now() - startTime;
        const healthCheck: HealthCheck = {
          id: check.name,
          service: check.name,
          status: 'unhealthy',
          timestamp: new Date(),
          responseTime,
          details: {
            endpoint: check.endpoint,
            error: error.message || 'Health check failed',
          },
        };

        this.healthStatus.set(check.name, healthCheck);
      }
    });

    await Promise.allSettled(checkPromises);
    this.notifyListeners();
  }

  /**
   * Get current health status
   */
  getHealthStatus(): Map<string, HealthCheck> {
    return new Map(this.healthStatus);
  }

  /**
   * Get health status for a specific service
   */
  getServiceHealth(serviceName: string): HealthCheck | undefined {
    return this.healthStatus.get(serviceName);
  }

  /**
   * Check if all services are healthy
   */
  isAllHealthy(): boolean {
    return Array.from(this.healthStatus.values()).every(
      (health) => health.status === 'healthy'
    );
  }

  /**
   * Get unhealthy services
   */
  getUnhealthyServices(): HealthCheck[] {
    return Array.from(this.healthStatus.values()).filter(
      (health) => health.status !== 'healthy'
    );
  }

  /**
   * Subscribe to health status changes
   */
  subscribe(listener: (status: Map<string, HealthCheck>) => void): () => void {
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
   * Notify all listeners of health status changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.getHealthStatus());
      } catch (error) {
        console.error('Error notifying health status listener:', error);
      }
    });
  }

  /**
   * Force a health check
   */
  async forceHealthCheck(): Promise<Map<string, HealthCheck>> {
    await this.performHealthChecks();
    return this.getHealthStatus();
  }

  /**
   * Get health summary
   */
  getHealthSummary(): {
    totalServices: number;
    healthyServices: number;
    unhealthyServices: number;
    averageResponseTime: number;
    lastUpdate: Date | null;
  } {
    const services = Array.from(this.healthStatus.values());
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const avgResponseTime = services.length > 0 
      ? services.reduce((sum, s) => sum + s.responseTime, 0) / services.length 
      : 0;
    
    const lastUpdate = services.length > 0 
      ? new Date(Math.max(...services.map(s => s.timestamp.getTime())))
      : null;

    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      unhealthyServices: services.length - healthyCount,
      averageResponseTime: Math.round(avgResponseTime),
      lastUpdate,
    };
  }
}

// Export singleton instance
export const healthMonitor = new HealthMonitor();
export default healthMonitor;