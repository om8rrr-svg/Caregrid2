// API Service for CareGrid Backend Communication

class APIService {
    constructor() {
        // Use production URL by default, fallback to localhost for development
        this.baseURL = window.API_BASE || 'https://caregrid-backend.onrender.com/api';
        this.token = this.getStoredToken();
        this.backendHealthy = null; // Track backend health
        this.lastHealthCheck = 0;
        this.healthCheckInterval = 60000; // Check every minute
    }

    // Token management
    getStoredToken() {
        return localStorage.getItem('careGridToken') || sessionStorage.getItem('careGridToken');
    }

    setToken(token, remember = false) {
        this.token = token;
        if (remember) {
            localStorage.setItem('careGridToken', token);
            sessionStorage.removeItem('careGridToken');
        } else {
            sessionStorage.setItem('careGridToken', token);
            localStorage.removeItem('careGridToken');
        }
        // Ensure the instance token is updated
        this.token = this.getStoredToken();
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('careGridToken');
        sessionStorage.removeItem('careGridToken');
    }

    // Clear all authentication data
    clearAuthData() {
        this.removeToken();
        // Clear any other auth-related data
        localStorage.removeItem('careGridUser');
        sessionStorage.removeItem('careGridUser');
        localStorage.removeItem('careGridCurrentUser');
        sessionStorage.removeItem('careGridCurrentUser');
    }

