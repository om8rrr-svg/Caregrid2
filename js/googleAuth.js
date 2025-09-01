/**
 * Google OAuth Integration Module
 * Handles Google Sign-In for web applications
 */

class GoogleAuthService {
    constructor() {
        this.clientId = null;
        this.isLoaded = false;
        this.loadPromise = null;
        this.gapi = null;
        this.auth2 = null;
        this.demoMode = false;
    }

    /**
     * Initialize Google Auth with client ID
     * @param {string} clientId - Google OAuth client ID
     */
    async init(clientId) {
        if (this.isLoaded) {
            return true;
        }

        // Handle development mode
        if (clientId === 'demo-mode' || window.DEVELOPMENT_MODE) {
            console.log('Google Auth running in demo mode');
            this.isLoaded = true;
            this.demoMode = true;
            return true;
        }

        if (!clientId) {
            console.error('Google OAuth client ID is required');
            // Fall back to demo mode
            console.log('Falling back to demo mode');
            this.isLoaded = true;
            this.demoMode = true;
            return true;
        }

        this.clientId = clientId;
        
        if (this.loadPromise) {
            return this.loadPromise;
        }

        this.loadPromise = this.loadGoogleScript();
        return this.loadPromise;
    }

    /**
     * Load Google API script dynamically
     * @returns {Promise<boolean>}
     */
    loadGoogleScript() {
        return new Promise((resolve, reject) => {
            // Check if script is already loaded
            if (window.gapi) {
                this.initializeGapi().then(resolve).catch(reject);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api:client.js';
            script.async = true;
            script.defer = true;

            script.onload = () => {
                this.initializeGapi().then(resolve).catch(reject);
            };

            script.onerror = () => {
                console.error('Failed to load Google API script');
                reject(new Error('Failed to load Google API'));
            };

            document.head.appendChild(script);
        });
    }

    /**
     * Initialize Google API and Auth2
     * @returns {Promise<boolean>}
     */
    async initializeGapi() {
        return new Promise((resolve, reject) => {
            window.gapi.load('auth2', () => {
                window.gapi.auth2.init({
                    client_id: this.clientId
                }).then(() => {
                    this.gapi = window.gapi;
                    this.auth2 = window.gapi.auth2.getAuthInstance();
                    this.isLoaded = true;
                    resolve(true);
                }).catch(error => {
                    console.error('Google Auth2 initialization failed:', error);
                    // Fall back to demo mode on error
                    console.log('Falling back to demo mode');
                    this.isLoaded = true;
                    this.demoMode = true;
                    resolve(true);
                });
            });
        });
    }

    /**
     * Sign in with Google
     * @returns {Promise<Object>} User profile and ID token
     */
    async signIn() {
        if (!this.isLoaded) {
            throw new Error('Google Auth not loaded. Call init() first.');
        }

        // Demo mode simulation
        if (this.demoMode) {
            console.log('Demo mode: Simulating Google sign-in');
            return {
                id: 'demo-user-123',
                name: 'Demo User',
                email: 'demo@example.com',
                picture: 'https://via.placeholder.com/96x96',
                idToken: 'demo-token-' + Date.now()
            };
        }

        try {
            const googleUser = await this.auth2.signIn();
            const profile = googleUser.getBasicProfile();
            const idToken = googleUser.getAuthResponse().id_token;

            return {
                id: profile.getId(),
                name: profile.getName(),
                email: profile.getEmail(),
                picture: profile.getImageUrl(),
                idToken: idToken
            };
        } catch (error) {
            console.error('Google sign-in failed:', error);
            throw new Error('Google sign-in failed');
        }
    }

    /**
     * Sign out from Google
     * @returns {Promise<void>}
     */
    async signOut() {
        if (!this.isLoaded) {
            return;
        }

        try {
            await this.auth2.signOut();
        } catch (error) {
            console.error('Google sign-out failed:', error);
        }
    }

    /**
     * Check if user is currently signed in
     * @returns {boolean}
     */
    isSignedIn() {
        if (!this.isLoaded) {
            return false;
        }
        
        // Demo mode always returns false for signed in status
        if (this.demoMode) {
            return false;
        }
        
        return this.auth2.isSignedIn.get();
    }

    /**
     * Get current user profile
     * @returns {Object|null}
     */
    getCurrentUser() {
        if (!this.isLoaded || !this.isSignedIn()) {
            return null;
        }

        const googleUser = this.auth2.currentUser.get();
        const profile = googleUser.getBasicProfile();
        const idToken = googleUser.getAuthResponse().id_token;

        return {
            id: profile.getId(),
            name: profile.getName(),
            email: profile.getEmail(),
            picture: profile.getImageUrl(),
            idToken: idToken
        };
    }

    /**
     * Authenticate with backend using Google ID token
     * @param {string} idToken - Google ID token
     * @param {string} recaptchaToken - reCAPTCHA token
     * @returns {Promise<Object>} Authentication result
     */
    async authenticateWithBackend(idToken, recaptchaToken) {
        try {
            const response = await fetch('/api/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idToken: idToken,
                    recaptchaToken: recaptchaToken
                })
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Authentication failed');
            }

            return result.data;
        } catch (error) {
            console.error('Backend authentication error:', error);
            throw error;
        }
    }

    /**
     * Complete Google sign-in flow with reCAPTCHA
     * @returns {Promise<Object>} Authentication result
     */
    async signInWithRecaptcha() {
        try {
            // Demo mode simulation
            if (this.demoMode) {
                console.log('Demo mode: Simulating Google sign-in with reCAPTCHA');
                
                // Simulate delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                const demoUser = {
                    id: 'demo-google-user-' + Date.now(),
                    firstName: 'Demo',
                    lastName: 'User',
                    email: 'demo.google@example.com',
                    name: 'Demo User',
                    picture: 'https://via.placeholder.com/96x96',
                    provider: 'google'
                };
                
                const demoTokens = {
                    accessToken: 'demo-access-token-' + Date.now(),
                    refreshToken: 'demo-refresh-token-' + Date.now()
                };
                
                return {
                    user: demoUser,
                    tokens: demoTokens,
                    googleProfile: demoUser
                };
            }
            
            // First, verify reCAPTCHA
            if (!window.recaptchaService) {
                throw new Error('reCAPTCHA service not available');
            }

            const recaptchaResult = await window.recaptchaService.executeAndVerify('google_signin');
            
            if (!recaptchaResult.success) {
                throw new Error('reCAPTCHA verification failed');
            }

            // Then, sign in with Google
            const googleUser = await this.signIn();
            
            // Finally, authenticate with backend
            const authResult = await this.authenticateWithBackend(
                googleUser.idToken, 
                recaptchaResult.token
            );

            return {
                user: authResult.user,
                tokens: authResult.tokens,
                googleProfile: googleUser
            };
        } catch (error) {
            console.error('Google sign-in with reCAPTCHA failed:', error);
            throw error;
        }
    }

    /**
     * Render Google Sign-In button
     * @param {string} elementId - ID of element to render button in
     * @param {Object} options - Button options
     */
    renderSignInButton(elementId, options = {}) {
        if (!this.isLoaded) {
            console.error('Google Auth not loaded');
            return;
        }

        const defaultOptions = {
            scope: 'profile email',
            width: 240,
            height: 50,
            longtitle: true,
            theme: 'dark',
            onsuccess: this.onSignInSuccess.bind(this),
            onfailure: this.onSignInFailure.bind(this)
        };

        const buttonOptions = { ...defaultOptions, ...options };

        this.gapi.signin2.render(elementId, buttonOptions);
    }

    /**
     * Default success handler for sign-in button
     * @param {Object} googleUser - Google user object
     */
    async onSignInSuccess(googleUser) {
        try {
            const profile = googleUser.getBasicProfile();
            const idToken = googleUser.getAuthResponse().id_token;

            console.log('Google sign-in successful:', {
                name: profile.getName(),
                email: profile.getEmail()
            });

            // Trigger custom event
            const event = new CustomEvent('googleSignInSuccess', {
                detail: {
                    id: profile.getId(),
                    name: profile.getName(),
                    email: profile.getEmail(),
                    picture: profile.getImageUrl(),
                    idToken: idToken
                }
            });
            document.dispatchEvent(event);
        } catch (error) {
            console.error('Sign-in success handler error:', error);
        }
    }

    /**
     * Default failure handler for sign-in button
     * @param {Object} error - Error object
     */
    onSignInFailure(error) {
        console.error('Google sign-in failed:', error);
        
        // Trigger custom event
        const event = new CustomEvent('googleSignInFailure', {
            detail: { error }
        });
        document.dispatchEvent(event);
    }

    /**
     * Create a custom Google Sign-In button
     * @param {HTMLElement} button - Button element
     * @param {Function} onSuccess - Success callback
     * @param {Function} onError - Error callback
     */
    attachToButton(button, onSuccess, onError) {
        if (!button) {
            console.error('Button element is required');
            return;
        }

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            
            try {
                button.disabled = true;
                const originalText = button.textContent;
                button.textContent = 'Signing in...';

                const result = await this.signInWithRecaptcha();
                
                if (onSuccess) {
                    onSuccess(result);
                }
            } catch (error) {
                if (onError) {
                    onError(error);
                } else {
                    console.error('Google sign-in error:', error);
                }
            } finally {
                button.disabled = false;
                button.textContent = button.getAttribute('data-original-text') || 'Sign in with Google';
            }
        });

        // Store original text
        button.setAttribute('data-original-text', button.textContent);
    }
}

// Create global instance
window.googleAuthService = new GoogleAuthService();

// Auto-initialize if client ID is available
if (window.GOOGLE_CLIENT_ID) {
    window.googleAuthService.init(window.GOOGLE_CLIENT_ID).then(() => {
        console.log('Google Auth initialized successfully');
    }).catch(error => {
        console.error('Google Auth initialization failed:', error);
    });
}

export default GoogleAuthService;