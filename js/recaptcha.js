/**
 * Google reCAPTCHA Integration Module
 * Handles reCAPTCHA v2 and v3 loading, execution, and validation
 */

class RecaptchaService {
    constructor() {
        this.siteKey = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.demoMode = false;
        this.version = 'v2'; // Default to v2 for visual verification
        this.widgetId = null;
    }

    /**
     * Initialize reCAPTCHA with site key
     * @param {string} siteKey - reCAPTCHA site key
     * @param {string} version - reCAPTCHA version ('v2' or 'v3')
     */
    async init(siteKey, version = 'v2') {
        if (this.isLoaded) {
            return true;
        }

        this.version = version;

        // Handle demo mode
        if (siteKey === 'demo-mode' || window.DEVELOPMENT_MODE) {
            console.log('reCAPTCHA running in demo mode');
            this.isLoaded = true;
            this.demoMode = true;
            return true;
        }

        if (!siteKey) {
            console.error('reCAPTCHA site key is required');
            // Fall back to demo mode
            console.log('Falling back to reCAPTCHA demo mode');
            this.isLoaded = true;
            this.demoMode = true;
            return true;
        }

        this.siteKey = siteKey;

        if (this.loadPromise) {
            return this.loadPromise;
        }

        try {
            this.loadPromise = this.loadRecaptchaScript();
            await this.loadPromise;
            console.log(`reCAPTCHA ${this.version} initialized successfully`);
            return true;
        } catch (error) {
            console.error('reCAPTCHA initialization failed:', error);
            // Fall back to demo mode
            console.log('Falling back to reCAPTCHA demo mode');
            this.isLoaded = true;
            this.demoMode = true;
            return true;
        }
    }

