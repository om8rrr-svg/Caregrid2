// Advanced Search & Filters JavaScript

// Sample data for search suggestions (fallback)
const searchData = {
    clinics: [],
    treatments: [
        "General Checkup", "Dental Cleaning", "Eye Exam", "Blood Test",
        "X-Ray", "Vaccination", "Physical Therapy", "Counseling",
        "Skin Treatment", "Heart Screening", "Allergy Testing",
        "Pregnancy Care", "Child Wellness", "Mental Health Assessment"
    ],
    symptoms: [
        "Headache", "Fever", "Cough", "Back Pain", "Chest Pain",
        "Stomach Pain", "Fatigue", "Dizziness", "Skin Rash",
        "Joint Pain", "Shortness of Breath", "Anxiety", "Depression"
    ]
};

class AdvancedSearch {
    constructor() {
        // Initialize API service
        this.apiService = new APIService();
        
        // Safely get DOM elements
        this.searchInput = document.getElementById('searchInput');
        this.searchSuggestions = document.getElementById('searchSuggestions');
        this.filtersToggle = document.getElementById('filtersToggle');
        this.advancedFilters = document.getElementById('advancedFilters');
        this.clearFiltersBtn = document.getElementById('clearFilters');
        this.applyFiltersBtn = document.getElementById('applyFilters');
        
        this.currentFilters = {
            availability: '',
            treatment: '',
            distance: '',
            rating: '',
            language: '',
            gender: '',
            search: ''
        };
        
        this.activeFilterCount = 0;
        this.selectedSuggestionIndex = -1;
        
        // Debouncing
        this.debounceTimeout = null;
        this.debounceDelay = 500; // 500ms delay
        
        // Loading state
        this.isLoading = false;
        
        // Always try to initialize, but handle errors gracefully
        this.init();
    }
    
    async init() {
        try {
            await this.loadClinicsData();
            this.bindEvents();
            this.updateFiltersToggle();
        } catch (error) {
            console.warn('Search initialization failed:', error.message);
        }
    }
    
    async loadClinicsData() {
        try {
            const clinics = await this.apiService.getClinics();
            searchData.clinics = clinics.map(clinic => ({
                name: clinic.name,
                type: clinic.type,
                location: clinic.address || clinic.location || 'Location not specified'
            }));
        } catch (error) {
            console.warn('Failed to load clinics data from API, using fallback data:', error);
            // Keep empty array as fallback
            searchData.clinics = [];
        }
    }
    
