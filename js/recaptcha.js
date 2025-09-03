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
     * Execute reCAPTCHA and get token
     * @param {string} action - Action name for reCAPTCHA v3
     * @returns {Promise<string>} reCAPTCHA token
     */
    async execute(action = 'submit') {
        if (!this.isLoaded) {
            throw new Error('reCAPTCHA not loaded. Call init() first.');
        }

        // Return demo token in demo mode
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: returning demo token');
            return 'demo-token-' + Date.now();
        }

        if (!window.grecaptcha) {
            throw new Error('reCAPTCHA not available');
        }

        if (this.version === 'v2') {
            // For v2 invisible, execute and get response
            return this.executeV2();
        }

        try {
            const token = await window.grecaptcha.execute(this.siteKey, { action });
            return token;
        } catch (error) {
            console.error('reCAPTCHA execution failed:', error);
            throw new Error('reCAPTCHA execution failed');
        }
    }

    /**
     * Verify reCAPTCHA token with backend
     * @param {string} token - reCAPTCHA token
     * @param {string} action - Action name
     * @returns {Promise<Object>} Verification result
     */
    async verify(token, action = 'submit') {
        // Always return success in demo mode
        if (this.demoMode) {
            console.log('reCAPTCHA demo mode: verification always succeeds');
            return { success: true, score: 0.9, action: action };
        }
        
        try {
            const response = await fetch('/api/auth/verify-recaptcha', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token, action })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'reCAPTCHA verification failed');
            }

            return result.data;
        } catch (error) {
            console.error('reCAPTCHA verification error:', error);
            throw error;
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
     * Add reCAPTCHA to a form
     * @param {HTMLFormElement} form - Form element
     * @param {string} action - Action name
     * @param {Function} callback - Optional callback after verification
     */
    async protectForm(form, action = 'submit', callback = null) {
        if (!form) {
            console.error('Form element is required');
            return;
        }

        const originalSubmit = form.onsubmit;
        
        form.onsubmit = async (event) => {
            event.preventDefault();
            
            try {
                // Show loading state
                const submitBtn = form.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const originalText = submitBtn.textContent;
                    submitBtn.textContent = 'Verifying...';
                    
                    // Restore button after 10 seconds max
                    setTimeout(() => {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalText;
                    }, 10000);
                }

                // Execute reCAPTCHA
                const result = await this.executeAndVerify(action);
                
                if (result.success) {
                    // Add reCAPTCHA token to form data
                    const tokenInput = document.createElement('input');
                    tokenInput.type = 'hidden';
                    tokenInput.name = 'recaptchaToken';
                    tokenInput.value = result.token;
                    form.appendChild(tokenInput);

                    // Call original submit handler or callback
                    if (callback) {
                        callback(event, result);
                    } else if (originalSubmit) {
                        originalSubmit.call(form, event);
                    } else {
                        form.submit();
                    }
                } else {
                    throw new Error('reCAPTCHA verification failed');
                }
            } catch (error) {
                console.error('Form protection error:', error);
                
                // Show error message
                const errorDiv = form.querySelector('.recaptcha-error') || document.createElement('div');
                errorDiv.className = 'recaptcha-error alert alert-danger';
                errorDiv.textContent = 'Security verification failed. Please try again.';
                
                if (!form.querySelector('.recaptcha-error')) {
                    form.appendChild(errorDiv);
                }
                
                // Hide error after 5 seconds
                setTimeout(() => {
                    errorDiv.remove();
                }, 5000);
            }
        };
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