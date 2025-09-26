/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by monitoring service health
 */

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  recoveryTimeout: number; // Time to wait before attempting recovery (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  successThreshold: number; // Successes needed to close from half-open
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failures = 0;
  private successes = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private nextAttempt = 0;

  constructor(
    private name: string,
    private config: CircuitBreakerConfig = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 3,
    }
  ) {}

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Next attempt in ${Math.ceil((this.nextAttempt - Date.now()) / 1000)}s`);
      }
      // Transition to HALF_OPEN
      this.state = 'HALF_OPEN';
      this.successes = 0;
    }

    this.totalRequests++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Handle successful operation
   */
  private onSuccess(): void {
    this.lastSuccessTime = Date.now();
    this.totalSuccesses++;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.reset();
      }
    } else if (this.state === 'CLOSED') {
      this.failures = 0; // Reset failure count on success
    }
  }

  /**
   * Handle failed operation
   */
  private onFailure(): void {
    this.lastFailureTime = Date.now();
    this.totalFailures++;
    this.failures++;

    if (this.state === 'HALF_OPEN') {
      // Go back to OPEN on any failure in HALF_OPEN
      this.trip();
    } else if (this.state === 'CLOSED') {
      // Check if we should trip the breaker
      if (this.failures >= this.config.failureThreshold) {
        this.trip();
      }
    }
  }

  /**
   * Trip the circuit breaker (open it)
   */
  private trip(): void {
    this.state = 'OPEN';
    this.nextAttempt = Date.now() + this.config.recoveryTimeout;
    console.warn(`Circuit breaker OPENED for ${this.name}. Recovery timeout: ${this.config.recoveryTimeout}ms`);
  }

  /**
   * Reset the circuit breaker (close it)
   */
  private reset(): void {
    this.state = 'CLOSED';
    this.failures = 0;
    this.successes = 0;
    this.nextAttempt = 0;
    console.info(`Circuit breaker CLOSED for ${this.name}`);
  }

  /**
   * Get current circuit breaker statistics
   */
  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  /**
   * Get failure rate percentage
   */
  getFailureRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.totalFailures / this.totalRequests) * 100;
  }

  /**
   * Get success rate percentage
   */
  getSuccessRate(): number {
    if (this.totalRequests === 0) return 0;
    return (this.totalSuccesses / this.totalRequests) * 100;
  }

  /**
   * Check if circuit breaker allows requests
   */
  canExecute(): boolean {
    if (this.state === 'CLOSED' || this.state === 'HALF_OPEN') {
      return true;
    }
    
    if (this.state === 'OPEN' && Date.now() >= this.nextAttempt) {
      return true;
    }
    
    return false;
  }

  /**
   * Force reset the circuit breaker
   */
  forceReset(): void {
    this.reset();
    console.info(`Circuit breaker for ${this.name} was force reset`);
  }

  /**
   * Force trip the circuit breaker
   */
  forceTrip(): void {
    this.trip();
    console.warn(`Circuit breaker for ${this.name} was force tripped`);
  }
}

/**
 * Circuit Breaker Manager
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000,
        successThreshold: 3,
      };
      
      const finalConfig = { ...defaultConfig, ...config };
      this.breakers.set(serviceName, new CircuitBreaker(serviceName, finalConfig));
    }
    
    return this.breakers.get(serviceName)!;
  }

  /**
   * Get all circuit breaker statistics
   */
  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    
    return stats;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.forceReset();
    }
  }

  /**
   * Get healthy services (circuit breakers that allow requests)
   */
  getHealthyServices(): string[] {
    const healthy: string[] = [];
    
    for (const [name, breaker] of this.breakers) {
      if (breaker.canExecute()) {
        healthy.push(name);
      }
    }
    
    return healthy;
  }

  /**
   * Get unhealthy services (circuit breakers that are open)
   */
  getUnhealthyServices(): string[] {
    const unhealthy: string[] = [];
    
    for (const [name, breaker] of this.breakers) {
      if (!breaker.canExecute()) {
        unhealthy.push(name);
      }
    }
    
    return unhealthy;
  }
}

// Export singleton instance
export const circuitBreakerManager = new CircuitBreakerManager();
export default circuitBreakerManager;