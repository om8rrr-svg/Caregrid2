// Admin API Service for CareGrid Backend Communication
// Extends the base APIService with admin-specific functionality

class AdminAPIService {
    constructor() {
        // Use centralized API base configuration
        const apiBase = window.__API_BASE__ || 
                       (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE)) ||
                       'https://caregrid-backend.onrender.com';
        this.baseURL = apiBase.endsWith('/api') ? apiBase : apiBase + '/api';
        this.token = this.getStoredToken();
    }

    // Token management
    getStoredToken() {
        return localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    }

    setToken(token, remember = false) {
        this.token = token;
        if (remember) {
            localStorage.setItem('adminToken', token);
            sessionStorage.removeItem('adminToken');
        } else {
            sessionStorage.setItem('adminToken', token);
            localStorage.removeItem('adminToken');
        }
        this.token = this.getStoredToken();
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminToken');
    }

    // HTTP request helper
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            credentials: 'include',
            ...options
        };

        // Add authorization header if token exists
        const currentToken = this.getStoredToken();
        if (currentToken) {
            this.token = currentToken;
            config.headers.Authorization = `Bearer ${currentToken}`;
        }

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.removeToken();
                throw new Error('Authentication failed');
            }
            
            if (response.status === 429) {
                throw new Error('Too many requests. Please wait a moment and try again.');
            }
            
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const textResponse = await response.text();
                if (!response.ok) {
                    throw new Error(`Server error: ${textResponse || response.statusText}`);
                }
                return { message: textResponse };
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Dashboard Analytics
    async getDashboardStats() {
        try {
            const [appointments, clinics] = await Promise.all([
                this.makeRequest('/appointments'),
                this.makeRequest('/clinics')
            ]);

            const today = new Date();
            const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

            // Calculate stats from appointments data
            const totalBookings = appointments.data?.length || 0;
            const pendingBookings = appointments.data?.filter(apt => apt.status === 'pending').length || 0;
            const confirmedBookings = appointments.data?.filter(apt => apt.status === 'confirmed').length || 0;
            const totalClinics = clinics.data?.length || 0;

            // Calculate monthly stats
            const thisMonthBookings = appointments.data?.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                return aptDate >= thisMonth;
            }).length || 0;

            const lastMonthBookings = appointments.data?.filter(apt => {
                const aptDate = new Date(apt.appointment_date);
                return aptDate >= lastMonth && aptDate < thisMonth;
            }).length || 0;

            const monthlyGrowth = lastMonthBookings > 0 
                ? ((thisMonthBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1)
                : 0;

            return {
                totalBookings,
                pendingBookings,
                confirmedBookings,
                totalClinics,
                monthlyGrowth: parseFloat(monthlyGrowth),
                recentBookings: appointments.data?.slice(0, 5) || []
            };
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            // Return mock data as fallback
            return {
                totalBookings: 0,
                pendingBookings: 0,
                confirmedBookings: 0,
                totalClinics: 0,
                monthlyGrowth: 0,
                recentBookings: []
            };
        }
    }

    // Booking Management
    async getAllBookings(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.status) queryParams.append('status', filters.status);
            if (filters.clinicId) queryParams.append('clinicId', filters.clinicId);
            if (filters.date) queryParams.append('date', filters.date);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `/appointments/admin/appointments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await this.makeRequest(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            return [];
        }
    }

    async updateBookingStatus(bookingId, status, notes = '') {
        try {
            const response = await this.makeRequest(`/appointments/${bookingId}`, {
                method: 'PUT',
                body: JSON.stringify({ status, notes })
            });
            return response;
        } catch (error) {
            console.error('Failed to update booking status:', error);
            throw error;
        }
    }

    async deleteBooking(bookingId) {
        try {
            const response = await this.makeRequest(`/appointments/${bookingId}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Failed to delete booking:', error);
            throw error;
        }
    }

    // Clinic Management
    async getAllClinics(filters = {}) {
        try {
            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append('search', filters.search);
            if (filters.type) queryParams.append('type', filters.type);
            if (filters.city) queryParams.append('city', filters.city);
            if (filters.page) queryParams.append('page', filters.page);
            if (filters.limit) queryParams.append('limit', filters.limit);

            const endpoint = `/clinics${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await this.makeRequest(endpoint);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch clinics:', error);
            return [];
        }
    }

    async getClinicById(clinicId) {
        try {
            const response = await this.makeRequest(`/clinics/${clinicId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to fetch clinic:', error);
            throw error;
        }
    }

    async updateClinic(clinicId, clinicData) {
        try {
            const response = await this.makeRequest(`/clinics/${clinicId}`, {
                method: 'PUT',
                body: JSON.stringify(clinicData)
            });
            return response;
        } catch (error) {
            console.error('Failed to update clinic:', error);
            throw error;
        }
    }

    async createClinic(clinicData) {
        try {
            const response = await this.makeRequest('/clinics', {
                method: 'POST',
                body: JSON.stringify(clinicData)
            });
            return response;
        } catch (error) {
            console.error('Failed to create clinic:', error);
            throw error;
        }
    }

    async deleteClinic(clinicId) {
        try {
            const response = await this.makeRequest(`/clinics/${clinicId}`, {
                method: 'DELETE'
            });
            return response;
        } catch (error) {
            console.error('Failed to delete clinic:', error);
            throw error;
        }
    }

    // Analytics Data
    async getBookingTrends(period = '30d') {
        try {
            const appointments = await this.getAllBookings();
            const now = new Date();
            const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
            const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));

            // Group bookings by date
            const trends = {};
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
                const dateStr = date.toISOString().split('T')[0];
                trends[dateStr] = 0;
            }

            appointments.forEach(apt => {
                const aptDate = new Date(apt.appointment_date).toISOString().split('T')[0];
                if (trends.hasOwnProperty(aptDate)) {
                    trends[aptDate]++;
                }
            });

            return Object.entries(trends).map(([date, count]) => ({ date, count }));
        } catch (error) {
            console.error('Failed to fetch booking trends:', error);
            return [];
        }
    }

    async getRevenueData(period = '30d') {
        try {
            // This would need to be implemented based on your pricing model
            // For now, return mock data based on bookings
            const appointments = await this.getAllBookings();
            const avgPrice = 75; // Average appointment price
            
            const revenue = appointments
                .filter(apt => apt.status === 'confirmed')
                .reduce((total, apt) => total + avgPrice, 0);

            return {
                total: revenue,
                thisMonth: revenue * 0.3, // Mock current month
                lastMonth: revenue * 0.25, // Mock last month
                growth: 20 // Mock growth percentage
            };
        } catch (error) {
            console.error('Failed to fetch revenue data:', error);
            return { total: 0, thisMonth: 0, lastMonth: 0, growth: 0 };
        }
    }

    async getServiceDistribution() {
        try {
            const appointments = await this.getAllBookings();
            const services = {};
            
            appointments.forEach(apt => {
                const service = apt.treatment_type || 'General Consultation';
                services[service] = (services[service] || 0) + 1;
            });

            return Object.entries(services).map(([name, count]) => ({ name, count }));
        } catch (error) {
            console.error('Failed to fetch service distribution:', error);
            return [];
        }
    }

    // User Management (if admin has access)
    async getCurrentUser() {
        try {
            const response = await this.makeRequest('/auth/me');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch current user:', error);
            throw error;
        }
    }

    // Health Check
    async healthCheck() {
        try {
            const response = await this.makeRequest('/health');
            return response;
        } catch (error) {
            console.error('Health check failed:', error);
            return { status: 'error', message: 'Backend unavailable' };
        }
    }
}

// Create global instance
window.adminApiService = new AdminAPIService();