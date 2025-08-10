// Dashboard JavaScript

class Dashboard {
    constructor() {
        console.log('DEBUG: Dashboard constructor started');
        this.currentUser = null;
        this.authSystem = window.authSystem;
        this.apiService = window.apiService;
        this.currentSection = 'overview';
        
        // Initialize appointments as empty array first
        this.appointments = [];
        
        // Initialize dashboard
        this.init();
    }
    
    async init() {
        // Check authentication and load user data
        await this.checkAuthentication();
        
        // Load appointments from API
        await this.loadAppointments();
        
        // Initialize UI
        this.initializeUI();
    }
    
    async checkAuthentication() {
        try {
            if (this.authSystem && this.authSystem.isAuthenticated()) {
                // Get user from localStorage first
                this.currentUser = this.authSystem.getCurrentUser();
                
                // Fetch fresh user data from API
                try {
                    const response = await this.apiService.getCurrentUser();
                    this.currentUser = response;
                    console.log('DEBUG: Fresh user data from API:', this.currentUser);
                    
                    // Update the welcome message
                    this.updateWelcomeMessage();
                } catch (apiError) {
                    console.warn('Failed to fetch fresh user data:', apiError);
                    // Check if token is expired
                    if (apiError.message && apiError.message.includes('401')) {
                        console.log('Token expired, redirecting to login');
                        this.authSystem.logout();
                        return;
                    }
                    // Use cached user data if API fails
                    this.updateWelcomeMessage();
                }
            } else {
                // Redirect to login if not authenticated
                window.location.href = 'auth.html';
                return;
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            window.location.href = 'auth.html';
        }
    }
    
    async loadAppointments() {
        try {
            if (this.currentUser) {
                const response = await this.apiService.getAppointments();
                this.appointments = response.appointments || [];
                console.log('DEBUG: Loaded appointments from API:', this.appointments.length);
            }
        } catch (error) {
            console.warn('Error loading appointments from API:', error);
            this.appointments = this.sampleAppointments || [];
        }
    }
    
    updateWelcomeMessage() {
        if (this.currentUser) {
            const userNameElement = document.getElementById('dashboardUserName');
            if (userNameElement) {
                const firstName = this.currentUser.firstName || this.currentUser.name || 'User';
                const title = this.currentUser.role === 'doctor' ? 'Dr.' : '';
                userNameElement.textContent = `${title} ${firstName}`.trim();
            }
        }
    }
    
    initializeUI() {
        // Keep sample data as fallback for demo purposes
        this.sampleAppointments = [
            {
                id: '1',
                clinicName: 'City Medical Center',
                clinicType: 'General Practice',
                date: '2024-01-15',
                time: '10:00 AM',
                status: 'upcoming',
                doctor: 'Dr. Sarah Johnson',
                address: '123 Main St, Downtown',
                phone: '+1 (555) 123-4567'
            },
            {
                id: '2',
                clinicName: 'Heart Care Specialists',
                clinicType: 'Cardiology',
                date: '2024-01-20',
                time: '2:30 PM',
                status: 'upcoming',
                doctor: 'Dr. Michael Chen',
                address: '456 Oak Ave, Uptown',
                phone: '+1 (555) 234-5678'
            },
            {
                id: '3',
                clinicName: 'Wellness Clinic',
                clinicType: 'Family Medicine',
                date: '2024-01-25',
                time: '9:15 AM',
                status: 'upcoming',
                doctor: 'Dr. Emily Rodriguez',
                address: '789 Pine St, Midtown',
                phone: '+1 (555) 345-6789'
            },
            {
                id: '4',
                clinicName: 'Dental Excellence',
                clinicType: 'Dentistry',
                date: '2024-01-05',
                time: '11:00 AM',
                status: 'completed',
                doctor: 'Dr. Robert Kim',
                address: '321 Elm St, Downtown',
                phone: '+1 (555) 456-7890'
            }
        ];
        
        this.sampleFavorites = [
            {
                id: '1',
                name: 'City Medical Center',
                type: 'General Practice',
                rating: 4.8,
                address: '123 Main St, Downtown',
                phone: '+1 (555) 123-4567',
                image: 'images/clinic1.jpg'
            },
            {
                id: '2',
                name: 'Heart Care Specialists',
                type: 'Cardiology',
                rating: 4.9,
                address: '456 Oak Ave, Uptown',
                phone: '+1 (555) 234-5678',
                image: 'images/clinic2.jpg'
            }
        ];
        
        this.sampleReviews = [
            {
                id: '1',
                clinicName: 'Wellness Clinic',
                rating: 5,
                comment: 'Excellent service and very professional staff. Dr. Rodriguez was thorough and caring.',
                date: '2024-01-10',
                helpful: 12
            },
            {
                id: '2',
                clinicName: 'Dental Excellence',
                rating: 4,
                comment: 'Good dental care, clean facility. Wait time was a bit long but worth it.',
                date: '2024-01-08',
                helpful: 8
            }
        ];
        
        this.sampleNotifications = [
            {
                id: '1',
                type: 'appointment',
                title: 'Appointment Reminder',
                message: 'Your appointment with Dr. Sarah Johnson is tomorrow at 10:00 AM',
                time: '2 hours ago',
                read: false
            },
            {
                id: '2',
                type: 'review',
                title: 'Review Request',
                message: 'How was your visit to Dental Excellence? Share your experience.',
                time: '1 day ago',
                read: false
            },
            {
                id: '3',
                type: 'system',
                title: 'Profile Updated',
                message: 'Your profile information has been successfully updated.',
                time: '3 days ago',
                read: true
            }
        ];
        
        this.bindEvents();
        this.updateUserInfo();
        this.showSection('overview');
        console.log('DEBUG: Dashboard init completed');
    }
    
    updateUserInfo() {
        console.log('DEBUG: Dashboard updateUserInfo started');
        // Check if user is logged in
        if (!this.currentUser) {
            // Create a demo user for testing if no user is logged in
            this.currentUser = {
                firstName: 'Demo',
                lastName: 'User',
                email: 'demo@caregrid.com',
                phone: '+44 7700 900123'
            };
            console.log('No user found, using demo user');
        }
        
        this.loadUserData();
        console.log('DEBUG: About to call loadDashboardData');
        this.loadDashboardData();
        this.updateStats();
        console.log('DEBUG: Dashboard updateUserInfo completed');
    }
    

    
    refreshAppointments() {
        // Reload appointments from API
        this.loadAppointments();
        
        // Update stats and current section data
        this.updateStats();
        
        // If currently viewing appointments section, refresh it
        if (this.currentSection === 'appointments') {
            this.loadAppointments();
        }
        
        // Always refresh the appointments preview on dashboard
        if (this.currentSection === 'overview') {
            this.loadAppointmentsPreview();
        }
    }
    
    loadUserData() {
        // Update user name in various places
        const firstName = this.currentUser.firstName || '';
        const lastName = this.currentUser.lastName || '';
        const userName = `${firstName} ${lastName}`.trim() || 'User';
        
        document.getElementById('userName').textContent = userName;
        document.getElementById('dashboardUserName').textContent = firstName || 'User';
        
        // Load profile form data
        if (document.getElementById('profileFirstName')) {
            document.getElementById('profileFirstName').value = firstName;
            document.getElementById('profileLastName').value = lastName;
            document.getElementById('profileEmail').value = this.currentUser.email || '';
            document.getElementById('profilePhone').value = this.currentUser.phone || '';
        }
    }
    
    bindEvents() {
        // Sidebar navigation
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });
        
