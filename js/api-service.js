// API Service for CareGrid Backend Communication

class APIService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.token = this.getStoredToken();
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
    }

    // HTTP request helper
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('Making request to:', url); // Debug log
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
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
            console.log('Request config:', config); // Debug log
            const response = await fetch(url, config);
            console.log('Response received:', response.status, response.statusText); // Debug log
            
            // Handle 401 Unauthorized gracefully for missing/invalid tokens
            if (response.status === 401) {
                // Clear invalid token
                this.clearAuthData();
                throw new Error('Authentication failed');
            }
            
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            console.error('Error details:', error.message, error.stack); // Enhanced debug log
            
            // Handle specific error cases
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Network connection failed. Please check if the server is running.');
            }
            
            // For authentication errors, provide clearer messaging
            if (error.message.includes('Authentication failed') || error.message.includes('401')) {
                // Don't re-throw here to avoid cascading errors
                throw new Error('Authentication failed');
            }
            
            throw error;
        }
    }

    // Authentication endpoints
    async login(email, password) {
        const response = await this.makeRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return response;
    }

    async register(userData) {
        const response = await this.makeRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return response;
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
        const response = await this.makeRequest(endpoint);
        return response;
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
        const response = await this.makeRequest('/appointments', {
            method: 'POST',
            body: JSON.stringify(appointmentData)
        });
        return response;
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

    // Health check
    async healthCheck() {
        const response = await this.makeRequest('/health');
        return response;
    }
}

// Create global instance
window.apiService = new APIService();