    bindEvents() {
        // Search input events
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => this.handleSearchInput(e));
            this.searchInput.addEventListener('keydown', (e) => this.handleKeyNavigation(e));
            this.searchInput.addEventListener('blur', () => {
                // Delay hiding suggestions to allow for clicks
                setTimeout(() => this.hideSuggestions(), 150);
            });
            this.searchInput.addEventListener('focus', () => {
                if (this.searchInput && this.searchInput.value.length >= 2) {
                    this.showSuggestions(this.searchInput.value);
                }
            });
        }
        
        // Filters toggle
        if (this.filtersToggle) {
            this.filtersToggle.addEventListener('click', () => this.toggleFilters());
        }
        
        // Filter actions
        if (this.clearFiltersBtn) {
            this.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => this.applyFilters());
        }
        
        // Filter change events
        if (this.advancedFilters) {
            const filterSelects = this.advancedFilters.querySelectorAll('select');
            filterSelects.forEach(select => {
                select.addEventListener('change', (e) => this.handleFilterChange(e));
            });
        }
        
        // Click outside to close suggestions
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                this.hideSuggestions();
            }
        });
    }
    
    handleSearchInput(e) {
        const query = e.target.value.trim();
        
        if (query.length >= 2) {
            this.showSuggestions(query);
        } else {
            this.hideSuggestions();
        }
        
        this.selectedSuggestionIndex = -1;
    }
    
    handleKeyNavigation(e) {
        const suggestions = this.searchSuggestions.querySelectorAll('.search-suggestion');
        
        if (suggestions.length === 0) return;
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.min(
                    this.selectedSuggestionIndex + 1,
                    suggestions.length - 1
                );
                this.updateSuggestionHighlight(suggestions);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.selectedSuggestionIndex = Math.max(
                    this.selectedSuggestionIndex - 1,
                    -1
                );
                this.updateSuggestionHighlight(suggestions);
                break;
                
            case 'Enter':
                e.preventDefault();
                if (this.selectedSuggestionIndex >= 0) {
                    this.selectSuggestion(suggestions[this.selectedSuggestionIndex]);
                } else {
                    this.performSearch(this.searchInput.value);
                }
                break;
                
            case 'Escape':
                this.hideSuggestions();
                this.searchInput.blur();
                break;
        }
    }
    
    updateSuggestionHighlight(suggestions) {
        suggestions.forEach((suggestion, index) => {
            suggestion.classList.toggle('highlighted', index === this.selectedSuggestionIndex);
        });
    }
    
    showSuggestions(query) {
        if (!this.searchSuggestions) return;
        
        const suggestions = this.generateSuggestions(query);
        
        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }
        
        this.searchSuggestions.innerHTML = suggestions.map(suggestion => 
            this.createSuggestionHTML(suggestion)
        ).join('');
        
        this.searchSuggestions.style.display = 'block';
        
        // Add click events to suggestions
        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => this.selectSuggestion(el));
        });
    }
    
    hideSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.display = 'none';
        }
        this.selectedSuggestionIndex = -1;
    }
    
    generateSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Search clinics
        searchData.clinics.forEach(clinic => {
            if ((clinic.name || '').toLowerCase().includes(queryLower) || 
                (clinic.type || '').toLowerCase().includes(queryLower)) {
                suggestions.push({
                    type: 'clinic',
                    title: clinic.name,
                    subtitle: `${clinic.type} • ${clinic.location}`,
                    icon: '<i class="fas fa-hospital"></i>',
                    data: clinic
                });
            }
        });
        
        // Search treatments
        searchData.treatments.forEach(treatment => {
            if (treatment.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    type: 'treatment',
                    title: treatment,
                    subtitle: 'Treatment/Service',
                    icon: '<i class="fas fa-pills"></i>',
                    data: { name: treatment }
                });
            }
        });
        
        // Search symptoms
        searchData.symptoms.forEach(symptom => {
            if (symptom.toLowerCase().includes(queryLower)) {
                suggestions.push({
                    type: 'symptom',
                    title: symptom,
                    subtitle: 'Symptom',
                    icon: '🔍',
                    data: { name: symptom }
                });
            }
        });
        
        return suggestions.slice(0, 8); // Limit to 8 suggestions
    }
    
    createSuggestionHTML(suggestion) {
        return `
            <div class="search-suggestion" data-type="${suggestion.type}" data-value="${suggestion.title}">
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-text">
                    <div class="suggestion-title">${suggestion.title}</div>
                    <div class="suggestion-subtitle">${suggestion.subtitle}</div>
                </div>
            </div>
        `;
    }
    
    selectSuggestion(suggestionEl) {
        const value = suggestionEl.dataset.value;
        const type = suggestionEl.dataset.type;
        
        this.searchInput.value = value;
        this.hideSuggestions();
        
        // Perform search based on suggestion type
        this.performSearch(value, type);
    }
    
    performSearch(query, type = 'general') {
        console.log(`Performing search for: "${query}" (type: ${type})`);
        
        // Here you would implement the actual search logic
        // For now, we'll just filter the existing clinic cards
        this.filterClinics(query, type);
        
        // Add search term to recent searches (could be stored in localStorage)
        this.addToRecentSearches(query);
        
        // Scroll to results section if search has content
        if (query && query.trim().length > 0) {
            const clinicGrid = document.getElementById('clinicGrid');
            if (clinicGrid) {
                // Add a small delay to ensure filters are applied first
                setTimeout(() => {
                    clinicGrid.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 150);
            }
        }
    }
    
    filterClinics(query, type) {
        // Use the global search functionality from script.js if available
        if (typeof window.currentFilters !== 'undefined' && typeof window.applyFilters === 'function') {
            window.currentFilters.search = query.toLowerCase().trim();
            window.applyFilters();
        } else {
            // Fallback to DOM-based filtering
            const clinicCards = document.querySelectorAll('.clinic-card');
            const queryLower = query.toLowerCase();
            
            clinicCards.forEach(card => {
                const clinicName = card.querySelector('.clinic-name')?.textContent?.toLowerCase() || '';
                const clinicType = card.querySelector('.clinic-type')?.textContent?.toLowerCase() || '';
                const clinicLocation = card.querySelector('.clinic-location')?.textContent?.toLowerCase() || '';
                
                const matches = clinicName.includes(queryLower) || 
                              clinicType.includes(queryLower) || 
                              clinicLocation.includes(queryLower);
                
                card.style.display = matches ? 'block' : 'none';
            });
        }
        
        // Update results count
        this.updateResultsCount();
    }
    
    updateResultsCount(total = null) {
        const resultsText = document.querySelector('.results-count');
        
        if (resultsText) {
            if (total !== null) {
                resultsText.textContent = `${total} clinic${total !== 1 ? 's' : ''} found`;
            } else {
                const visibleCards = document.querySelectorAll('.clinic-card[style*="block"], .clinic-card:not([style*="none"])');
                resultsText.textContent = `${visibleCards.length} clinic${visibleCards.length !== 1 ? 's' : ''} found`;
            }
        }
    }
    
    toggleFilters() {
        if (!this.advancedFilters || !this.filtersToggle) return;
        
        const isActive = this.advancedFilters.classList.contains('active');
        
        if (isActive) {
            this.advancedFilters.classList.remove('active');
            this.filtersToggle.classList.remove('active');
        } else {
            this.advancedFilters.classList.add('active');
            this.filtersToggle.classList.add('active');
        }
    }
    
    handleFilterChange(e) {
        const filterName = e.target.name;
        const filterValue = e.target.value;
        
        this.currentFilters[filterName] = filterValue;
        
        // Add visual indicator for active filter
        if (filterValue) {
            e.target.parentElement.classList.add('filter-active');
        } else {
            e.target.parentElement.classList.remove('filter-active');
        }
        
        this.updateActiveFilterCount();
        this.updateFiltersToggle();
        
        // Debounce the filter application
        this.debounceFilterApplication();
    }
    
    debounceFilterApplication() {
        // Clear existing timeout
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
        
        // Set new timeout
        this.debounceTimeout = setTimeout(() => {
            this.applyFiltersWithAPI();
        }, this.debounceDelay);
    }
    
    async applyFiltersWithAPI() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.showLoadingState();
        
        try {
            // Build filter params for API
            const params = {};
            
            Object.entries(this.currentFilters).forEach(([key, value]) => {
                if (value && value !== '') {
                    params[key] = value;
                }
            });
            
            // Add search query if exists
            if (this.searchInput && this.searchInput.value.trim()) {
                params.search = this.searchInput.value.trim();
            }
            
            console.log('Applying filters with API params:', params);
            
            // Use AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            // Call API with filters
            const response = await fetch(this.apiService.buildUrl('/api/clinics'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filters: params }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Update the clinic cards with filtered results
            this.updateClinicsDisplay(data.clinics || []);
            this.updateResultsCount(data.total || 0);
            
        } catch (error) {
            console.error('Filter API error:', error);
            
            if (error.name === 'AbortError') {
                this.showError('Request timeout. Please try again.');
            } else {
                this.showError('Failed to apply filters. Using local filtering as fallback.');
                // Fallback to local filtering
                this.filterClinicsByAdvancedFilters();
            }
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    showLoadingState() {
        // Show loading spinner
        const loadingIndicator = document.getElementById('loadingIndicator') || this.createLoadingIndicator();
        loadingIndicator.style.display = 'block';
        
        // Disable filter controls
        if (this.advancedFilters) {
            this.advancedFilters.style.opacity = '0.6';
            this.advancedFilters.style.pointerEvents = 'none';
        }
    }
    
    hideLoadingState() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        
        // Re-enable filter controls
        if (this.advancedFilters) {
            this.advancedFilters.style.opacity = '1';
            this.advancedFilters.style.pointerEvents = 'auto';
        }
    }
    
    createLoadingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'loadingIndicator';
        indicator.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0,0,0,0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                z-index: 10000;
                display: none;
            ">
                <i class="fas fa-spinner fa-spin"></i>
                <span style="margin-left: 10px;">Applying filters...</span>
            </div>
        `;
        document.body.appendChild(indicator);
        return indicator;
    }
    
    updateClinicsDisplay(clinics) {
        const clinicsContainer = document.querySelector('.clinics-grid') || document.querySelector('.clinic-cards');
        
        if (!clinicsContainer) {
            console.warn('Clinics container not found');
            return;
        }
        
        if (clinics.length === 0) {
            clinicsContainer.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>No clinics found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                    <button onclick="window.advancedSearch?.clearAllFilters()" class="btn btn-primary">
                        Clear Filters
                    </button>
                </div>
            `;
            return;
        }
        
        // Update the existing clinic cards or render new ones
        clinicsContainer.innerHTML = clinics.map(clinic => this.renderClinicCard(clinic)).join('');
    }
    
    renderClinicCard(clinic) {
        return `
            <div class="clinic-card" data-clinic-id="${clinic.id}">
                <div class="clinic-image">
                    <img src="${clinic.image || 'images/clinic-placeholder.jpg'}" 
                         alt="${clinic.name}" 
                         onerror="this.src='images/clinic-placeholder.jpg'">
                </div>
                <div class="clinic-info">
                    <h3 class="clinic-name">${clinic.name}</h3>
                    <p class="clinic-type">${clinic.type}</p>
                    <div class="clinic-location">${clinic.address || clinic.location}</div>
                    <div class="clinic-rating">
                        <span class="rating">${clinic.rating || 'N/A'}</span>
                        <span class="reviews">(${clinic.reviewCount || 0} reviews)</span>
                    </div>
                </div>
                <div class="clinic-actions">
                    <a href="clinic-profile.html?id=${clinic.id}" class="btn btn-outline">
                        View Details
                    </a>
                    <a href="booking.html?clinic=${clinic.id}" class="btn btn-primary">
                        Book Now
                    </a>
                </div>
            </div>
        `;
    }
    
    showError(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #dc3545;
            color: white;
            padding: 12px 16px;
            border-radius: 4px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
    
    updateActiveFilterCount() {
        this.activeFilterCount = Object.values(this.currentFilters)
            .filter(value => value !== '').length;
    }
    
    updateFiltersToggle() {
        if (!this.filtersToggle) return;
        
        const countSpan = this.filtersToggle.querySelector('.filters-count');
        
        if (this.activeFilterCount > 0) {
            if (!countSpan) {
                const span = document.createElement('span');
                span.className = 'filters-count';
                span.textContent = this.activeFilterCount;
                this.filtersToggle.appendChild(span);
            } else {
                countSpan.textContent = this.activeFilterCount;
            }
        } else if (countSpan) {
            countSpan.remove();
        }
    }
    
    clearAllFilters() {
        // Reset all filter values
        Object.keys(this.currentFilters).forEach(key => {
            this.currentFilters[key] = '';
        });
        
        // Reset all select elements
        if (this.advancedFilters) {
            const filterSelects = this.advancedFilters.querySelectorAll('select');
            filterSelects.forEach(select => {
                select.value = '';
                select.parentElement.classList.remove('filter-active');
            });
        }
        
        this.activeFilterCount = 0;
        this.updateFiltersToggle();
        
        // Show all clinics
        this.showAllClinics();
    }
    
    applyFilters() {
        console.log('Applying filters:', this.currentFilters);
        
        // Here you would implement the actual filtering logic
        // For now, we'll just simulate filtering
        this.filterClinicsByAdvancedFilters();
        
        // Close filters panel
        if (this.advancedFilters) {
            this.advancedFilters.classList.remove('active');
        }
        if (this.filtersToggle) {
            this.filtersToggle.classList.remove('active');
        }
        
        // Show success message
        this.showFilterAppliedMessage();
    }
    
    filterClinicsByAdvancedFilters() {
        const clinicCards = document.querySelectorAll('.clinic-card');
        
        clinicCards.forEach(card => {
            let shouldShow = true;
            
            // Apply each filter
            if (this.currentFilters.availability && this.currentFilters.availability !== '') {
                // Simulate availability filtering
                const isAvailable = Math.random() > 0.3; // 70% chance of being available
                if (this.currentFilters.availability === 'today' && !isAvailable) {
                    shouldShow = false;
                }
            }
            
            if (this.currentFilters.rating && this.currentFilters.rating !== '') {
                const rating = parseFloat(card.querySelector('.rating')?.textContent || '0');
                const minRating = parseFloat(this.currentFilters.rating);
                if (rating < minRating) {
                    shouldShow = false;
                }
            }
            
            // Add more filter logic here...
            
            card.style.display = shouldShow ? 'block' : 'none';
        });
        
        this.updateResultsCount();
    }
    
    showAllClinics() {
        const clinicCards = document.querySelectorAll('.clinic-card');
        clinicCards.forEach(card => {
            card.style.display = 'block';
        });
        this.updateResultsCount();
    }
    
    showFilterAppliedMessage() {
        // Create and show a temporary success message
        const message = document.createElement('div');
        message.className = 'filter-success-message';
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #27AE60;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease;
            ">
                ✓ Filters applied successfully
            </div>
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.remove();
        }, 3000);
    }
    
    addToRecentSearches(query) {
        let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        // Remove if already exists
        recentSearches = recentSearches.filter(search => search !== query);
        
        // Add to beginning
        recentSearches.unshift(query);
        
        // Keep only last 10 searches
        recentSearches = recentSearches.slice(0, 10);
        
        localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if search elements exist on the page
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const searchContainer = document.querySelector('.search-container');
    
    if (searchInput || searchResults || searchContainer) {
        try {
            new AdvancedSearch();
        } catch (error) {
            console.warn('Search functionality not available on this page:', error.message);
        }
    }
});

// Add CSS animation for success message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);