        // Navbar navigation links - allow normal navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                // Allow normal navigation for all navbar links
                const href = link.getAttribute('href');
                if (href && (href.startsWith('index.html') || href.startsWith('/'))) {
                    // Let the browser handle the navigation normally
                    // Stop propagation to prevent other handlers from interfering
                    e.stopPropagation();
                    return;
                }
            });
        });
        
        // Note: Hamburger menu is handled by script.js
        
        // Dropdown navigation
        document.querySelectorAll('.dropdown-item[onclick*="showSection"]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                // Extract section name from onclick attribute
                const onclickAttr = item.getAttribute('onclick');
                const match = onclickAttr.match(/showSection\('([^']+)'\)/);
                if (match) {
                    const section = match[1];
                    this.showSection(section);
                    // Close dropdown after selection
                    document.getElementById('userDropdown').classList.remove('active');
                }
            });
        });
        
        // Profile form submission
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        }
        
        // Settings form submission
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsUpdate(e));
        }
        
        // Click outside to close user menu
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown').classList.remove('show');
            }
        });
    }
    
    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show selected section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // Smooth scroll to the section with offset to show title
            setTimeout(() => {
                const rect = targetSection.getBoundingClientRect();
                const offset = 80; // Offset to account for fixed header/sidebar
                window.scrollTo({
                    top: window.pageYOffset + rect.top - offset,
                    behavior: 'smooth'
                });
            }, 100); // Small delay to ensure section is visible before scrolling
        }
        
        // Update sidebar active state
        document.querySelectorAll('.sidebar-link').forEach(link => {
            link.classList.remove('active');
        });
        const sidebarLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (sidebarLink) {
            sidebarLink.classList.add('active');
        }
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        this.loadSectionData(sectionName);
    }
    
    loadSectionData(section) {
        switch (section) {
            case 'appointments':
                this.loadAppointments();
                break;
            case 'favorites':
                this.loadFavorites();
                break;
            case 'reviews':
                this.loadReviews();
                break;
            case 'notifications':
                this.loadNotifications();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }
    
    loadDashboardData() {
        console.log('DEBUG loadDashboardData: Starting...');
        // Use appointments loaded from API or fallback to sample data
        if (!this.appointments || this.appointments.length === 0) {
            this.appointments = this.sampleAppointments;
        }
        console.log('DEBUG loadDashboardData: Loaded appointments:', this.appointments.length);
        
        this.loadAppointmentsPreview();
        this.loadRecentActivity();
        console.log('DEBUG loadDashboardData: Completed');
    }
    
    updateStats() {
        // Ensure appointments is initialized
        if (!this.appointments || !Array.isArray(this.appointments)) {
            this.appointments = this.sampleAppointments || [];
        }
        
        const upcomingCount = this.appointments.filter(apt => apt.status === 'upcoming').length;
        
        document.getElementById('totalAppointments').textContent = this.appointments.length;
        document.getElementById('upcomingAppointments').textContent = upcomingCount;
        document.getElementById('favoriteClinics').textContent = this.sampleFavorites.length;
        document.getElementById('reviewsGiven').textContent = this.sampleReviews.length;
        
        // Update notification badges
        const unreadNotifications = this.sampleNotifications.filter(n => !n.read).length;
        document.getElementById('appointmentsBadge').textContent = upcomingCount;
        document.getElementById('notificationsBadge').textContent = unreadNotifications;
        
        if (unreadNotifications === 0) {
            document.getElementById('notificationsBadge').style.display = 'none';
        }
        
        // Add click functionality to stats cards
        this.addStatsClickHandlers();
    }
    
    addStatsClickHandlers() {
        // Make stats cards clickable
        const statsCards = document.querySelectorAll('.stat-card');
        
        statsCards.forEach((card, index) => {
            card.style.cursor = 'pointer';
            card.addEventListener('click', () => {
                switch(index) {
                    case 0: // Total Appointments
                    case 1: // Upcoming Appointments
                        this.showSection('appointments');
                        break;
                    case 2: // Favorite Clinics
                        this.showSection('favorites');
                        break;
                    case 3: // Reviews Given
                        this.showSection('reviews');
                        break;
                }
            });
            
            // Add hover effect
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            });
        });
    }
    
    loadAppointmentsPreview() {
        const container = document.getElementById('appointmentsPreview');
        console.log('DEBUG loadAppointmentsPreview: Container found:', !!container);
        
        if (!container) {
            console.error('appointmentsPreview container not found!');
            return;
        }
        
        // Ensure appointments is initialized
        if (!this.appointments || !Array.isArray(this.appointments)) {
            this.appointments = this.sampleAppointments || [];
        }
        
        console.log('DEBUG loadAppointmentsPreview: Total appointments:', this.appointments.length);
        console.log('DEBUG loadAppointmentsPreview: All appointments:', this.appointments);
        
        const upcomingAppointments = this.appointments
            .filter(apt => apt.status === 'upcoming')
            .slice(0, 3);
        
        console.log('DEBUG loadAppointmentsPreview: Upcoming appointments:', upcomingAppointments);
        
        if (upcomingAppointments.length === 0) {
            container.innerHTML = `<p class="no-data">No upcoming appointments</p>`;
            return;
        }
        
        container.innerHTML = upcomingAppointments.map(apt => `
            <div class="appointment-preview">
                <div class="appointment-date">
                    <span class="date">${this.formatDate(apt.date)}</span>
                    <span class="time">${apt.time}</span>
                </div>
                <div class="appointment-details">
                    <h4>${apt.clinicName}</h4>
                    <p>${apt.doctor} • ${apt.clinicType}</p>
                </div>
                <div class="appointment-actions">
                    <button class="reschedule-btn" onclick="rescheduleAppointment('${apt.id}')">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                    <button class="cancel-btn" onclick="cancelAppointment('${apt.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    loadAppointments(filter = 'upcoming') {
        const container = document.getElementById('appointmentsList');
        
        // Ensure appointments is initialized
        if (!this.appointments || !Array.isArray(this.appointments)) {
            this.appointments = this.sampleAppointments || [];
        }
        
        let appointments = this.appointments;
        
        if (filter !== 'all') {
            // Handle filter mapping: 'past' filter should show 'completed' appointments
            if (filter === 'past') {
                appointments = appointments.filter(apt => apt.status === 'completed');
            } else {
                appointments = appointments.filter(apt => apt.status === filter);
            }
        }
        
        if (appointments.length === 0) {
            container.innerHTML = '<p class="no-data">No appointments found</p>';
            return;
        }
        
        container.innerHTML = appointments.map(apt => `
            <div class="appointment-card">
                <div class="appointment-header">
                    <div class="clinic-info">
                        <h3>${apt.clinicName}</h3>
                        <span class="clinic-type">${apt.clinicType}</span>
                    </div>
                    <span class="status-badge ${apt.status}">${apt.status}</span>
                </div>
                <div class="appointment-body">
                    <div class="appointment-details">
                        <div class="detail-item">
                            <i class="fas fa-user-md"></i>
                            <span>${apt.doctor}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-calendar"></i>
                            <span>${this.formatDate(apt.date)} at ${apt.time}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${apt.address}</span>
                        </div>
                        <div class="detail-item">
                            <i class="fas fa-phone"></i>
                            <span>${apt.phone}</span>
                        </div>
                    </div>
                </div>
                <div class="appointment-actions">
                    ${apt.status === 'upcoming' ? `
                        <button class="action-btn secondary" onclick="rescheduleAppointment('${apt.id}')">
                            <i class="fas fa-calendar-alt"></i>
                            Reschedule
                        </button>
                        <button class="action-btn danger" onclick="cancelAppointment('${apt.id}')">
                            <i class="fas fa-times"></i>
                            Cancel
                        </button>
                    ` : apt.status === 'completed' ? `
                        <button class="action-btn primary" onclick="writeReview('${apt.id}')">
                            <i class="fas fa-star"></i>
                            Write Review
                        </button>
                        <button class="action-btn secondary" onclick="rebookAppointment('${apt.id}')">
                            <i class="fas fa-redo"></i>
                            Book Again
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    loadFavorites() {
        const container = document.getElementById('favoritesGrid');
        
        if (this.sampleFavorites.length === 0) {
            container.innerHTML = '<p class="no-data">No favorite clinics yet</p>';
            return;
        }
        
        container.innerHTML = this.sampleFavorites.map(clinic => `
            <div class="favorite-card">
                <div class="clinic-image">
                    <img src="${clinic.image}" alt="${clinic.name}" onerror="this.src='images/clinic-placeholder.jpg'">
                    <button class="remove-favorite" onclick="removeFavorite('${clinic.id}')">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
                <div class="clinic-info">
                    <h3>${clinic.name}</h3>
                    <p class="clinic-type">${clinic.type}</p>
                    <div class="rating">
                        <span class="stars">${this.generateStars(clinic.rating)}</span>
                        <span class="rating-value">${clinic.rating}</span>
                    </div>
                    <p class="address">${clinic.address}</p>
                </div>
                <div class="clinic-actions">
                    <a href="clinic-profile.html?id=${clinic.id}" class="action-btn primary">
                        <i class="fas fa-eye"></i>
                        View Details
                    </a>
                    <a href="booking.html?clinic=${clinic.id}" class="action-btn secondary">
                        <i class="fas fa-calendar-plus"></i>
                        Book Now
                    </a>
                </div>
            </div>
        `).join('');
    }
    
    loadReviews() {
        const container = document.getElementById('reviewsList');
        
        if (this.sampleReviews.length === 0) {
            container.innerHTML = '<p class="no-data">No reviews written yet</p>';
            return;
        }
        
        container.innerHTML = this.sampleReviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <h3>${review.clinicName}</h3>
                    <div class="review-rating">
                        <span class="stars">${this.generateStars(review.rating)}</span>
                        <span class="rating-value">${review.rating}/5</span>
                    </div>
                </div>
                <div class="review-content">
                    <p>"${review.comment}"</p>
                </div>
                <div class="review-footer">
                    <span class="review-date">${this.formatDate(review.date)}</span>
                    <span class="helpful-count">
                        <i class="fas fa-thumbs-up"></i>
                        ${review.helpful} found helpful
                    </span>
                </div>
                <div class="review-actions">
                    <button class="action-btn secondary" onclick="editReview('${review.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="action-btn danger" onclick="deleteReview('${review.id}')">
                        <i class="fas fa-trash"></i>
                        Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    loadNotifications() {
        const container = document.getElementById('notificationsList');
        
        if (this.sampleNotifications.length === 0) {
            container.innerHTML = '<p class="no-data">No notifications</p>';
            return;
        }
        
        container.innerHTML = this.sampleNotifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title}</h4>
                    <p>${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
                <div class="notification-actions">
                    ${!notification.read ? `
                        <button class="mark-read-btn" onclick="markAsRead('${notification.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                    <button class="delete-notification-btn" onclick="deleteNotification('${notification.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    loadRecentActivity() {
        // Activity is already loaded in HTML, but could be dynamic
    }
    
    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const updatedData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };
        
        try {
            // Update user profile via API
            const updatedUser = await this.apiService.updateUser(updatedData);
            this.currentUser = updatedUser;
            
            // Update UI
            this.loadUserData();
            
            // Show success message
            this.showSuccessMessage('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showErrorMessage('Failed to update profile. Please try again.');
        }
    }
    
    loadSettings() {
        // Load settings form data if user data exists
        if (this.currentUser && document.getElementById('preferredLanguage')) {
            document.getElementById('preferredLanguage').value = this.currentUser.language || 'en';
            document.getElementById('emailNotifications').checked = this.currentUser.emailNotifications !== false;
            document.getElementById('smsNotifications').checked = this.currentUser.smsNotifications === true;
            document.getElementById('marketingEmails').checked = this.currentUser.marketingEmails === true;
        }
    }
    
    async handleSettingsUpdate(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const settingsData = {
            language: formData.get('language'),
            emailNotifications: formData.get('emailNotifications') === 'on',
            smsNotifications: formData.get('smsNotifications') === 'on',
            marketingEmails: formData.get('marketingEmails') === 'on'
        };
        
        try {
            // Update user settings via API
            const updatedUser = await this.apiService.updateUserSettings(settingsData);
            this.currentUser = updatedUser;
            
            // Show success message
            this.showSuccessMessage('Settings updated successfully!');
        } catch (error) {
            console.error('Error updating settings:', error);
            this.showErrorMessage('Failed to update settings. Please try again.');
        }
    }
    
    clearTestBookings() {
        // Reset appointments to sample data
        this.appointments = this.sampleAppointments;
        this.loadDashboardData();
        
        // Show success message
        this.showSuccessMessage('Dashboard reset to sample data.');
        
        console.log('Dashboard reset to sample data.');
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    }
    
    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }
    
    getNotificationIcon(type) {
        switch (type) {
            case 'appointment': return 'fa-calendar-check';
            case 'review': return 'fa-star';
            case 'system': return 'fa-cog';
            default: return 'fa-bell';
        }
    }
    
    showSuccessMessage(message) {
        // Create and show a temporary success message
        const messageEl = document.createElement('div');
        messageEl.className = 'success-toast';
        messageEl.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #27AE60;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            ">
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
    
    showErrorMessage(message) {
        // Create and show a temporary error message
        const messageEl = document.createElement('div');
        messageEl.className = 'error-toast';
        messageEl.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #E74C3C;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            ">
                <i class="fas fa-exclamation-circle" style="margin-right: 8px;"></i>
                ${message}
            </div>
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick events
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('show');
}

async function logout() {
    try {
        // Logout via API if auth system is available
        if (window.authSystem) {
            await window.authSystem.logout();
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Continue with logout even if API call fails
    }
    
    window.location.href = 'index.html';
}

function showSection(sectionName) {
    if (window.dashboard) {
        window.dashboard.showSection(sectionName);
    }
}

function filterAppointments(filter) {
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Load filtered appointments
    window.dashboard.loadAppointments(filter);
}

function rescheduleAppointment(appointmentId) {
    // For now, redirect to booking page with clinic info
    try {
        const bookings = JSON.parse(localStorage.getItem('careGridBookings') || '[]');
        const appointment = bookings.find(booking => booking.reference === appointmentId);
        
        if (appointment && appointment.clinic) {
            // Redirect to booking page with clinic ID
            window.location.href = `booking.html?clinicId=${appointment.clinic.id}&reschedule=${appointmentId}`;
        } else {
            alert('Unable to find appointment details for rescheduling.');
        }
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        alert('Failed to reschedule appointment. Please try again.');
    }
}

async function cancelAppointment(appointmentId) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
            // Cancel appointment via API if available
            if (window.dashboard && window.dashboard.apiService) {
                await window.dashboard.apiService.cancelAppointment(appointmentId);
                
                // Refresh the appointments display
                await window.dashboard.loadAppointments();
                
                alert('Appointment cancelled successfully!');
            } else {
                // Fallback to localStorage for demo purposes
                const bookings = JSON.parse(localStorage.getItem('careGridBookings') || '[]');
                const updatedBookings = bookings.filter(booking => booking.reference !== appointmentId);
                localStorage.setItem('careGridBookings', JSON.stringify(updatedBookings));
                
                alert('Appointment cancelled successfully!');
                location.reload();
            }
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            alert('Failed to cancel appointment. Please try again.');
        }
    }
}