    /**
     * Load reCAPTCHA script dynamically
     * @returns {Promise<boolean>}
     */
    loadRecaptchaScript() {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (window.grecaptcha) {
                this.isLoaded = true;
                resolve(true);
                return;
            }

            const script = document.createElement('script');
            
            if (this.version === 'v3') {
                script.src = `https://www.google.com/recaptcha/api.js?render=${this.siteKey}`;
            } else {
                // v2 - load without render parameter for explicit rendering
                script.src = 'https://www.google.com/recaptcha/api.js';
            }
            
            script.async = true;
            script.defer = true;

            script.onload = () => {
                // Wait for grecaptcha to be ready
                const checkReady = () => {
                    if (window.grecaptcha && window.grecaptcha.ready) {
                        window.grecaptcha.ready(() => {
                            this.isLoaded = true;
                            resolve(true);
                        });
                    } else {
                        setTimeout(checkReady, 100);
                    }
                };
                checkReady();
            };

            script.onerror = () => {
                console.error('Failed to load reCAPTCHA script');
                reject(new Error('Failed to load reCAPTCHA'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Render reCAPTCHA v2 widget (visible or invisible)
     * @param {string|HTMLElement} container - Container element or ID
     * @param {Object} options - reCAPTCHA options
     * @returns {number} Widget ID
     */
    renderV2(container, options = {}) {
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: rendering demo widget');
            const element = typeof container === 'string' ? document.getElementById(container) : container;
            if (element) {
                element.innerHTML = '<div style="border: 2px dashed #ccc; padding: 20px; text-align: center; background: #f9f9f9;">Demo reCAPTCHA Widget</div>';
            }
            return 'demo-widget-id';
        }

        if (!this.isLoaded || this.version !== 'v2') {
            throw new Error('reCAPTCHA v2 not initialized');
        }

        const defaultOptions = {
            sitekey: this.siteKey,
            theme: 'light',
            size: 'invisible', // Use invisible reCAPTCHA by default
            ...options
        };

        this.widgetId = window.grecaptcha.render(container, defaultOptions);
        return this.widgetId;
    }

    /**
     * Execute invisible reCAPTCHA v2
     * @param {number} widgetId - Widget ID (optional, uses stored widgetId if not provided)
     * @returns {Promise<string>} reCAPTCHA response token
     */
    async executeV2(widgetId = null) {
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: returning demo response');
            return 'demo-response-' + Date.now();
        }

        if (!this.isLoaded || this.version !== 'v2') {
            throw new Error('reCAPTCHA v2 not initialized');
        }

        const id = widgetId || this.widgetId;
        return new Promise((resolve, reject) => {
            try {
                window.grecaptcha.execute(id);
                // Set up a callback to get the response
                const checkResponse = () => {
                    const response = window.grecaptcha.getResponse(id);
                    if (response) {
                        resolve(response);
                    } else {
                        setTimeout(checkResponse, 100);
                    }
                };
                setTimeout(checkResponse, 100);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Get reCAPTCHA v2 response token
     * @param {number} widgetId - Widget ID (optional, uses stored widgetId if not provided)
     * @returns {string} reCAPTCHA response token
     */
    getResponseV2(widgetId = null) {
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: returning demo response');
            return 'demo-response-' + Date.now();
        }

        if (!this.isLoaded || this.version !== 'v2') {
            throw new Error('reCAPTCHA v2 not initialized');
        }

        const id = widgetId || this.widgetId;
        return window.grecaptcha.getResponse(id);
    }

    /**
     * Reset reCAPTCHA v2 widget
     * @param {number} widgetId - Widget ID (optional, uses stored widgetId if not provided)
     */
    resetV2(widgetId = null) {
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: resetting demo widget');
            return;
        }

        if (!this.isLoaded || this.version !== 'v2') {
            throw new Error('reCAPTCHA v2 not initialized');
        }

        const id = widgetId || this.widgetId;
        window.grecaptcha.reset(id);
    }

    /**
     * Execute reCAPTCHA and get token with retry mechanism
     * @param {string} action - Action name for reCAPTCHA v3
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<string>} reCAPTCHA token
     */
    async execute(action = 'submit', retryCount = 0) {
        const maxRetries = 3;
        
        if (!this.isLoaded) {
            // Try to reinitialize if not loaded
            if (retryCount === 0 && this.siteKey) {
                console.log('reCAPTCHA not loaded, attempting to reinitialize...');
                try {
                    await this.init(this.siteKey, this.version);
                } catch (initError) {
                    console.error('reCAPTCHA reinitialization failed:', initError);
                    throw new Error('reCAPTCHA service unavailable. Please refresh the page.');
                }
            } else {
                throw new Error('reCAPTCHA not loaded. Call init() first.');
            }
        }

        // Return demo token in demo mode
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: returning demo token');
            return 'demo-token-' + Date.now();
        }

        if (!window.grecaptcha) {
            if (retryCount < maxRetries) {
                console.log(`reCAPTCHA not available, retrying... (${retryCount + 1}/${maxRetries})`);
                await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                return this.execute(action, retryCount + 1);
            }
            throw new Error('reCAPTCHA service is currently unavailable. Please try again later.');
        }

        if (this.version === 'v2') {
            // For v2 invisible, execute and get response
            return this.executeV2WithRetry(retryCount);
        }

        try {
            const token = await Promise.race([
                window.grecaptcha.execute(this.siteKey, { action }),
                this.createTimeout(10000, 'reCAPTCHA execution timeout')
            ]);
            
            if (!token) {
                throw new Error('Empty reCAPTCHA token received');
            }
            
            return token;
        } catch (error) {
            console.error('reCAPTCHA execution failed:', error);
            
            if (retryCount < maxRetries && this.shouldRetryExecution(error)) {
                console.log(`Retrying reCAPTCHA execution... (${retryCount + 1}/${maxRetries})`);
                await this.delay(1000 * (retryCount + 1));
                return this.execute(action, retryCount + 1);
            }
            
            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Verify reCAPTCHA token with backend with retry mechanism
     * @param {string} token - reCAPTCHA token
     * @param {string} action - Action name
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<Object>} Verification result
     */
    async verify(token, action = 'submit', retryCount = 0) {
        const maxRetries = 2;
        
        // Always return success in demo mode
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: verification always succeeds');
            return { success: true, score: 0.9, action: action, token: token };
        }
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
            
            const response = await fetch('/api/auth/verify-recaptcha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, action }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            const result = await response.json();
            
            if (!response.ok) {
                const errorMessage = result.message || result.error || 'reCAPTCHA verification failed';
                
                // Check if we should retry based on error type
                if (retryCount < maxRetries && this.shouldRetryVerification(response.status, result)) {
                    console.log(`Retrying reCAPTCHA verification... (${retryCount + 1}/${maxRetries})`);
                    await this.delay(1000 * (retryCount + 1));
                    return this.verify(token, action, retryCount + 1);
                }
                
                throw new Error(errorMessage);
            }

            return { ...result.data, token: token };
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            
            // Handle network errors with retry
            if (retryCount < maxRetries && this.isNetworkError(error)) {
                console.log(`Network error, retrying verification... (${retryCount + 1}/${maxRetries})`);
                await this.delay(2000 * (retryCount + 1));
                return this.verify(token, action, retryCount + 1);
            }
            
            throw new Error(this.getVerificationErrorMessage(error));
        }
    }

    /**
     * Execute and verify reCAPTCHA in one call
     * @param {string} action - Action name
     * @returns {Promise<Object>} Verification result
     */
    async executeAndVerify(action = 'submit') {
        const token = await this.execute(action);
        return this.verify(token, action);
    }

    /**
     * Add reCAPTCHA to a form with enhanced error handling
     * @param {HTMLFormElement} form - Form element
     * @param {string} action - Action name
     * @param {Function} callback - Optional callback after verification
     * @param {Object} options - Configuration options
     */
    async protectForm(form, action = 'submit', callback = null, options = {}) {
        if (!form) {
            console.error('Form element is required');
            return;
        }

        const originalSubmit = form.onsubmit;
        const maxRetries = options.maxRetries || 2;
        let retryCount = 0;
        
        const handleFormSubmission = async (event, isRetry = false) => {
            if (!isRetry) {
                event.preventDefault();
                retryCount = 0;
            }
            
            try {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                const originalText = submitBtn ? submitBtn.textContent : '';
                
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const loadingText = retryCount > 0 ? `Retrying verification... (${retryCount + 1}/${maxRetries + 1})` : 'Verifying security...';
                    submitBtn.textContent = loadingText;
                }

                // Clear any existing error messages
                this.clearErrorMessage(form);

                // Execute reCAPTCHA
                const result = await this.executeAndVerify(action);
                
                if (result.success) {
                    // Add reCAPTCHA token to form data
                    let tokenInput = form.querySelector('input[name="recaptchaToken"]');
                    if (!tokenInput) {
                        tokenInput = document.createElement('input');
                        tokenInput.type = 'hidden';
                        tokenInput.name = 'recaptchaToken';
                        form.appendChild(tokenInput);
                    }
                    tokenInput.value = result.token;

                    // Show success message briefly
                    if (submitBtn) {
                        submitBtn.textContent = 'Verified! Submitting...';
                    }

                    // Call original submit handler or callback after brief delay
                    setTimeout(() => {
                        if (callback) {
                            callback(event, result);
                        } else if (originalSubmit) {
                            originalSubmit.call(form, event);
                        } else {
                            form.submit();
                        }
                    }, 500);
                } else {
                    throw new Error('reCAPTCHA verification failed');
                }
            } catch (error) {
                console.error('Form protection error:', error);
                
                // Check if we should retry
                if (retryCount < maxRetries && this.shouldRetryFormSubmission(error)) {
                    retryCount++;
                    console.log(`Retrying form submission... (${retryCount}/${maxRetries})`);
                    
                    // Show retry message
                    this.showRetryMessage(form, `Security verification failed. Retrying... (${retryCount}/${maxRetries})`);
                    
                    // Wait before retry
                    await this.delay(1000 * retryCount);
                    
                    // Retry the submission
                    return handleFormSubmission(event, true);
                }
                
                // Show error message with user-friendly text
                const userMessage = this.getVerificationErrorMessage(error);
                this.showErrorMessage(form, userMessage);
                
                // Restore submit button
                const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.textContent.includes('Verified!') ? 'Submit' : submitBtn.textContent.replace(/Verifying.*|Retrying.*/, 'Submit');
                }
            }
        };
        
        form.onsubmit = handleFormSubmission;
    }

    /**
     * Check if form submission should be retried
     * @param {Error} error - The error object
     * @returns {boolean} Whether to retry
     */
    shouldRetryFormSubmission(error) {
        const retryableErrors = [
            'timeout',
            'network',
            'connection',
            'unavailable',
            'temporary',
            'rate limit'
        ];
        
        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }

    /**
     * Show retry message to user
     * @param {HTMLElement} form - The form element
     * @param {string} message - The retry message
     */
    showRetryMessage(form, message) {
        this.clearErrorMessage(form);
        
        const retryDiv = document.createElement('div');
        retryDiv.className = 'recaptcha-retry-message';
        retryDiv.style.cssText = `
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            color: #856404;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
            display: flex;
            align-items: center;
        `;
        
        retryDiv.innerHTML = `
            <div style="margin-right: 8px; animation: spin 1s linear infinite;">
                ⟳
            </div>
            <span>${message}</span>
        `;
        
        // Add spin animation if not already present
        if (!document.querySelector('#recaptcha-retry-styles')) {
            const style = document.createElement('style');
            style.id = 'recaptcha-retry-styles';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
        
        form.insertBefore(retryDiv, form.firstChild);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (retryDiv.parentNode) {
                retryDiv.remove();
            }
        }, 3000);
    }

