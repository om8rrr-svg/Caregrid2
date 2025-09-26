/**
 * Request Queue Manager
 * Handles request throttling, rate limiting, and queue management
 */

export interface QueuedRequest {
  id: string;
  operation: () => Promise<any>;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  retries: number;
  maxRetries: number;
  timeout: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

export interface QueueConfig {
  maxConcurrent: number; // Maximum concurrent requests
  maxQueueSize: number; // Maximum queue size
  defaultTimeout: number; // Default request timeout (ms)
  rateLimitWindow: number; // Rate limit window (ms)
  rateLimitMax: number; // Max requests per window
  retryDelay: number; // Base retry delay (ms)
  maxRetryDelay: number; // Maximum retry delay (ms)
}

export interface QueueStats {
  queueSize: number;
  activeRequests: number;
  completedRequests: number;
  failedRequests: number;
  averageWaitTime: number;
  averageProcessingTime: number;
  rateLimitHits: number;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = new Set<string>();
  private requestHistory: number[] = [];
  private completedRequests = 0;
  private failedRequests = 0;
  private totalWaitTime = 0;
  private totalProcessingTime = 0;
  private rateLimitHits = 0;
  private isProcessing = false;

  constructor(
    private name: string,
    private config: QueueConfig = {
      maxConcurrent: 10,
      maxQueueSize: 100,
      defaultTimeout: 30000,
      rateLimitWindow: 60000, // 1 minute
      rateLimitMax: 100,
      retryDelay: 1000,
      maxRetryDelay: 30000,
    }
  ) {
    this.startProcessing();
  }

  /**
   * Add a request to the queue
   */
  async enqueue<T>(
    operation: () => Promise<T>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'critical';
      timeout?: number;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check queue size limit
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error(`Queue ${this.name} is full (${this.config.maxQueueSize} items)`));
        return;
      }

      // Check rate limit
      if (!this.checkRateLimit()) {
        this.rateLimitHits++;
        reject(new Error(`Rate limit exceeded for queue ${this.name}`));
        return;
      }

      const request: QueuedRequest = {
        id: this.generateId(),
        operation,
        priority: options.priority || 'medium',
        timestamp: Date.now(),
        retries: 0,
        maxRetries: options.maxRetries || 3,
        timeout: options.timeout || this.config.defaultTimeout,
        resolve,
        reject,
      };