function writeReview(appointmentId) {
    alert(`Write review for appointment ${appointmentId} - This would open a review modal`);
}

function rebookAppointment(appointmentId) {
    alert(`Rebook appointment ${appointmentId} - This would redirect to booking page`);
}

function removeFavorite(clinicId) {
    if (confirm('Remove this clinic from your favorites?')) {
        alert(`Remove favorite ${clinicId} - This would remove from favorites`);
    }
}

function editReview(reviewId) {
    alert(`Edit review ${reviewId} - This would open an edit modal`);
}

function deleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review?')) {
        alert(`Delete review ${reviewId} - This would delete the review`);
    }
}

function markAsRead(notificationId) {
    alert(`Mark notification ${notificationId} as read`);
}

function deleteNotification(notificationId) {
    alert(`Delete notification ${notificationId}`);
}

function markAllAsRead() {
    alert('Mark all notifications as read');
}



// Global function to refresh appointments (can be called from booking page)
function refreshDashboardAppointments() {
    if (window.dashboard) {
        window.dashboard.refreshAppointments();
    }
}

// Global function for clearing test bookings
function clearTestBookings() {
    if (window.dashboard) {
        window.dashboard.clearTestBookings();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    // Make refresh function globally accessible
    window.refreshDashboardAppointments = refreshDashboardAppointments;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { refreshDashboardAppointments };
}