    /**
     * Clear any existing error or retry messages
     * @param {HTMLElement} form - The form element
     */
    clearErrorMessage(form) {
        const existingMessages = form.querySelectorAll('.recaptcha-error, .recaptcha-retry-message, .recaptcha-error-message');
        existingMessages.forEach(msg => msg.remove());
    }

    /**
     * Show error message to user
     * @param {HTMLElement} form - The form element
     * @param {string} message - The error message
     */
    showErrorMessage(form, message) {
        this.clearErrorMessage(form);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'recaptcha-error-message';
        errorDiv.style.cssText = `
            background: #f8d7da;
            border: 1px solid #f5c6cb;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            font-size: 14px;
        `;
        errorDiv.textContent = message;
        
        form.insertBefore(errorDiv, form.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    /**
     * Enhanced executeV2 with retry mechanism
     * @param {number} retryCount - Current retry attempt
     * @returns {Promise<string>} reCAPTCHA response
     */
    async executeV2WithRetry(retryCount = 0) {
        const maxRetries = 3;
        
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: returning demo response');
            return 'demo-response-' + Date.now();
        }

        if (!this.isLoaded || this.version !== 'v2') {
            throw new Error('reCAPTCHA v2 not initialized');
        }

        const id = this.widgetId;
        
        try {
            return await Promise.race([
                new Promise((resolve, reject) => {
                    try {
                        window.grecaptcha.execute(id);
                        // Set up a callback to get the response
                        const checkResponse = () => {
                            const response = window.grecaptcha.getResponse(id);
                            if (response) {
                                resolve(response);
                            } else {
                                setTimeout(checkResponse, 100);
                            }
                        };
                        setTimeout(checkResponse, 100);
                    } catch (error) {
                        reject(error);
                    }
                }),
                this.createTimeout(15000, 'reCAPTCHA v2 execution timeout')
            ]);
        } catch (error) {
            console.error('reCAPTCHA v2 execution failed:', error);
            
            if (retryCount < maxRetries && this.shouldRetryExecution(error)) {
                console.log(`Retrying reCAPTCHA v2 execution... (${retryCount + 1}/${maxRetries})`);
                // Reset the widget before retry
                try {
                    window.grecaptcha.reset(id);
                } catch (resetError) {
                    console.warn('Failed to reset reCAPTCHA widget:', resetError);
                }
                await this.delay(1000 * (retryCount + 1));
                return this.executeV2WithRetry(retryCount + 1);
            }
            
            throw new Error(this.getErrorMessage(error));
        }
    }

    /**
     * Create a timeout promise
     * @param {number} ms - Timeout in milliseconds
     * @param {string} message - Error message
     * @returns {Promise} Timeout promise
     */
    createTimeout(ms, message) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        });
    }

    /**
     * Delay execution
     * @param {number} ms - Delay in milliseconds
     * @returns {Promise} Delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if error should trigger a retry for execution
     * @param {Error} error - The error object
     * @returns {boolean} Whether to retry
     */
    shouldRetryExecution(error) {
        const retryableErrors = [
            'timeout',
            'network',
            'connection',
            'unavailable',
            'temporary'
        ];
        
        const errorMessage = error.message.toLowerCase();
        return retryableErrors.some(keyword => errorMessage.includes(keyword));
    }

    /**
     * Check if error should trigger a retry for verification
     * @param {number} status - HTTP status code
     * @param {Object} result - Response result
     * @returns {boolean} Whether to retry
     */
    shouldRetryVerification(status, result) {
        // Retry on server errors or rate limiting
        if (status >= 500 || status === 429) {
            return true;
        }
        
        // Retry on specific error codes
        const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'TEMPORARY_ERROR'];
        return retryableCodes.includes(result.code);
    }

    /**
     * Check if error is a network error
     * @param {Error} error - The error object
     * @returns {boolean} Whether it's a network error
     */
    isNetworkError(error) {
        return error.name === 'AbortError' || 
               error.message.includes('fetch') ||
               error.message.includes('network') ||
               error.message.includes('connection');
    }

    /**
     * Get user-friendly error message for execution errors
     * @param {Error} error - The error object
     * @returns {string} User-friendly error message
     */
    getErrorMessage(error) {
        if (error.message.includes('timeout')) {
            return 'Security verification timed out. Please try again.';
        }
        if (error.message.includes('network') || error.message.includes('connection')) {
            return 'Connection issue during security verification. Please check your internet connection.';
        }
        if (error.message.includes('unavailable')) {
            return 'Security verification service is temporarily unavailable. Please try again later.';
        }
        return 'Security verification failed. Please try again.';
    }

    /**
     * Get user-friendly error message for verification errors
     * @param {Error} error - The error object
     * @returns {string} User-friendly error message
     */
    getVerificationErrorMessage(error) {
        if (error.name === 'AbortError') {
            return 'Security verification timed out. Please try again.';
        }
        if (this.isNetworkError(error)) {
            return 'Network error during security verification. Please check your connection.';
        }
        return 'Security verification failed. Please try again.';
    }

    /**
     * Add reCAPTCHA badge styling
     */
    addBadgeStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .grecaptcha-badge {
                visibility: visible !important;
                opacity: 0.8;
                transition: opacity 0.3s;
            }
            .grecaptcha-badge:hover {
                opacity: 1;
            }
            @media (max-width: 768px) {
                .grecaptcha-badge {
                    transform: scale(0.8);
                    transform-origin: bottom right;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.recaptchaService = new RecaptchaService();

// Auto-initialize if site key is available
if (window.RECAPTCHA_SITE_KEY) {
    window.recaptchaService.init(window.RECAPTCHA_SITE_KEY).then(() => {
        console.log('reCAPTCHA initialized successfully');
        window.recaptchaService.addBadgeStyles();
    }).catch(error => {
        console.error('reCAPTCHA initialization failed:', error);
    });
}

export default RecaptchaService;