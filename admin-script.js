// Admin Dashboard JavaScript
class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.theme = localStorage.getItem('admin-theme') || 'light';
        this.sidebarOpen = window.innerWidth > 1024;
        
        this.init();
    }

    async init() {
        // Check authentication before proceeding
        if (!this.checkAuthentication()) {
            return;
        }
        
        this.setupEventListeners();
        this.applyTheme();
        this.showSection(this.currentSection);
        await this.loadDashboardData();
        this.setupResponsive();
    }

    checkAuthentication() {
        // Check if admin is authenticated
        const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
        const isAdminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
        
        if (!adminToken && !isAdminLoggedIn) {
            // Redirect to admin login page if not authenticated
            window.location.href = '/admin-login.html';
            return false;
        }
        return true;
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // User profile dropdown
        const userProfile = document.getElementById('userProfile');
        const userDropdown = document.getElementById('userDropdown');
        if (userProfile && userDropdown) {
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', () => {
                userDropdown.classList.remove('show');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }

        // Menu toggle
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Window resize
        window.addEventListener('resize', () => this.handleResize());

        // Booking actions
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('approve-booking')) {
                this.handleBookingAction(e.target.dataset.bookingId, 'approve');
            } else if (e.target.classList.contains('reject-booking')) {
                this.handleBookingAction(e.target.dataset.bookingId, 'reject');
            }
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.classList.add('fade-in');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update page title
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = this.getSectionTitle(sectionName);
        }

        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    getSectionTitle(section) {
        const titles = {
            dashboard: 'Dashboard Overview',
            bookings: 'Booking Management',
            analytics: 'Analytics & Reports',
            patients: 'Patient Management',
            profile: 'Clinic Profile',
            settings: 'Settings'
        };
        return titles[section] || 'Dashboard';
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme();
        localStorage.setItem('admin-theme', this.theme);
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#themeToggle');
        if (themeIcon) {
            themeIcon.innerHTML = this.theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
        }
    }

    toggleSidebar() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (sidebar && mainContent) {
            this.sidebarOpen = !this.sidebarOpen;
            
            if (this.sidebarOpen) {
                sidebar.classList.add('open');
                sidebar.classList.remove('collapsed');
            } else {
                sidebar.classList.remove('open');
                sidebar.classList.add('collapsed');
            }
        }
    }

    setupResponsive() {
        this.handleResize();
    }

    handleResize() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (window.innerWidth <= 1024) {
            if (sidebar) sidebar.classList.add('collapsed');
            if (mainContent) mainContent.classList.add('expanded');
            this.sidebarOpen = false;
        } else {
            if (sidebar) sidebar.classList.remove('collapsed');
            if (mainContent) mainContent.classList.remove('expanded');
            this.sidebarOpen = true;
        }
    }

    async loadDashboardData() {
        try {
            // Load dashboard stats from API
            const stats = await window.adminApiService.getDashboardStats();
            this.updateStats(stats);
            await this.loadRecentBookings();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateStats(stats) {
        const elements = {
            totalBookings: document.getElementById('totalBookings'),
            pendingBookings: document.getElementById('pendingBookings'),
            totalPatients: document.getElementById('totalPatients'),
            revenue: document.getElementById('revenue')
        };

        Object.keys(stats).forEach(key => {
            if (elements[key]) {
                if (key === 'revenue') {
                    elements[key].textContent = `$${stats[key].toLocaleString()}`;
                } else {
                    elements[key].textContent = stats[key];
                }
            }
        });
    }

    loadSectionData(section) {
        switch (section) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'bookings':
                this.loadBookings();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
            case 'patients':
                this.loadPatients();
                break;
            case 'profile':
                this.loadClinicProfile();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadRecentBookings() {
        const recentBookingsContainer = document.getElementById('recent-bookings');
        if (!recentBookingsContainer) return;

        try {
            recentBookingsContainer.innerHTML = '<div class="loading-spinner">Loading recent bookings...</div>';
            const bookings = await window.adminApiService.getAllBookings();
            const recentBookings = bookings.slice(0, 5);
            recentBookingsContainer.innerHTML = this.generateBookingsTable(recentBookings);
        } catch (error) {
            console.error('Failed to load recent bookings:', error);
            recentBookingsContainer.innerHTML = '<div class="error-message">Failed to load recent bookings</div>';
        }
    }

    async loadBookings() {
        const bookingsContainer = document.getElementById('bookingsTable');
        if (!bookingsContainer) return;

        try {
            // Show loading state
            bookingsContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading bookings...</div>';
            
            const bookings = await window.adminApiService.getAllBookings();
            const bookingsWithFilters = this.createBookingsWithFilters(bookings);
            bookingsContainer.innerHTML = bookingsWithFilters;
        } catch (error) {
            console.error('Failed to load bookings:', error);
            bookingsContainer.innerHTML = '<div class="error-message">Failed to load bookings. Please try again.</div>';
        }
    }

    generateBookingsTable(bookings, showActions = false) {
        const headers = showActions 
            ? ['Patient', 'Email', 'Service', 'Date', 'Time', 'Status', 'Actions']
            : ['Patient', 'Service', 'Time', 'Status'];

        let tableHTML = `
            <table class="table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        bookings.forEach(booking => {
            const statusBadge = this.getStatusBadge(booking.status);
            const actionsHTML = showActions ? `
                <td>
                    ${booking.status === 'pending' ? `
                        <button class="btn btn-success btn-sm approve-booking" data-booking-id="${booking.id}">Approve</button>
                        <button class="btn btn-danger btn-sm reject-booking" data-booking-id="${booking.id}">Reject</button>
                    ` : `
                        <button class="btn btn-outline btn-sm">View</button>
                    `}
                </td>
            ` : '';

            tableHTML += `
                <tr>
                    <td>${booking.patient}</td>
                    ${showActions ? `<td>${booking.email}</td>` : ''}
                    <td>${booking.service}</td>
                    ${showActions ? `<td>${booking.date}</td>` : ''}
                    <td>${booking.time}</td>
                    <td>${statusBadge}</td>
                    ${actionsHTML}
                </tr>
            `;
        });

        tableHTML += '</tbody></table>';
        return tableHTML;
    }

    getStatusBadge(status) {
        const badges = {
            confirmed: '<span class="badge badge-success">Confirmed</span>',
            pending: '<span class="badge badge-warning">Pending</span>',
            cancelled: '<span class="badge badge-danger">Cancelled</span>',
            completed: '<span class="badge badge-info">Completed</span>'
        };
        return badges[status] || '<span class="badge badge-secondary">Unknown</span>';
    }

    async handleBookingAction(bookingId, action) {
        try {
            const newStatus = action === 'approve' ? 'confirmed' : 'cancelled';
            await window.adminApiService.updateBookingStatus(bookingId, newStatus);
            
            this.showNotification(`Booking ${action}d successfully!`, 'success');
            
            // Reload bookings and dashboard stats
            await this.loadBookings();
            await this.loadDashboardData();
        } catch (error) {
            console.error(`Failed to ${action} booking:`, error);
            this.showNotification(`Failed to ${action} booking. Please try again.`, 'error');
        }
    }

    async loadAnalytics() {
        try {
            console.log('Loading analytics...');
            
            // Load analytics data from API
            await this.loadAnalyticsData();
            
            // Initialize charts with real data
            setTimeout(() => {
                this.initializeCharts();
            }, 100);
        } catch (error) {
            console.error('Failed to load analytics:', error);
            this.showNotification('Failed to load analytics data', 'error');
        }
    }

    async loadAnalyticsData() {
        try {
            // Load all analytics data in parallel
            const [bookingTrends, revenueData, serviceDistribution] = await Promise.all([
                window.adminApiService.getBookingTrends(),
                window.adminApiService.getRevenueData(),
                window.adminApiService.getServiceDistribution()
            ]);
            
            // Store the data for chart rendering
            this.analyticsData = {
                bookingTrends,
                revenueData,
                serviceDistribution
            };
        } catch (error) {
            console.error('Failed to load analytics data:', error);
            // Use fallback mock data if API fails
            this.analyticsData = {
                bookingTrends: this.getMockBookingTrendsData(),
                revenueData: this.getMockRevenueData(),
                serviceDistribution: this.getMockServiceDistributionData()
            };
        }
    }

    initializeCharts() {
        this.createBookingTrendsChart();
        this.createRevenueChart();
        this.createServiceChart();
        this.createPerformanceChart();
    }

    createBookingTrendsChart() {
        const canvas = document.getElementById('bookingTrendsChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getBookingTrendsData();
        
        this.drawLineChart(ctx, data, {
            colors: ['#3b82f6', '#10b981'],
            labels: ['Bookings', 'Completed']
        });
    }

    createRevenueChart() {
        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getRevenueData();
        
        this.drawBarChart(ctx, data, {
            color: '#8b5cf6',
            label: 'Revenue'
        });
    }

    createServiceChart() {
        const canvas = document.getElementById('serviceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getServiceDistributionData();
        
        this.drawPieChart(ctx, data);
    }

    createPerformanceChart() {
        const canvas = document.getElementById('performanceChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const data = this.getPerformanceData();
        
        this.drawLineChart(ctx, data, {
            colors: ['#f59e0b', '#ef4444'],
            labels: ['Target', 'Actual']
        });
    }

    drawLineChart(ctx, data, options) {
        const canvas = ctx.canvas;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Draw grid
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw data lines
        data.datasets.forEach((dataset, index) => {
            ctx.strokeStyle = options.colors[index];
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            dataset.forEach((value, i) => {
                const x = padding + (chartWidth / (dataset.length - 1)) * i;
                const y = height - padding - (value / 100) * chartHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = options.colors[index];
            dataset.forEach((value, i) => {
                const x = padding + (chartWidth / (dataset.length - 1)) * i;
                const y = height - padding - (value / 100) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        });
        
        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        data.labels.forEach((label, i) => {
            const x = padding + (chartWidth / (data.labels.length - 1)) * i;
            ctx.fillText(label, x - 10, height - 10);
        });
    }

    drawBarChart(ctx, data, options) {
        const canvas = ctx.canvas;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        const padding = 40;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / data.values.length * 0.8;
        
        const maxValue = Math.max(...data.values);
        
        ctx.fillStyle = options.color;
        data.values.forEach((value, i) => {
            const x = padding + (chartWidth / data.values.length) * i + (chartWidth / data.values.length - barWidth) / 2;
            const barHeight = (value / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
        });
        
        // Draw labels
        ctx.fillStyle = '#6b7280';
        ctx.font = '12px Arial';
        data.labels.forEach((label, i) => {
            const x = padding + (chartWidth / data.labels.length) * i + (chartWidth / data.labels.length) / 2;
            ctx.fillText(label, x - 15, height - 10);
        });
    }

    drawPieChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;
        
        ctx.clearRect(0, 0, width, height);
        
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 40;
        
        const total = data.values.reduce((sum, value) => sum + value, 0);
        let currentAngle = -Math.PI / 2;
        
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        data.values.forEach((value, i) => {
            const sliceAngle = (value / total) * 2 * Math.PI;
            
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
            const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${Math.round((value / total) * 100)}%`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    getBookingTrendsData() {
        return this.analyticsData?.bookingTrends || this.getMockBookingTrendsData();
    }

    getRevenueData() {
        return this.analyticsData?.revenueData || this.getMockRevenueData();
    }

    getServiceDistributionData() {
        return this.analyticsData?.serviceDistribution || this.getMockServiceDistributionData();
    }

    // Mock data methods as fallbacks
    getMockBookingTrendsData() {
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                [20, 35, 40, 30, 45, 25, 30], // Bookings
                [18, 32, 38, 28, 42, 23, 28]  // Completed
            ]
        };
    }

    getMockRevenueData() {
        return {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            values: [2800, 3200, 2900, 3500]
        };
    }

    getMockServiceDistributionData() {
        return {
            labels: ['General Checkup', 'Dental', 'Eye Exam', 'Consultation', 'Other'],
            values: [35, 25, 20, 15, 5]
        };
    }

    getPerformanceData() {
        return {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [
                [80, 85, 90, 88, 92, 95], // Target
                [75, 82, 88, 85, 90, 93]  // Actual
            ]
        };
    }

    updateAnalytics() {
        const dateRange = document.getElementById('analyticsDateRange')?.value;
        console.log(`Updating analytics for ${dateRange} days`);
        
        // Simulate data update based on date range
        setTimeout(() => {
            this.initializeCharts();
        }, 500);
    }

    loadPatients() {
        const patientsContainer = document.getElementById('patientsTable');
        if (!patientsContainer) return;

        patientsContainer.innerHTML = '<div class="loading"><div class="spinner"></div>Loading patients...</div>';

        setTimeout(() => {
            const patients = [
            { id: 1, name: 'John Smith', email: 'john@email.com', phone: '+44 20 7946 0958', lastVisit: '2024-01-10', totalVisits: 5 },
            { id: 2, name: 'Jane Williams', email: 'jane@email.com', phone: '+44 161 496 0123', lastVisit: '2024-01-12', totalVisits: 3 },
            { id: 3, name: 'Michael Brown', email: 'mike@email.com', phone: '+44 121 496 0456', lastVisit: '2024-01-08', totalVisits: 7 },
            { id: 4, name: 'Sarah Jones', email: 'sarah@email.com', phone: '+44 113 496 0789', lastVisit: '2024-01-14', totalVisits: 2 }
        ];

            let tableHTML = `
                <table class="table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>Last Visit</th>
                            <th>Total Visits</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            patients.forEach(patient => {
                tableHTML += `
                    <tr>
                        <td>${patient.name}</td>
                        <td>${patient.email}</td>
                        <td>${patient.phone}</td>
                        <td>${patient.lastVisit}</td>
                        <td>${patient.totalVisits}</td>
                        <td>
                            <button class="btn btn-outline btn-sm">View</button>
                            <button class="btn btn-primary btn-sm">Edit</button>
                        </td>
                    </tr>
                `;
            });

            tableHTML += '</tbody></table>';
            patientsContainer.innerHTML = tableHTML;
        }, 1000);
    }

    loadClinicProfile() {
        const profileContainer = document.getElementById('clinicProfileContent');
        if (profileContainer) {
            profileContainer.innerHTML = `
                <div class="clinic-profile-layout">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/%3E%3Cpolyline points='9,22 9,12 15,12 15,22'/%3E%3C/svg%3E" alt="Clinic Logo" id="clinicLogo">
                            <button class="avatar-upload-btn" onclick="adminDashboard.uploadLogo()">📷</button>
                        </div>
                        <div class="profile-info">
                            <h2>Harley Street Medical Centre</h2>
                            <p class="profile-subtitle">Comprehensive Healthcare Services</p>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-value">4.8</span>
                                    <span class="stat-label">Rating</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">156</span>
                                    <span class="stat-label">Patients</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-value">5</span>
                                    <span class="stat-label">Years</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-tabs">
                        <button class="tab-btn active" onclick="adminDashboard.switchProfileTab('basic')">Basic Information</button>
                        <button class="tab-btn" onclick="adminDashboard.switchProfileTab('services')">Services</button>
                        <button class="tab-btn" onclick="adminDashboard.switchProfileTab('hours')">Operating Hours</button>
                        <button class="tab-btn" onclick="adminDashboard.switchProfileTab('staff')">Staff</button>
                    </div>
                    
                    <div class="profile-content">
                        <div id="basicTab" class="tab-content active">
                            <form class="profile-form" onsubmit="adminDashboard.saveClinicProfile(event)">
                                <div class="form-section">
                                    <h3>Contact Information</h3>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Clinic Name *</label>
                                            <input type="text" class="form-input" name="clinicName" value="Harley Street Medical Centre" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Phone Number *</label>
                                            <input type="tel" class="form-input" name="phone" value="+44 20 7946 0958" required>
                                        </div>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Email Address *</label>
                                            <input type="email" class="form-input" name="email" value="info@downtownmedical.com" required>
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Website</label>
                                            <input type="url" class="form-input" name="website" value="https://downtownmedical.com">
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Address *</label>
                                        <textarea class="form-textarea" name="address" rows="3" required>123 Main Street, Downtown, City 12345</textarea>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h3>About Clinic</h3>
                                    <div class="form-group">
                                        <label class="form-label">Description</label>
                                        <textarea class="form-textarea" name="description" rows="4">A modern medical facility providing comprehensive healthcare services to the community with state-of-the-art equipment and experienced medical professionals.</textarea>
                                    </div>
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label class="form-label">Specialties</label>
                                            <input type="text" class="form-input" name="specialties" value="General Medicine, Cardiology, Dermatology, Pediatrics">
                                        </div>
                                        <div class="form-group">
                                            <label class="form-label">Languages Spoken</label>
                                            <input type="text" class="form-input" name="languages" value="English, Spanish, French">
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                    <button type="button" class="btn btn-outline" onclick="adminDashboard.resetForm()">Reset</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="servicesTab" class="tab-content">
                            <div class="services-management">
                                <div class="section-header">
                                    <h3>Services & Pricing</h3>
                                    <button class="btn btn-primary btn-sm" onclick="adminDashboard.addService()">+ Add Service</button>
                                </div>
                                <div class="services-list" id="servicesList">
                                    <!-- Services will be loaded here -->
                                </div>
                            </div>
                        </div>
                        
                        <div id="hoursTab" class="tab-content">
                            <div class="hours-management">
                                <h3>Operating Hours</h3>
                                <form class="hours-form" onsubmit="adminDashboard.saveOperatingHours(event)">
                                    <div class="hours-grid" id="operatingHours">
                                        <!-- Operating hours will be loaded here -->
                                    </div>
                                    <div class="form-actions">
                                        <button type="submit" class="btn btn-primary">Save Hours</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        <div id="staffTab" class="tab-content">
                            <div class="staff-management">
                                <div class="section-header">
                                    <h3>Staff Members</h3>
                                    <button class="btn btn-primary btn-sm" onclick="adminDashboard.addStaffMember()">+ Add Staff</button>
                                </div>
                                <div class="staff-grid" id="staffList">
                                    <!-- Staff will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Load initial data
            this.loadServices();
            this.loadOperatingHours();
            this.loadStaff();
        }
    }

    loadSettings() {
        const settingsContainer = document.getElementById('settingsContent');
        if (settingsContainer) {
            settingsContainer.innerHTML = `
                <div class="settings-layout">
                    <div class="settings-nav">
                        <button class="settings-nav-btn active" onclick="adminDashboard.switchSettingsTab('general')">General</button>
                        <button class="settings-nav-btn" onclick="adminDashboard.switchSettingsTab('notifications')">Notifications</button>
                        <button class="settings-nav-btn" onclick="adminDashboard.switchSettingsTab('security')">Security</button>
                        <button class="settings-nav-btn" onclick="adminDashboard.switchSettingsTab('billing')">Billing</button>
                    </div>
                    
                    <div class="settings-content">
                        <div id="generalSettings" class="settings-tab active">
                            <h3>General Settings</h3>
                            <form class="settings-form" onsubmit="adminDashboard.saveGeneralSettings(event)">
                                <div class="form-section">
                                    <h4>Appearance</h4>
                                    <div class="form-group">
                                        <label class="form-label">Theme</label>
                                        <select class="form-select" name="theme">
                                            <option value="light">Light</option>
                                            <option value="dark">Dark</option>
                                            <option value="auto">Auto</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Language</label>
                                        <select class="form-select" name="language">
                                            <option value="en">English</option>
                                            <option value="es">Spanish</option>
                                            <option value="fr">French</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h4>Booking Settings</h4>
                                    <div class="form-group">
                                        <label class="form-label">Default Appointment Duration (minutes)</label>
                                        <input type="number" class="form-input" name="appointmentDuration" value="30" min="15" max="120">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Advance Booking Limit (days)</label>
                                        <input type="number" class="form-input" name="advanceBooking" value="30" min="1" max="365">
                                    </div>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="autoConfirm" checked>
                                            <span class="checkmark"></span>
                                            Auto-confirm bookings
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Save Settings</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="notificationsSettings" class="settings-tab">
                            <h3>Notification Settings</h3>
                            <form class="settings-form" onsubmit="adminDashboard.saveNotificationSettings(event)">
                                <div class="form-section">
                                    <h4>Email Notifications</h4>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="newBookingEmail" checked>
                                            <span class="checkmark"></span>
                                            New booking notifications
                                        </label>
                                    </div>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="cancellationEmail" checked>
                                            <span class="checkmark"></span>
                                            Cancellation notifications
                                        </label>
                                    </div>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="reminderEmail">
                                            <span class="checkmark"></span>
                                            Daily summary emails
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h4>SMS Notifications</h4>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="newBookingSMS">
                                            <span class="checkmark"></span>
                                            New booking SMS alerts
                                        </label>
                                    </div>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="emergencySMS" checked>
                                            <span class="checkmark"></span>
                                            Emergency notifications
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Save Settings</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="securitySettings" class="settings-tab">
                            <h3>Security Settings</h3>
                            <form class="settings-form" onsubmit="adminDashboard.saveSecuritySettings(event)">
                                <div class="form-section">
                                    <h4>Password Settings</h4>
                                    <div class="form-group">
                                        <label class="form-label">Current Password</label>
                                        <input type="password" class="form-input" name="currentPassword">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">New Password</label>
                                        <input type="password" class="form-input" name="newPassword">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Confirm New Password</label>
                                        <input type="password" class="form-input" name="confirmPassword">
                                    </div>
                                </div>
                                
                                <div class="form-section">
                                    <h4>Two-Factor Authentication</h4>
                                    <div class="form-group">
                                        <label class="checkbox-label">
                                            <input type="checkbox" name="enable2FA">
                                            <span class="checkmark"></span>
                                            Enable Two-Factor Authentication
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Update Security</button>
                                </div>
                            </form>
                        </div>
                        
                        <div id="billingSettings" class="settings-tab">
                            <h3>Billing Settings</h3>
                            <div class="billing-info">
                                <div class="billing-card">
                                    <h4>Current Plan</h4>
                                    <div class="plan-details">
                                        <div class="plan-name">Professional Plan</div>
                                        <div class="plan-price">$99/month</div>
                                        <div class="plan-features">
                                            <ul>
                                                <li>Unlimited bookings</li>
                                                <li>Advanced analytics</li>
                                                <li>Priority support</li>
                                                <li>Custom branding</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline">Change Plan</button>
                                </div>
                                
                                <div class="billing-card">
                                    <h4>Payment Method</h4>
                                    <div class="payment-method">
                                        <div class="card-info">
                                            <span class="card-type">💳 Visa</span>
                                            <span class="card-number">**** **** **** 1234</span>
                                            <span class="card-expiry">Expires 12/25</span>
                                        </div>
                                    </div>
                                    <button class="btn btn-outline">Update Payment</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // Utility methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP'
        }).format(amount);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }

    getBookingsData() {
        // Simulate booking data - in real app this would come from API
        return [
            { id: 1, patient: 'John Smith', email: 'john@email.com', phone: '+44 20 7946 0958', service: 'General Checkup', date: '2024-01-15', time: '10:00', status: 'confirmed', amount: 150 },
            { id: 2, patient: 'Jane Williams', email: 'jane@email.com', phone: '+44 161 496 0123', service: 'Dental Cleaning', date: '2024-01-15', time: '14:30', status: 'pending', amount: 120 },
            { id: 3, patient: 'Michael Brown', email: 'mike@email.com', phone: '+44 121 496 0456', service: 'Eye Exam', date: '2024-01-16', time: '16:00', status: 'confirmed', amount: 200 },
            { id: 4, patient: 'Sarah Jones', email: 'sarah@email.com', phone: '+44 113 496 0789', service: 'Consultation', date: '2024-01-16', time: '11:30', status: 'pending', amount: 100 },
            { id: 5, patient: 'Thomas Davies', email: 'tom@email.com', phone: '+44 151 496 0321', service: 'Physiotherapy', date: '2024-01-17', time: '09:00', status: 'cancelled', amount: 180 },
            { id: 6, patient: 'Emily Taylor', email: 'emily@email.com', phone: '+44 114 496 0654', service: 'Cardiology', date: '2024-01-18', time: '13:00', status: 'pending', amount: 300 },
            { id: 7, patient: 'David Wilson', email: 'david@email.com', phone: '+44 117 496 0987', service: 'Dermatology', date: '2024-01-19', time: '15:30', status: 'confirmed', amount: 250 },
            { id: 8, patient: 'Lisa Evans', email: 'lisa@email.com', phone: '+44 118 496 0147', service: 'Optometry', date: '2024-01-20', time: '10:30', status: 'pending', amount: 175 }
        ];
    }

    createBookingsWithFilters(bookings) {
        const filtersHTML = `
            <div class="booking-filters">
                <div class="filter-row">
                    <div class="filter-group">
                        <label class="form-label">Status Filter:</label>
                        <select class="form-select" id="statusFilter" onchange="adminDashboard.filterBookings()">
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label class="form-label">Date Filter:</label>
                        <input type="date" class="form-input" id="dateFilter" onchange="adminDashboard.filterBookings()">
                    </div>
                    <div class="filter-group">
                        <label class="form-label">Search:</label>
                        <input type="text" class="form-input" id="searchFilter" placeholder="Search patient name..." oninput="adminDashboard.filterBookings()">
                    </div>
                    <div class="filter-group">
                        <button class="btn btn-outline btn-sm" onclick="adminDashboard.clearFilters()">Clear Filters</button>
                    </div>
                </div>
            </div>
        `;
        
        const tableHTML = this.generateBookingsTable(bookings, true);
        return filtersHTML + tableHTML;
    }

    filterBookings() {
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        const dateFilter = document.getElementById('dateFilter')?.value || '';
        const searchFilter = document.getElementById('searchFilter')?.value.toLowerCase() || '';
        
        let bookings = this.getBookingsData();
        
        // Apply filters
        if (statusFilter !== 'all') {
            bookings = bookings.filter(booking => booking.status === statusFilter);
        }
        
        if (dateFilter) {
            bookings = bookings.filter(booking => booking.date === dateFilter);
        }
        
        if (searchFilter) {
            bookings = bookings.filter(booking => 
                booking.patient.toLowerCase().includes(searchFilter) ||
                booking.service.toLowerCase().includes(searchFilter)
            );
        }
        
        // Update table only
        const bookingsContainer = document.getElementById('bookingsTable');
        if (bookingsContainer) {
            const tableContainer = bookingsContainer.querySelector('.table-container') || bookingsContainer;
            const existingTable = tableContainer.querySelector('table');
            if (existingTable) {
                existingTable.outerHTML = this.generateBookingsTable(bookings, true);
            }
        }
    }

    clearFilters() {
        document.getElementById('statusFilter').value = 'all';
        document.getElementById('dateFilter').value = '';
        document.getElementById('searchFilter').value = '';
        this.filterBookings();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    // Clinic Profile Methods
    switchProfileTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab and content
        event.target.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
    }

    loadServices() {
        const servicesList = document.getElementById('servicesList');
        if (servicesList) {
            const services = [
                { id: 1, name: 'General Consultation', duration: 30, price: 150, description: 'Comprehensive health checkup and consultation' },
                { id: 2, name: 'Cardiology Consultation', duration: 45, price: 250, description: 'Specialized heart and cardiovascular examination' },
                { id: 3, name: 'Dermatology Consultation', duration: 30, price: 200, description: 'Skin, hair, and nail examination and treatment' },
                { id: 4, name: 'Pediatric Consultation', duration: 30, price: 180, description: 'Specialized care for children and adolescents' }
            ];
            
            servicesList.innerHTML = services.map(service => `
                <div class="service-card">
                    <div class="service-info">
                        <h4>${service.name}</h4>
                        <p>${service.description}</p>
                        <div class="service-details">
                            <span class="service-duration"><i class="fas fa-clock"></i> ${service.duration} min</span>
                            <span class="service-price"><i class="fas fa-pound-sign"></i> £${service.price}</span>
                        </div>
                    </div>
                    <div class="service-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.editService(${service.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.deleteService(${service.id})">Delete</button>
                    </div>
                </div>
            `).join('');
        }
    }

    loadOperatingHours() {
        const hoursContainer = document.getElementById('operatingHours');
        if (hoursContainer) {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const defaultHours = {
                'Monday': { open: '09:00', close: '17:00', closed: false },
                'Tuesday': { open: '09:00', close: '17:00', closed: false },
                'Wednesday': { open: '09:00', close: '17:00', closed: false },
                'Thursday': { open: '09:00', close: '17:00', closed: false },
                'Friday': { open: '09:00', close: '17:00', closed: false },
                'Saturday': { open: '10:00', close: '14:00', closed: false },
                'Sunday': { open: '10:00', close: '14:00', closed: true }
            };
            
            hoursContainer.innerHTML = days.map(day => {
                const hours = defaultHours[day];
                return `
                    <div class="hours-row">
                        <div class="day-name">${day}</div>
                        <div class="hours-inputs">
                            <label class="checkbox-label">
                                <input type="checkbox" name="${day.toLowerCase()}_closed" ${hours.closed ? 'checked' : ''} onchange="adminDashboard.toggleDayClosed('${day.toLowerCase()}')">
                                <span class="checkmark"></span>
                                Closed
                            </label>
                            <input type="time" name="${day.toLowerCase()}_open" value="${hours.open}" ${hours.closed ? 'disabled' : ''}>
                            <span class="hours-separator">to</span>
                            <input type="time" name="${day.toLowerCase()}_close" value="${hours.close}" ${hours.closed ? 'disabled' : ''}>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    loadStaff() {
        const staffList = document.getElementById('staffList');
        if (staffList) {
            const staff = [
                { id: 1, name: 'Dr. Sarah Thompson', role: 'General Practitioner', email: 'sarah.thompson@clinic.com', phone: '+44 20 7946 0958', specialties: 'Family Medicine, Preventive Care' },
                { id: 2, name: 'Dr. Michael Davies', role: 'Cardiologist', email: 'michael.davies@clinic.com', phone: '+44 161 496 0123', specialties: 'Cardiology, Internal Medicine' },
                { id: 3, name: 'Dr. Emily Clarke', role: 'Dermatologist', email: 'emily.clarke@clinic.com', phone: '+44 121 496 0456', specialties: 'Dermatology, Cosmetic Procedures' },
                { id: 4, name: 'Dr. James Roberts', role: 'Paediatrician', email: 'james.roberts@clinic.com', phone: '+44 113 496 0789', specialties: 'Paediatrics, Child Development' }
            ];
            
            staffList.innerHTML = staff.map(member => `
                <div class="staff-card">
                    <div class="staff-avatar">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E" alt="${member.name}">
                    </div>
                    <div class="staff-info">
                        <h4>${member.name}</h4>
                        <p class="staff-role">${member.role}</p>
                        <p class="staff-specialties">${member.specialties}</p>
                        <div class="staff-contact">
                            <span><i class="fas fa-envelope"></i> ${member.email}</span>
                            <span><i class="fas fa-phone"></i> ${member.phone}</span>
                        </div>
                    </div>
                    <div class="staff-actions">
                        <button class="btn btn-sm btn-outline" onclick="adminDashboard.editStaff(${member.id})">Edit</button>
                        <button class="btn btn-sm btn-danger" onclick="adminDashboard.removeStaff(${member.id})">Remove</button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Settings Methods
    switchSettingsTab(tabName) {
        // Remove active class from all nav buttons and tabs
        document.querySelectorAll('.settings-nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        
        // Add active class to selected nav button and tab
        event.target.classList.add('active');
        document.getElementById(tabName + 'Settings').classList.add('active');
    }

    // Form Handlers
    saveClinicProfile(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const profileData = Object.fromEntries(formData.entries());
        
        // Simulate API call
        setTimeout(() => {
            this.showNotification('Clinic profile updated successfully!', 'success');
        }, 500);
    }

    saveOperatingHours(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const hoursData = Object.fromEntries(formData.entries());
        
        // Simulate API call
        setTimeout(() => {
            this.showNotification('Operating hours updated successfully!', 'success');
        }, 500);
    }

    saveGeneralSettings(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const settingsData = Object.fromEntries(formData.entries());
        
        // Apply theme change if needed
        if (settingsData.theme) {
            document.documentElement.setAttribute('data-theme', settingsData.theme);
        }
        
        setTimeout(() => {
            this.showNotification('General settings saved successfully!', 'success');
        }, 500);
    }

    saveNotificationSettings(event) {
        event.preventDefault();
        setTimeout(() => {
            this.showNotification('Notification settings updated successfully!', 'success');
        }, 500);
    }

    saveSecuritySettings(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const securityData = Object.fromEntries(formData.entries());
        
        // Validate password fields
        if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }
        
        setTimeout(() => {
            this.showNotification('Security settings updated successfully!', 'success');
        }, 500);
    }

    // Utility Methods
    toggleDayClosed(day) {
        const checkbox = document.querySelector(`input[name="${day}_closed"]`);
        const openInput = document.querySelector(`input[name="${day}_open"]`);
        const closeInput = document.querySelector(`input[name="${day}_close"]`);
        
        if (checkbox.checked) {
            openInput.disabled = true;
            closeInput.disabled = true;
        } else {
            openInput.disabled = false;
            closeInput.disabled = false;
        }
    }

    uploadLogo() {
        // Simulate file upload
        this.showNotification('Logo upload functionality would be implemented here', 'info');
    }

    addService() {
        this.showNotification('Add service functionality would be implemented here', 'info');
    }

    editService(serviceId) {
        this.showNotification(`Edit service ${serviceId} functionality would be implemented here`, 'info');
    }

    deleteService(serviceId) {
        if (confirm('Are you sure you want to delete this service?')) {
            this.showNotification(`Service ${serviceId} deleted successfully!`, 'success');
            this.loadServices();
        }
    }

    addStaffMember() {
        this.showNotification('Add staff member functionality would be implemented here', 'info');
    }

    editStaff(staffId) {
        this.showNotification(`Edit staff member ${staffId} functionality would be implemented here`, 'info');
    }

    removeStaff(staffId) {
        if (confirm('Are you sure you want to remove this staff member?')) {
            this.showNotification(`Staff member ${staffId} removed successfully!`, 'success');
            this.loadStaff();
        }
    }

    resetForm() {
        if (confirm('Are you sure you want to reset all changes?')) {
            location.reload();
        }
    }

    logout() {
        // Clear admin authentication flags
        localStorage.removeItem('adminLoggedIn');
        localStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminToken');
        
        // Redirect to admin login page
        window.location.href = '/admin-login.html';
    }
}

// Initialize dashboard when page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize admin API service
    window.adminApiService = new AdminAPIService();
    
    // Initialize dashboard
    adminDashboard = new AdminDashboard();
    await adminDashboard.init();
    
    // Make adminDashboard globally accessible for onclick handlers
    window.adminDashboard = adminDashboard;
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}