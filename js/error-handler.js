/**
 * Enhanced Error Handling System for CareGrid
 * Provides user-friendly error messages, retry mechanisms, and graceful degradation
 */

class ErrorHandler {
    constructor() {
        this.retryAttempts = new Map();
        this.maxRetries = 3;
        this.retryDelay = 1000; // Base delay in milliseconds
        this.errorQueue = [];
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
        this.setupGlobalErrorHandlers();
    }

    /**
     * Setup network status listeners
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.handleNetworkReconnection();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNetworkError();
        });
    }

    /**
     * Setup global error handlers
     */
    setupGlobalErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, 'system');
            event.preventDefault();
        });

        // Handle JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            this.handleError(event.error, 'javascript');
        });
    }

    /**
     * Main error handling method
     * @param {Error|string} error - The error to handle
     * @param {string} context - Context where error occurred
     * @param {Object} options - Additional options
     */
    async handleError(error, context = 'general', options = {}) {
        const errorInfo = this.parseError(error);
        const errorId = this.generateErrorId();
        
        // Log error for debugging
        this.logError(errorInfo, context, errorId);

        // Check if we should retry
        if (options.allowRetry !== false && this.shouldRetry(errorInfo, context)) {
            return await this.attemptRetry(error, context, options);
        }

        // Show user-friendly error message
        this.showUserError(errorInfo, context, options);

        // Track error for analytics
        this.trackError(errorInfo, context, errorId);

        return { success: false, error: errorInfo, errorId };
    }

    /**
     * Parse error into standardized format
     * @param {Error|string} error - Raw error
     * @returns {Object} Parsed error information
     */
    parseError(error) {
        if (typeof error === 'string') {
            return {
                type: 'custom',
                message: error,
                code: null,
                status: null
            };
        }

        if (error instanceof Error) {
            return {
                type: this.getErrorType(error),
                message: error.message,
                code: error.code || null,
                status: error.status || null,
                stack: error.stack
            };
        }

        return {
            type: 'unknown',
            message: 'An unexpected error occurred',
            code: null,
            status: null
        };
    }

    /**
     * Determine error type
     * @param {Error} error - Error object
     * @returns {string} Error type
     */
    getErrorType(error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return 'network';
        }
        if (error.message.includes('timeout')) {
            return 'timeout';
        }
        if (error.message.includes('BACKEND_UNAVAILABLE')) {
            return 'service_unavailable';
        }
        if (error.status >= 400 && error.status < 500) {
            return 'client_error';
        }
        if (error.status >= 500) {
            return 'server_error';
        }
        return 'general';
    }

    /**
     * Check if error should be retried
     * @param {Object} errorInfo - Parsed error information
     * @param {string} context - Error context
     * @returns {boolean} Whether to retry
     */
    shouldRetry(errorInfo, context) {
        const retryableTypes = ['network', 'timeout', 'server_error', 'service_unavailable'];
        const nonRetryableContexts = ['authentication', 'validation'];
        
        if (nonRetryableContexts.includes(context)) {
            return false;
        }

        if (!retryableTypes.includes(errorInfo.type)) {
            return false;
        }

        const retryKey = `${context}_${errorInfo.type}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        return attempts < this.maxRetries;
    }

    /**
     * Attempt to retry the failed operation
     * @param {Error} originalError - Original error
     * @param {string} context - Error context
     * @param {Object} options - Retry options
     */
    async attemptRetry(originalError, context, options) {
        const retryKey = `${context}_${this.getErrorType(originalError)}`;
        const attempts = this.retryAttempts.get(retryKey) || 0;
        
        this.retryAttempts.set(retryKey, attempts + 1);

        // Calculate delay with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempts);
        
        // Show retry notification
        this.showRetryNotification(attempts + 1, delay);

        // Wait before retrying
        await this.delay(delay);

        try {
            // If retry function is provided, use it
            if (options.retryFunction) {
                const result = await options.retryFunction();
                this.retryAttempts.delete(retryKey); // Clear retry count on success
                this.hideRetryNotification();
                return { success: true, data: result };
            }
        } catch (retryError) {
            // If this was the last retry attempt, show final error
            if (attempts + 1 >= this.maxRetries) {
                this.retryAttempts.delete(retryKey);
                this.hideRetryNotification();
                return this.handleError(retryError, context, { allowRetry: false });
            }
            
            // Continue retrying
            return this.attemptRetry(retryError, context, options);
        }
    }

    /**
     * Show user-friendly error message
     * @param {Object} errorInfo - Parsed error information
     * @param {string} context - Error context
     * @param {Object} options - Display options
     */
    showUserError(errorInfo, context, options = {}) {
        const message = this.getUserFriendlyMessage(errorInfo, context);
        const errorType = this.getErrorSeverity(errorInfo);
        
        // Create error notification
        const notification = this.createErrorNotification({
            message,
            type: errorType,
            context,
            actions: this.getErrorActions(errorInfo, context, options),
            dismissible: options.dismissible !== false,
            persistent: options.persistent === true
        });

        this.displayNotification(notification);
    }

    /**
     * Get user-friendly error message
     * @param {Object} errorInfo - Parsed error information
     * @param {string} context - Error context
     * @returns {string} User-friendly message
     */
    getUserFriendlyMessage(errorInfo, context) {
        const messages = {
            network: {
                search: "We're having trouble connecting to our servers. Your search results may be limited to cached data.",
                booking: "Unable to connect to our booking system. Please check your internet connection and try again.",
                general: "Connection issue detected. Some features may be temporarily unavailable."
            },
            timeout: {
                search: "Search is taking longer than expected. We'll keep trying in the background.",
                booking: "The booking request is taking longer than usual. Please wait a moment.",
                general: "Request timed out. This might be due to a slow connection."
            },
            service_unavailable: {
                search: "Our search service is temporarily unavailable. Showing cached results instead.",
                booking: "The booking system is currently under maintenance. Please try again in a few minutes.",
                general: "This service is temporarily unavailable. We're working to restore it quickly."
            },
            server_error: {
                search: "We encountered a server issue while searching. Please try again.",
                booking: "There was a problem processing your booking. Please try again or contact support.",
                general: "We're experiencing technical difficulties. Please try again in a moment."
            },
            client_error: {
                authentication: "Please check your login credentials and try again.",
                validation: "Please check the information you've entered and try again.",
                general: "There was an issue with your request. Please review and try again."
            },
            general: {
                search: "Something went wrong with your search. Please try again.",
                booking: "We encountered an issue with your booking. Please try again.",
                general: "Something unexpected happened. Please try again."
            }
        };

        return messages[errorInfo.type]?.[context] || 
               messages[errorInfo.type]?.general || 
               messages.general.general;
    }

    /**
     * Get error severity level
     * @param {Object} errorInfo - Parsed error information
     * @returns {string} Severity level
     */
    getErrorSeverity(errorInfo) {
        const severityMap = {
            network: 'warning',
            timeout: 'info',
            service_unavailable: 'warning',
            server_error: 'error',
            client_error: 'warning',
            general: 'error'
        };

        return severityMap[errorInfo.type] || 'error';
    }

    /**
     * Get available actions for error
     * @param {Object} errorInfo - Parsed error information
     * @param {string} context - Error context
     * @param {Object} options - Action options
     * @returns {Array} Available actions
     */
    getErrorActions(errorInfo, context, options) {
        const actions = [];

        // Retry action for retryable errors
        if (this.shouldRetry(errorInfo, context) && options.retryFunction) {
            actions.push({
                label: 'Try Again',
                action: () => this.handleError(errorInfo, context, options),
                primary: true
            });
        }

        // Refresh page action for critical errors
        if (['server_error', 'service_unavailable'].includes(errorInfo.type)) {
            actions.push({
                label: 'Refresh Page',
                action: () => window.location.reload(),
                secondary: true
            });
        }

        // Contact support action
        if (errorInfo.type === 'server_error' || context === 'booking') {
            actions.push({
                label: 'Contact Support',
                action: () => this.openSupportModal(),
                secondary: true
            });
        }

        return actions;
    }

    /**
     * Create error notification element
     * @param {Object} config - Notification configuration
     * @returns {HTMLElement} Notification element
     */
    createErrorNotification(config) {
        const notification = document.createElement('div');
        notification.className = `error-notification error-${config.type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        const content = `
            <div class="error-content">
                <div class="error-icon">
                    <i class="fas ${this.getErrorIcon(config.type)}"></i>
                </div>
                <div class="error-message">
                    <p>${config.message}</p>
                </div>
                <div class="error-actions">
                    ${config.actions.map((action, index) => `
                        <button class="error-btn ${action.primary ? 'primary' : 'secondary'}" 
                                data-action-index="${index}">
                            ${action.label}
                        </button>
                    `).join('')}
                    ${config.dismissible ? `
                        <button class="error-dismiss" onclick="this.closest('.error-notification').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;

        notification.innerHTML = content;
        
        // Add event listeners for action buttons
        config.actions.forEach((action, index) => {
            const button = notification.querySelector(`[data-action-index="${index}"]`);
            if (button && typeof action.action === 'function') {
                button.addEventListener('click', action.action);
            }
        });
        
        return notification;
    }

    /**
     * Get icon for error type
     * @param {string} type - Error type
     * @returns {string} Font Awesome icon class
     */
    getErrorIcon(type) {
        const icons = {
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-exclamation-circle';
    }

    /**
     * Display notification to user
     * @param {HTMLElement} notification - Notification element
     */
    displayNotification(notification) {
        let container = document.getElementById('error-notifications');
        
        if (!container) {
            container = document.createElement('div');
            container.id = 'error-notifications';
            container.className = 'error-notifications-container';
            document.body.appendChild(container);
        }

        container.appendChild(notification);

        // Auto-remove after delay for non-persistent notifications
        if (!notification.classList.contains('persistent')) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 8000);
        }

        // Animate in
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }

    /**
     * Show retry notification
     * @param {number} attempt - Current attempt number
     * @param {number} delay - Delay before retry
     */
    showRetryNotification(attempt, delay) {
        const notification = document.createElement('div');
        notification.id = 'retry-notification';
        notification.className = 'retry-notification';
        notification.innerHTML = `
            <div class="retry-content">
                <div class="retry-spinner">
                    <i class="fas fa-sync-alt fa-spin"></i>
                </div>
                <div class="retry-message">
                    <p>Retrying... (Attempt ${attempt}/${this.maxRetries})</p>
                    <div class="retry-progress">
                        <div class="retry-progress-bar" style="animation-duration: ${delay}ms"></div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing retry notification
        this.hideRetryNotification();

        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });
    }

    /**
     * Hide retry notification
     */
    hideRetryNotification() {
        const existing = document.getElementById('retry-notification');
        if (existing) {
            existing.remove();
        }
    }

    /**
     * Show network error notification
     */
    showNetworkError() {
        this.showUserError(
            { type: 'network', message: 'No internet connection' },
            'general',
            { persistent: true, dismissible: false }
        );
    }

    /**
     * Handle network reconnection
     */
    handleNetworkReconnection() {
        // Remove network error notifications
        const networkErrors = document.querySelectorAll('.error-notification.error-warning');
        networkErrors.forEach(error => {
            if (error.textContent.includes('connection') || error.textContent.includes('internet')) {
                error.remove();
            }
        });

        // Show reconnection success
        const notification = this.createErrorNotification({
            message: 'Connection restored! You can now use all features.',
            type: 'info',
            context: 'network',
            actions: [],
            dismissible: true,
            persistent: false
        });

        this.displayNotification(notification);

        // Process any queued errors
        this.processErrorQueue();
    }

    /**
     * Process queued errors after reconnection
     */
    processErrorQueue() {
        while (this.errorQueue.length > 0) {
            const queuedError = this.errorQueue.shift();
            this.handleError(queuedError.error, queuedError.context, queuedError.options);
        }
    }

    /**
     * Open support modal
     */
    openSupportModal() {
        // Implementation would open a support contact modal
        console.log('Opening support modal...');
        // This could integrate with existing contact forms or support systems
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error ID
     */
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Log error for debugging
     * @param {Object} errorInfo - Error information
     * @param {string} context - Error context
     * @param {string} errorId - Error ID
     */
    logError(errorInfo, context, errorId) {
        const logData = {
            errorId,
            context,
            type: errorInfo.type,
            message: errorInfo.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            online: this.isOnline
        };

        console.error('Error logged:', logData);
        
        // In production, this could send to error tracking service
        // this.sendToErrorTracking(logData);
    }

    /**
     * Track error for analytics
     * @param {Object} errorInfo - Error information
     * @param {string} context - Error context
     * @param {string} errorId - Error ID
     */
    trackError(errorInfo, context, errorId) {
        // Implementation would send to analytics service
        if (window.gtag) {
            window.gtag('event', 'exception', {
                description: `${context}: ${errorInfo.message}`,
                fatal: errorInfo.type === 'server_error'
            });
        }
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clear all retry attempts
     */
    clearRetryAttempts() {
        this.retryAttempts.clear();
    }

    /**
     * Get current error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            retryAttempts: Object.fromEntries(this.retryAttempts),
            queuedErrors: this.errorQueue.length,
            isOnline: this.isOnline
        };
    }
}

// Create global error handler instance
const errorHandler = new ErrorHandler();

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;

// Convenience functions for common error scenarios
window.handleSearchError = (error, retryFunction) => {
    return errorHandler.handleError(error, 'search', { retryFunction });
};

window.handleBookingError = (error, retryFunction) => {
    return errorHandler.handleError(error, 'booking', { retryFunction });
};

window.handleAuthError = (error) => {
    return errorHandler.handleError(error, 'authentication', { allowRetry: false });
};

window.handleValidationError = (error) => {
    return errorHandler.handleError(error, 'validation', { allowRetry: false });
};

export default errorHandler;