      // Insert based on priority
      this.insertByPriority(request);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.startProcessing();
      }
    });
  }

  /**
   * Insert request into queue based on priority
   */
  private insertByPriority(request: QueuedRequest): void {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const requestPriority = priorityOrder[request.priority];

    let insertIndex = this.queue.length;
    for (let i = 0; i < this.queue.length; i++) {
      const queuePriority = priorityOrder[this.queue[i].priority];
      if (requestPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.queue.splice(insertIndex, 0, request);
  }

  /**
   * Start processing the queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0 || this.activeRequests.size > 0) {
      // Process requests up to the concurrent limit
      while (
        this.queue.length > 0 &&
        this.activeRequests.size < this.config.maxConcurrent
      ) {
        const request = this.queue.shift()!;
        this.processRequest(request);
      }

      // Wait a bit before checking again
      await this.sleep(10);
    }

    this.isProcessing = false;
  }

  /**
   * Process a single request
   */
  private async processRequest(request: QueuedRequest): Promise<void> {
    this.activeRequests.add(request.id);
    const startTime = Date.now();
    const waitTime = startTime - request.timestamp;
    this.totalWaitTime += waitTime;

    try {
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), request.timeout);
      });

      // Execute the operation with timeout
      const result = await Promise.race([
        request.operation(),
        timeoutPromise,
      ]);

      const processingTime = Date.now() - startTime;
      this.totalProcessingTime += processingTime;
      this.completedRequests++;

      request.resolve(result);
    } catch (error) {
      // Handle retry logic
      if (request.retries < request.maxRetries) {
        request.retries++;
        const delay = this.calculateRetryDelay(request.retries);
        
        setTimeout(() => {
          this.insertByPriority(request);
        }, delay);
      } else {
        this.failedRequests++;
        request.reject(error);
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  /**
   * Calculate exponential backoff retry delay
   */
  private calculateRetryDelay(retryCount: number): number {
    const delay = this.config.retryDelay * Math.pow(2, retryCount - 1);
    return Math.min(delay, this.config.maxRetryDelay);
  }

  /**
   * Check if request is within rate limit
   */
  private checkRateLimit(): boolean {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindow;

    // Remove old entries
    this.requestHistory = this.requestHistory.filter(time => time > windowStart);

    // Check if we're under the limit
    if (this.requestHistory.length >= this.config.rateLimitMax) {
      return false;
    }

    // Add current request to history
    this.requestHistory.push(now);
    return true;
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue statistics
   */
  getStats(): QueueStats {
    const totalRequests = this.completedRequests + this.failedRequests;
    
    return {
      queueSize: this.queue.length,
      activeRequests: this.activeRequests.size,
      completedRequests: this.completedRequests,
      failedRequests: this.failedRequests,
      averageWaitTime: totalRequests > 0 ? this.totalWaitTime / totalRequests : 0,
      averageProcessingTime: this.completedRequests > 0 ? this.totalProcessingTime / this.completedRequests : 0,
      rateLimitHits: this.rateLimitHits,
    };
  }

  /**
   * Clear the queue
   */
  clear(): void {
    // Reject all pending requests
    for (const request of this.queue) {
      request.reject(new Error('Queue cleared'));
    }
    
    this.queue = [];
  }

  /**
   * Pause queue processing
   */
  pause(): void {
    this.isProcessing = false;
  }

  /**
   * Resume queue processing
   */
  resume(): void {
    if (!this.isProcessing && (this.queue.length > 0 || this.activeRequests.size > 0)) {
      this.startProcessing();
    }
  }

  /**
   * Update queue configuration
   */
  updateConfig(newConfig: Partial<QueueConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get queue health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    issues: string[];
  } {
    const stats = this.getStats();
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check queue size
    if (stats.queueSize > this.config.maxQueueSize * 0.8) {
      issues.push('Queue is near capacity');
      status = 'degraded';
    }

    // Check failure rate
    const totalRequests = stats.completedRequests + stats.failedRequests;
    if (totalRequests > 0) {
      const failureRate = stats.failedRequests / totalRequests;
      if (failureRate > 0.1) {
        issues.push('High failure rate detected');
        status = failureRate > 0.3 ? 'unhealthy' : 'degraded';
      }
    }

    // Check average wait time
    if (stats.averageWaitTime > 5000) {
      issues.push('High average wait time');
      status = status === 'healthy' ? 'degraded' : status;
    }

    // Check rate limit hits
    if (stats.rateLimitHits > 10) {
      issues.push('Frequent rate limit hits');
      status = status === 'healthy' ? 'degraded' : status;
    }

    return { status, issues };
  }
}

/**
 * Request Queue Manager
 * Manages multiple request queues for different services
 */
export class RequestQueueManager {
  private queues = new Map<string, RequestQueue>();

  /**
   * Get or create a request queue for a service
   */
  getQueue(serviceName: string, config?: Partial<QueueConfig>): RequestQueue {
    if (!this.queues.has(serviceName)) {
      const defaultConfig: QueueConfig = {
        maxConcurrent: 10,
        maxQueueSize: 100,
        defaultTimeout: 30000,
        rateLimitWindow: 60000,
        rateLimitMax: 100,
        retryDelay: 1000,
        maxRetryDelay: 30000,
      };
      
      const finalConfig = { ...defaultConfig, ...config };
      this.queues.set(serviceName, new RequestQueue(serviceName, finalConfig));
    }
    
    return this.queues.get(serviceName)!;
  }

  /**
   * Get all queue statistics
   */
  getAllStats(): Record<string, QueueStats> {
    const stats: Record<string, QueueStats> = {};
    
    for (const [name, queue] of this.queues) {
      stats[name] = queue.getStats();
    }
    
    return stats;
  }

  /**
   * Get overall health status
   */
  getOverallHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    queues: Record<string, { status: string; issues: string[] }>;
  } {
    const queueHealth: Record<string, { status: string; issues: string[] }> = {};
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, queue] of this.queues) {
      const health = queue.getHealth();
      queueHealth[name] = health;

      if (health.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (health.status === 'degraded' && overallStatus === 'healthy') {
        overallStatus = 'degraded';
      }
    }

    return {
      status: overallStatus,
      queues: queueHealth,
    };
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    for (const queue of this.queues.values()) {
      queue.clear();
    }
  }

  /**
   * Pause all queues
   */
  pauseAll(): void {
    for (const queue of this.queues.values()) {
      queue.pause();
    }
  }

  /**
   * Resume all queues
   */
  resumeAll(): void {
    for (const queue of this.queues.values()) {
      queue.resume();
    }
  }
}

// Export singleton instance
export const requestQueueManager = new RequestQueueManager();
export default requestQueueManager;