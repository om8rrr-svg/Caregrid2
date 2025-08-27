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
        const token = this.apiService?.getStoredToken();
        if (!token) {
            // Not logged in: go to login
            window.location.replace('auth.html');
            return;
        }

        // Try cached user immediately (no flash)
        const cached = localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser');
        if (cached) {
            try {
                this.currentUser = JSON.parse(cached);
                this.updateWelcomeMessage(); // show UI immediately
            } catch (e) {
                console.warn('Failed to parse cached user data:', e);
            }
        }

        // Then fetch fresh user; only log out on definite 401
        try {
            const me = await this.apiService.me(); // GET /auth/me
            const user = me.data || me;
            localStorage.setItem('careGridCurrentUser', JSON.stringify(user));
            this.currentUser = user;
            this.updateWelcomeMessage();
        } catch (e) {
            // If it's an auth error, clear and go to login
            if (String(e).startsWith('401')) {
                localStorage.removeItem('careGridToken');
                localStorage.removeItem('careGridCurrentUser');
                sessionStorage.removeItem('careGridToken');
                sessionStorage.removeItem('careGridCurrentUser');
                window.location.replace('auth.html');
                return;
            }
            // Otherwise keep cached user and continue
            console.warn('Non-auth error fetching /auth/me, continuing:', e);
        }
    }
    
    async loadAppointments() {
        try {
            if (this.apiService && this.apiService.getStoredToken()) {
                console.log('Dashboard: Loading appointments from API');
                const response = await this.apiService.getAppointments();
                this.appointments = response.appointments || response.data || [];
                console.log('DEBUG: Loaded appointments from API:', this.appointments.length);
            } else {
                console.log('Dashboard: No token, no appointments to load');
                this.appointments = [];
            }
        } catch (error) {
            console.warn('Error loading appointments from API:', error);
            this.appointments = [];
        }
    }
    
    isDemoUser() {
        return false; // No demo users in production
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
        this.bindEvents();
        this.updateUserInfo();
        this.showSection('overview');
        this.loadRecentActivity();
        console.log('Dashboard initialization completed');
    }
    
    updateUserInfo() {
        console.log('Dashboard updateUserInfo started');
        // Check if user is logged in
        if (!this.currentUser) {
            // No user logged in - redirect to auth
            console.log('No user found, redirecting to authentication');
            window.location.replace('auth.html');
            return;
        }
        
        this.loadUserData();
        console.log('About to call loadDashboardData');
        this.loadDashboardData();
        this.updateStats();
        console.log('Dashboard updateUserInfo completed');
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
        console.log('loadDashboardData: Starting...');
        // Use appointments loaded from API
        if (!this.appointments || !Array.isArray(this.appointments)) {
            this.appointments = [];
        }
        console.log('loadDashboardData: Loaded appointments:', this.appointments.length);
        
        this.loadAppointmentsPreview();
        this.loadRecentActivity();
        console.log('loadDashboardData: Completed');
    }
    
    updateStats() {
        // Ensure appointments is initialized
        if (!this.appointments || !Array.isArray(this.appointments)) {
            this.appointments = [];
        }
        
        const upcomingCount = this.appointments.filter(apt => apt.status === 'upcoming').length;
        
        // Show real data counts only
        const favoritesCount = 0; // Will be loaded from API when available
        const reviewsCount = 0; // Will be loaded from API when available
        const notificationsCount = 0; // Will be loaded from API when available
        
        document.getElementById('totalAppointments').textContent = this.appointments.length;
        document.getElementById('upcomingAppointments').textContent = upcomingCount;
        document.getElementById('favoriteClinics').textContent = favoritesCount;
        document.getElementById('reviewsGiven').textContent = reviewsCount;
        
        // Update notification badges
        document.getElementById('appointmentsBadge').textContent = upcomingCount;
        document.getElementById('notificationsBadge').textContent = notificationsCount;
        
        if (notificationsCount === 0) {
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
            
            // Add smooth hover effect with transition
            card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
            
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-1px)';
                card.style.boxShadow = '0 3px 15px rgba(0,0,0,0.12)';
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
            this.appointments = [];
        }
        
        console.log('loadAppointmentsPreview: Total appointments:', this.appointments.length);
        console.log('loadAppointmentsPreview: All appointments:', this.appointments);
        
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
            this.appointments = [];
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
        
        // Load favorites from API when available
        const favorites = [];
        
        if (favorites.length === 0) {
            container.innerHTML = '<p class="no-data">No favorite clinics yet. Start exploring and add clinics to your favorites!</p>';
            return;
        }
        
        container.innerHTML = favorites.map(clinic => `
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
        
        // Load reviews from API when available
        const reviews = [];
        
        if (reviews.length === 0) {
            container.innerHTML = '<p class="no-data">No reviews written yet. Visit a clinic and share your experience!</p>';
            return;
        }
        
        container.innerHTML = reviews.map(review => `
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
        
        // Load notifications from API when available
        const notifications = [];
        
        if (notifications.length === 0) {
            container.innerHTML = '<p class="no-data">No new notifications</p>';
            return;
        }
        
        container.innerHTML = notifications.map(notification => `
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
    
    async loadRecentActivity() {
        try {
            const activityList = document.getElementById('activityList');
            if (!activityList) return;
            
            const activities = [];
            
            // Get recent bookings from localStorage and API
            const bookings = JSON.parse(localStorage.getItem('careGridBookings') || '[]');
            bookings.slice(-3).forEach(booking => {
                activities.push({
                    type: 'booking',
                    icon: 'fas fa-calendar-plus',
                    text: `Appointment booked at ${booking.clinic?.name || 'Unknown Clinic'}`,
                    time: this.getRelativeTime(booking.createdAt || new Date().toISOString())
                });
            });
            
            // Get recent reviews from localStorage
            const reviews = JSON.parse(localStorage.getItem('careGridReviews') || '[]');
            reviews.slice(-2).forEach(review => {
                activities.push({
                    type: 'review',
                    icon: 'fas fa-star',
                    text: `Review submitted for ${review.clinicName || 'clinic'}`,
                    time: this.getRelativeTime(review.createdAt || new Date().toISOString())
                });
            });
            
            // Get favorites from localStorage
            const favorites = JSON.parse(localStorage.getItem('careGridFavorites') || '[]');
            if (favorites.length > 0) {
                const latestFavorite = favorites[favorites.length - 1];
                activities.push({
                    type: 'favorite',
                    icon: 'fas fa-heart',
                    text: `Added to favorites ${latestFavorite.name || 'clinic'}`,
                    time: this.getRelativeTime(latestFavorite.addedAt || new Date().toISOString())
                });
            }
            
            // Sort by time and take the most recent 3
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            const recentActivities = activities.slice(0, 3);
            
            if (recentActivities.length === 0) {
                activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
                return;
            }
            
            activityList.innerHTML = recentActivities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${activity.icon}"></i>
                    </div>
                    <div class="activity-content">
                        <p><strong>${activity.text}</strong></p>
                        <span class="activity-time">${activity.time}</span>
                    </div>
                </div>
            `).join('');
            
        } catch (error) {
            console.error('Error loading recent activity:', error);
        }
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
            const response = await this.apiService.updateProfile(updatedData);
            this.currentUser = response.data || response.user || response;
            
            // Update localStorage/sessionStorage
            const storage = localStorage.getItem('careGridCurrentUser') ? localStorage : sessionStorage;
            storage.setItem('careGridCurrentUser', JSON.stringify(this.currentUser));
            
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
        // Clear all appointments 
        this.appointments = [];
        this.loadDashboardData();
        
        // Show success message
        this.showSuccessMessage('All appointments cleared.');
        
        console.log('All appointments cleared.');
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    }
    
    getRelativeTime(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInMs = now - date;
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInHours / 24);
        
        if (diffInHours < 1) {
            return 'Just now';
        } else if (diffInHours < 24) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        } else if (diffInDays < 7) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString('en-GB');
        }
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
        } else {
            // Fallback logout if auth system not available
            localStorage.removeItem('careGridCurrentUser');
            sessionStorage.removeItem('careGridCurrentUser');
            localStorage.removeItem('careGridToken');
            sessionStorage.removeItem('careGridToken');
            
            // Dispatch auth state change event to update navigation
            window.dispatchEvent(new CustomEvent('authStateChanged'));
        }
    } catch (error) {
        console.error('Error during logout:', error);
        // Continue with logout even if API call fails
        localStorage.removeItem('careGridCurrentUser');
        sessionStorage.removeItem('careGridCurrentUser');
        localStorage.removeItem('careGridToken');
        sessionStorage.removeItem('careGridToken');
        
        // Dispatch auth state change event to update navigation
        window.dispatchEvent(new CustomEvent('authStateChanged'));
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
                // Handle cancellation through local bookings if available
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
document.addEventListener('DOMContentLoaded', async () => {
    window.dashboard = new Dashboard();
    await window.dashboard.init();
    
    // Make refresh function globally accessible
    window.refreshDashboardAppointments = refreshDashboardAppointments;
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { refreshDashboardAppointments };
}