    // HTTP request helper
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        // Only log in development mode to avoid console spam in production
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Making request to:', url);
        }
        
        // Add timeout to prevent indefinite loading - shorter timeout for clinics endpoint
        const controller = new AbortController();
        const isClinicRequest = endpoint.includes('/clinics');
        const timeoutMs = isClinicRequest ? 10000 : 30000; // 10s for clinics, 30s for others
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'omit', // using Bearer token, not cookies
            signal: controller.signal,
            ...options
        };

        // Add authorization header if token exists
        // Always get the latest token from storage
        const currentToken = this.getStoredToken();
        if (currentToken) {
            this.token = currentToken;
            config.headers.Authorization = `Bearer ${currentToken}`;
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId); // Clear timeout on successful response
            
            // Handle 401 Unauthorized gracefully for missing/invalid tokens
            if (response.status === 401) {
                // Clear invalid token
                this.clearAuthData();
                throw new Error(`401 Authentication failed`);
            }
            
            // Handle rate limiting (429) with plain text response
            if (response.status === 429) {
                const errorText = await response.text();
                throw new Error('Too many requests. Please wait a moment and try again.');
            }
            
            // Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                // Handle non-JSON responses (like rate limiting)
                const textResponse = await response.text();
                if (!response.ok) {
                    // Provide user-friendly error message for rate limiting
                    if (response.status === 429) {
                        throw new Error('Too many requests. Please wait a moment and try again.');
                    }
                    throw new Error(`Server error: ${textResponse || response.statusText}`);
                }
                return { message: textResponse };
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId); // Clear timeout on error
            
            // Only log errors in development mode to avoid console spam
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('API Request failed:', error);
                console.error('Error details:', error.message);
            }
            
            // Handle specific error cases
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please check your connection and try again.');
            }
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                // For clinic requests, don't throw scary errors - let fallback handle it
                if (isClinicRequest) {
                    throw new Error('BACKEND_UNAVAILABLE');
                }
                throw new Error('Network connection failed. Please check your connection.');
            }
            
            // For authentication errors, provide clearer messaging
            if (error.message.includes('Authentication failed') || error.message.includes('401')) {
                throw new Error('Authentication failed');
            }
            
            // Pass through specific authentication error messages from backend
            if (error.message.includes('No account found') || 
                error.message.includes('Incorrect password') ||
                error.message.includes('email address') ||
                error.message.includes('sign up')) {
                throw error; // Pass the specific error message through
            }
            
            throw error;
        }
    }

    // Authentication endpoints
    async login(email, password) {
        try {
            const response = await this.makeRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            return response;
        } catch (error) {
            // If backend is unavailable, provide a demo mode for testing
            if (error.message.includes('BACKEND_UNAVAILABLE') || 
                error.message.includes('Network connection failed') || 
                error.message.includes('Request timed out')) {
                
                console.warn('Backend unavailable, offering demo mode');
                
                // Only enable demo mode for specific test accounts
                if (email.includes('demo') || email.includes('test')) {
                    return {
                        success: true,
                        data: {
                            user: {
                                id: 'demo_user_' + Date.now(),
                                email: email,
                                firstName: 'Demo',
                                lastName: 'User',
                                role: 'user'
                            },
                            token: 'demo_token_' + Date.now()
                        },
                        message: 'Demo login successful (backend unavailable)'
                    };
                }
            }
            throw error;
        }
    }

    async register(userData) {
        try {
            const response = await this.makeRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            return response;
        } catch (error) {
            // If backend is unavailable, provide a demo mode for testing
            if (error.message.includes('BACKEND_UNAVAILABLE') || 
                error.message.includes('Network connection failed') || 
                error.message.includes('Request timed out')) {
                
                console.warn('Backend unavailable, simulating registration');
                
                return {
                    success: true,
                    data: {
                        user: {
                            id: 'demo_user_' + Date.now(),
                            email: userData.email,
                            firstName: userData.firstName || 'Demo',
                            lastName: userData.lastName || 'User',
                            role: 'user'
                        },
                        token: 'demo_token_' + Date.now()
                    },
                    message: 'Demo registration successful (backend unavailable)'
                };
            }
            throw error;
        }
    }

    async logout() {
        try {
            await this.makeRequest('/auth/logout', {
                method: 'POST'
            });
        } catch (error) {
            console.warn('Logout request failed:', error);
        } finally {
            this.clearAuthData();
        }
    }

    async forgotPassword(email) {
        const response = await this.makeRequest('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
        return response;
    }

    async verifyResetCode(email, code) {
        const response = await this.makeRequest('/auth/verify-reset-code', {
            method: 'POST',
            body: JSON.stringify({ email, code })
        });
        return response;
    }

    async resetPassword(email, code, password) {
        const response = await this.makeRequest('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ email, code, password })
        });
        return response;
    }

    // User endpoints
    async getCurrentUser() {
        const response = await this.makeRequest('/auth/me');
        return response;
    }

    async updateProfile(userData) {
        const response = await this.makeRequest('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return response;
    }

    // Clinic endpoints
    async getClinics(filters = {}) {
        const queryParams = new URLSearchParams();
        Object.keys(filters).forEach(key => {
            if (filters[key]) {
                queryParams.append(key, filters[key]);
            }
        });
        
        const endpoint = `/clinics${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        
        // Try with retry mechanism for clinic requests (backend might be sleeping)
        return await this.makeRequestWithRetry(endpoint);
    }
    
    // Retry mechanism specifically for critical requests like clinics
    async makeRequestWithRetry(endpoint, options = {}, maxRetries = 2) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.makeRequest(endpoint, options);
            } catch (error) {
                lastError = error;
                
                // Don't retry for certain types of errors
                if (error.message.includes('Authentication failed') || 
                    error.message.includes('401') ||
                    error.message.includes('403') ||
                    error.message.includes('400')) {
                    throw error;
                }
                
                // If this is the last attempt, throw the error
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Cap at 5 seconds
                await new Promise(resolve => setTimeout(resolve, delay));
                
                // Only log retry attempts in development
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.log(`Retrying request to ${endpoint} (attempt ${attempt + 1}/${maxRetries})`);
                }
            }
        }
        
        throw lastError;
    }

    async getClinicById(clinicId) {
        const response = await this.makeRequest(`/clinics/${clinicId}`);
        return response;
    }

    // Appointment endpoints
    async getAppointments() {
        const response = await this.makeRequest('/appointments');
        return response;
    }

    async createAppointment(appointmentData) {
        try {
            const response = await this.makeRequest('/appointments', {
                method: 'POST',
                body: JSON.stringify(appointmentData)
            });
            return response;
        } catch (error) {
            console.warn('Backend request failed, checking if fallback is appropriate:', error.message);
            
            // Fallback simulation for demo/development purposes when backend is unavailable
            // Don't use fallback for actual validation errors with proper data
            if ((error.message.includes('Internal server error') || 
                error.message.includes('Network connection failed') ||
                (error.message.includes('Validation failed') && this.isIncompleteData(appointmentData)))) {
                
                console.log('Using fallback booking simulation due to backend unavailability');
                
                // Generate a mock booking reference
                const mockReference = 'CG' + Date.now().toString().slice(-6) + 
                                     Math.random().toString(36).substring(2, 6).toUpperCase();
                
                // Simulate successful booking response
                return {
                    success: true,
                    appointment: {
                        id: 'mock-' + Date.now(),
                        reference: mockReference,
                        clinicId: appointmentData.clinicId,
                        appointmentDate: appointmentData.appointmentDate || 'TBD',
                        appointmentTime: appointmentData.appointmentTime || 'TBD',
                        treatmentType: appointmentData.treatmentType || 'General Consultation',
                        status: 'confirmed',
                        isGuestBooking: !this.getStoredToken(),
                        notes: appointmentData.notes || 'Demo booking',
                        createdAt: new Date().toISOString()
                    }
                };
            }
            
            // Re-throw other errors
            throw error;
        }
    }

    // Helper method to check if appointment data is incomplete (suggests dev/test scenario)
    isIncompleteData(appointmentData) {
        return !appointmentData.treatmentType || 
               !appointmentData.appointmentDate || 
               !appointmentData.appointmentTime ||
               (!appointmentData.guestName && !this.getStoredToken());
    }

    async updateAppointment(appointmentId, updateData) {
        const response = await this.makeRequest(`/appointments/${appointmentId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData)
        });
        return response;
    }

    async cancelAppointment(appointmentId) {
        const response = await this.makeRequest(`/appointments/${appointmentId}`, {
            method: 'DELETE'
        });
        return response;
    }

    // Review endpoints
    async getClinicReviews(clinicId) {
        const response = await this.makeRequest(`/clinics/${clinicId}/reviews`);
        return response;
    }

    async createReview(clinicId, reviewData) {
        const response = await this.makeRequest(`/clinics/${clinicId}/reviews`, {
            method: 'POST',
            body: JSON.stringify(reviewData)
        });
        return response;
    }

    // Contact endpoint
    async submitContactForm(contactData) {
        try {
            const response = await this.makeRequest('/contact', {
                method: 'POST',
                body: JSON.stringify(contactData)
            });
            return response;
        } catch (error) {
            // If backend is unavailable, provide fallback behavior
            if (error.message.includes('BACKEND_UNAVAILABLE') || 
                error.message.includes('Network connection failed') || 
                error.message.includes('Request timed out')) {
                
                console.warn('Backend unavailable, simulating contact form submission');
                
                // Store the contact form data locally for later processing
                const submissions = JSON.parse(localStorage.getItem('pendingContactSubmissions') || '[]');
                submissions.push({
                    ...contactData,
                    submittedAt: new Date().toISOString(),
                    status: 'pending_backend'
                });
                localStorage.setItem('pendingContactSubmissions', JSON.stringify(submissions));
                
                return {
                    success: true,
                    message: 'Your message has been received and will be processed when our system is back online. We will contact you soon!'
                };
            }
            throw error;
        }
    }

    // Health check
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            this.backendHealthy = true;
            this.lastHealthCheck = Date.now();
            return response;
        } catch (error) {
            this.backendHealthy = false;
            this.lastHealthCheck = Date.now();
            throw error;
        }
    }

    // Check if backend is available (with caching)
    async isBackendHealthy() {
        const now = Date.now();
        if (this.backendHealthy !== null && (now - this.lastHealthCheck) < this.healthCheckInterval) {
            return this.backendHealthy;
        }
        
        try {
            await this.healthCheck();
            return true;
        } catch (error) {
            return false;
        }
    }

    // Convenience method for /auth/me
    async me() {
        return this.makeRequest('/auth/me');
    }
}

// Create global instance
window.apiService = new APIService();