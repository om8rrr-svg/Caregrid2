/**
 * CareGrid Error Tracking System
 * Captures JavaScript errors, API failures, and console logs
 * Sends them to the ops monitoring dashboard
 */

class CareGridErrorTracker {
  constructor(config = {}) {
    this.config = {
      apiEndpoint: config.apiEndpoint || null, // Disabled - ops endpoint is down
      apiKey: config.apiKey || 'demo-token',
      maxErrors: config.maxErrors || 50,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 30000, // 30 seconds
      enableConsoleCapture: config.enableConsoleCapture !== false,
      enableNetworkCapture: config.enableNetworkCapture !== false,
      enableUnhandledRejections: config.enableUnhandledRejections !== false,
      userId: config.userId || null,
      sessionId: config.sessionId || this.generateSessionId(),
      ...config
    };
    
    this.errorQueue = [];
    this.isInitialized = false;
    this.originalConsole = {};
    this.originalFetch = null;
    this.originalXHR = null;
    
    this.init();
  }
  
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  init() {
    if (this.isInitialized) return;
    
    try {
      // Capture JavaScript errors
      this.setupErrorHandling();
      
      // Capture unhandled promise rejections
      if (this.config.enableUnhandledRejections) {
        this.setupUnhandledRejectionHandling();
      }
      
      // Capture console logs
      if (this.config.enableConsoleCapture) {
        this.setupConsoleCapture();
      }
      
      // Capture network errors
      if (this.config.enableNetworkCapture) {
        this.setupNetworkCapture();
      }
      
      // Setup periodic flushing
      this.setupPeriodicFlush();
      
      // Setup page unload handler
      this.setupUnloadHandler();
      
      this.isInitialized = true;
      console.log('[CareGrid Error Tracker] Initialized successfully');
      
    } catch (error) {
      console.error('[CareGrid Error Tracker] Failed to initialize:', error);
    }
  }
  
  setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message || 'Unknown error',
        stack: event.error?.stack,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.captureError({
          type: 'network',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          filename: event.target.src || event.target.href,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            tagName: event.target.tagName,
            resourceType: event.target.tagName.toLowerCase()
          }
        });
      }
    }, true);
  }
  
  setupUnhandledRejectionHandling() {
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'javascript',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        metadata: {
          promiseRejection: true,
          reason: event.reason
        }
      });
    });
  }
  
  setupConsoleCapture() {
    const levels = ['error', 'warn', 'info', 'log'];
    
    levels.forEach(level => {
      this.originalConsole[level] = console[level];
      
      console[level] = (...args) => {
        // Call original console method
        this.originalConsole[level].apply(console, args);
        
        // Capture console output (only errors and warnings for monitoring)
        if (level === 'error' || level === 'warn') {
          this.captureError({
            type: 'console',
            message: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' '),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata: {
              consoleLevel: level,
              arguments: args
            }
          });
        }
      };
    });
  }
  
  setupNetworkCapture() {
    // Capture fetch errors
    if (window.fetch) {
      this.originalFetch = window.fetch;
      
      window.fetch = async (...args) => {
        try {
          const response = await this.originalFetch.apply(window, args);
          
          // Capture API errors (4xx, 5xx status codes)
          if (!response.ok) {
            this.captureError({
              type: 'api',
              message: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              metadata: {
                requestUrl: args[0],
                method: args[1]?.method || 'GET',
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
              }
            });
          }
          
          return response;
        } catch (error) {
          // Capture network errors
          this.captureError({
            type: 'network',
            message: `Network error: ${error.message}`,
            stack: error.stack,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metadata: {
              requestUrl: args[0],
              method: args[1]?.method || 'GET',
              networkError: true
            }
          });
          
          throw error;
        }
      };
    }
    
    // Capture XMLHttpRequest errors
    if (window.XMLHttpRequest) {
      this.originalXHR = window.XMLHttpRequest;
      
      const self = this;
      window.XMLHttpRequest = function() {
        const xhr = new self.originalXHR();
        
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        let requestData = { method: '', url: '' };
        
        xhr.open = function(method, url, ...args) {
          requestData = { method, url };
          return originalOpen.apply(this, [method, url, ...args]);
        };
        
        xhr.send = function(data) {
          const startTime = Date.now();
          
          xhr.addEventListener('error', () => {
            self.captureError({
              type: 'network',
              message: `XMLHttpRequest error: ${requestData.method} ${requestData.url}`,
              timestamp: Date.now(),
              url: window.location.href,
              userAgent: navigator.userAgent,
              metadata: {
                requestUrl: requestData.url,
                method: requestData.method,
                duration: Date.now() - startTime,
                xhrError: true
              }
            });
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 400) {
              self.captureError({
                type: 'api',
                message: `HTTP ${xhr.status}: ${xhr.statusText}`,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                metadata: {
                  requestUrl: requestData.url,
                  method: requestData.method,
                  status: xhr.status,
                  statusText: xhr.statusText,
                  duration: Date.now() - startTime,
                  responseText: xhr.responseText?.substring(0, 500) // Limit response size
                }
              });
            }
          });
          
          return originalSend.apply(this, [data]);
        };
        
        return xhr;
      };
    }
  }
  
  setupPeriodicFlush() {
    setInterval(() => {
      if (this.errorQueue.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }
  
  setupUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      if (this.errorQueue.length > 0) {
        this.flush(true); // Synchronous flush on page unload
      }
    });
  }
  
  captureError(errorData) {
    try {
      // Add common metadata
      const enrichedError = {
        ...errorData,
        id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: errorData.timestamp || Date.now(),
        url: errorData.url || window.location.href,
        userAgent: errorData.userAgent || navigator.userAgent,
        metadata: {
          ...errorData.metadata,
          userId: this.config.userId,
          sessionId: this.config.sessionId,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          screen: {
            width: window.screen.width,
            height: window.screen.height
          },
          timestamp: new Date().toISOString()
        }
      };
      
      // Add to queue
      this.errorQueue.push(enrichedError);
      
      // Limit queue size
      if (this.errorQueue.length > this.config.maxErrors) {
        this.errorQueue = this.errorQueue.slice(-this.config.maxErrors);
      }
      
      // Auto-flush if queue is full
      if (this.errorQueue.length >= this.config.batchSize) {
        this.flush();
      }
      
    } catch (error) {
      console.error('[CareGrid Error Tracker] Failed to capture error:', error);
    }
  }
  
  async flush(synchronous = false) {
    if (this.errorQueue.length === 0) return;
    
    const errorsToSend = [...this.errorQueue];
    this.errorQueue = [];
    
    const payload = {
      errors: errorsToSend,
      metadata: {
        userId: this.config.userId,
        sessionId: this.config.sessionId,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      // Skip sending if endpoint is disabled
      if (!this.config.apiEndpoint) {
        console.log('Error tracking disabled - endpoint not configured');
        return;
      }
      
      if (synchronous && navigator.sendBeacon) {
        // Use sendBeacon for synchronous sending (page unload)
        navigator.sendBeacon(
          this.config.apiEndpoint,
          JSON.stringify(payload)
        );
      } else {
        // Use fetch for asynchronous sending
        const response = await fetch(this.config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        console.log(`[CareGrid Error Tracker] Successfully sent ${errorsToSend.length} errors`);
      }
    } catch (error) {
      console.error('[CareGrid Error Tracker] Failed to send errors:', error);
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...errorsToSend);
    }
  }
  
  // Manual error reporting
  reportError(message, metadata = {}) {
    this.captureError({
      type: 'javascript',
      message: message,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: {
        ...metadata,
        manual: true
      }
    });
  }
  
  // Update user context
  setUser(userId) {
    this.config.userId = userId;
  }
  
  // Get current session info
  getSessionInfo() {
    return {
      sessionId: this.config.sessionId,
      userId: this.config.userId,
      errorsQueued: this.errorQueue.length
    };
  }
  
  // Destroy the tracker
  destroy() {
    try {
      // Flush remaining errors
      if (this.errorQueue.length > 0) {
        this.flush(true);
      }
      
      // Restore original console methods
      Object.keys(this.originalConsole).forEach(level => {
        console[level] = this.originalConsole[level];
      });
      
      // Restore original fetch
      if (this.originalFetch) {
        window.fetch = this.originalFetch;
      }
      
      // Restore original XMLHttpRequest
      if (this.originalXHR) {
        window.XMLHttpRequest = this.originalXHR;
      }
      
      this.isInitialized = false;
      console.log('[CareGrid Error Tracker] Destroyed successfully');
      
    } catch (error) {
      console.error('[CareGrid Error Tracker] Failed to destroy:', error);
    }
  }
}

// Auto-initialize if in browser environment
if (typeof window !== 'undefined') {
  // Initialize with default config
  window.CareGridErrorTracker = new CareGridErrorTracker({
    // You can override these in your application
    apiEndpoint: window.CAREGRID_ERROR_API || 'https://caregrid-backend-latest.onrender.com/api/errors',
    apiKey: window.CAREGRID_API_KEY || 'demo-token',
    userId: window.CAREGRID_USER_ID || null
  });
  
  // Expose manual error reporting globally
  window.reportError = (message, metadata) => {
    window.CareGridErrorTracker.reportError(message, metadata);
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CareGridErrorTracker;
}