import { CloudAssets } from './cloud-config.js';

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
            // Import clinic service dynamically to avoid circular dependencies
            const { default: clinicService } = await import('./clinic-service.js');
            const clinics = await clinicService.getClinics();
            searchData.clinics = clinics.map(clinic => ({
                name: clinic.name,
                type: clinic.type,
                location: clinic.address || clinic.location || 'Location not specified'
            }));
        } catch (error) {
            console.warn('Failed to load clinics data from cloud service, using fallback data:', error);
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
        
        // Show loading state for better UX
        this.showSuggestionsLoading();
        
        // Debounce suggestion generation for better performance
        clearTimeout(this.suggestionTimeout);
        this.suggestionTimeout = setTimeout(() => {
            const suggestions = this.generateSuggestions(query);
            
            if (suggestions.length === 0) {
                this.showNoSuggestions(query);
                return;
            }
            
            // Group suggestions by type for better organization
            const groupedSuggestions = this.groupSuggestionsByType(suggestions);
            
            this.searchSuggestions.innerHTML = this.createGroupedSuggestionsHTML(groupedSuggestions);
            this.searchSuggestions.style.display = 'block';
            
            // Add enhanced interactions
            this.bindSuggestionEvents();
            
            // Add animation
            this.animateSuggestions();
        }, 150);
    }
    
    hideSuggestions() {
        if (this.searchSuggestions) {
            this.searchSuggestions.style.opacity = '0';
            this.searchSuggestions.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                this.searchSuggestions.style.display = 'none';
                this.searchSuggestions.style.opacity = '1';
                this.searchSuggestions.style.transform = 'translateY(0)';
            }, 200);
        }
        this.selectedSuggestionIndex = -1;
    }
    
    generateSuggestions(query) {
        const suggestions = [];
        const queryLower = query.toLowerCase();
        
        // Enhanced clinic search with fuzzy matching
        searchData.clinics.forEach(clinic => {
            const nameMatch = (clinic.name || '').toLowerCase().includes(queryLower);
            const typeMatch = (clinic.type || '').toLowerCase().includes(queryLower);
            const locationMatch = (clinic.location || '').toLowerCase().includes(queryLower);
            
            if (nameMatch || typeMatch || locationMatch) {
                const relevanceScore = this.calculateRelevanceScore(clinic, queryLower);
                suggestions.push({
                    type: 'clinic',
                    title: clinic.name,
                    subtitle: `${clinic.type} • ${clinic.location}`,
                    icon: '<i class="fas fa-hospital"></i>',
                    data: clinic,
                    relevance: relevanceScore,
                    matchType: nameMatch ? 'name' : (typeMatch ? 'type' : 'location')
                });
            }
        });
        
        // Enhanced treatment search with categories
        searchData.treatments.forEach(treatment => {
            if (treatment.toLowerCase().includes(queryLower)) {
                const category = this.getTreatmentCategory(treatment);
                suggestions.push({
                    type: 'treatment',
                    title: treatment,
                    subtitle: `${category} • Treatment/Service`,
                    icon: '<i class="fas fa-pills"></i>',
                    data: { name: treatment, category },
                    relevance: this.calculateTextRelevance(treatment, queryLower)
                });
            }
        });
        
        // Enhanced symptom search with related conditions
        searchData.symptoms.forEach(symptom => {
            if (symptom.toLowerCase().includes(queryLower)) {
                const relatedTreatments = this.getRelatedTreatments(symptom);
                suggestions.push({
                    type: 'symptom',
                    title: symptom,
                    subtitle: `Symptom • May need: ${relatedTreatments.join(', ')}`,
                    icon: '<i class="fas fa-search"></i>',
                    data: { name: symptom, relatedTreatments },
                    relevance: this.calculateTextRelevance(symptom, queryLower)
                });
            }
        });
        
        // Add recent searches if query is short
        if (query.length <= 3) {
            const recentSearches = this.getRecentSearches();
            recentSearches.forEach(search => {
                if (search.toLowerCase().includes(queryLower)) {
                    suggestions.push({
                        type: 'recent',
                        title: search,
                        subtitle: 'Recent search',
                        icon: '<i class="fas fa-history"></i>',
                        data: { query: search },
                        relevance: 0.5
                    });
                }
            });
        }
        
        // Sort by relevance and return top suggestions
        return suggestions
            .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
            .slice(0, 8);
    }
    
    createSuggestionHTML(suggestion) {
        const highlightedTitle = this.highlightMatch(suggestion.title, this.searchInput.value);
        const matchBadge = suggestion.matchType ? `<span class="match-badge match-${suggestion.matchType}">${suggestion.matchType}</span>` : '';
        const relevanceClass = suggestion.relevance > 0.8 ? 'high-relevance' : (suggestion.relevance > 0.5 ? 'medium-relevance' : 'low-relevance');
        
        return `
            <div class="search-suggestion ${relevanceClass}" data-type="${suggestion.type}" data-value="${suggestion.title}" role="option" tabindex="-1" aria-label="${suggestion.title}, ${suggestion.type}">
                <div class="suggestion-icon" aria-hidden="true">${suggestion.icon}</div>
                <div class="suggestion-text">
                    <div class="suggestion-title">${highlightedTitle} ${matchBadge}</div>
                    <div class="suggestion-subtitle">${suggestion.subtitle}</div>
                </div>
                <div class="suggestion-action" aria-hidden="true">
                    <i class="fas fa-arrow-right"></i>
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
            let count, text;
            if (total !== null) {
                count = total;
                text = `${total} clinic${total !== 1 ? 's' : ''} found`;
            } else {
                const visibleCards = document.querySelectorAll('.clinic-card[style*="block"], .clinic-card:not([style*="none"])');
                count = visibleCards.length;
                text = `${count} clinic${count !== 1 ? 's' : ''} found`;
            }
            
            resultsText.textContent = text;
            resultsText.setAttribute('aria-live', 'polite');
            resultsText.setAttribute('role', 'status');
            
            // Announce to screen readers
            if (window.accessibilityHelper) {
                window.accessibilityHelper.announceToScreenReader(text);
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
    
    async applyFiltersWithAPI(retryCount = 0) {
        if (this.isLoading) return;
        
        const maxRetries = 2;
        const baseDelay = 1000; // 1 second
        
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
            
            // Only log in development mode
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.log(`Applying filters with API params (attempt ${retryCount + 1}/${maxRetries + 1}):`, params);
            }
            
            // Use AbortController for timeout with dynamic timeout based on retry
            const controller = new AbortController();
            const timeout = retryCount === 0 ? 15000 : 30000; // Shorter timeout for first attempt
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            
            // Call API with filters using the enhanced API service
            const response = await this.apiService.makeRequestWithRetry('/api/clinics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ filters: params }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            // Handle response
            const data = response.data || response;
            
            // Update the clinic cards with filtered results
            this.updateClinicsDisplay(data.clinics || []);
            this.updateResultsCount(data.total || 0);
            
            // Cache successful search results
            this.cacheSearchResults(params, data);
            
        } catch (error) {
            // Implement retry logic with exponential backoff
            if (retryCount < maxRetries && this.shouldRetrySearch(error)) {
                const delay = baseDelay * Math.pow(2, retryCount);
                
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                    console.warn(`⚠️ Search API request failed (attempt ${retryCount + 1}), retrying in ${delay}ms:`, error.message);
                }
                
                this.showRetryMessage(retryCount + 1, maxRetries);
                
                setTimeout(() => {
                    this.applyFiltersWithAPI(retryCount + 1);
                }, delay);
                return;
            }
            
            // All retries exhausted or non-retryable error
            this.handleSearchError(error);
            
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    // Determine if a search error should trigger a retry
    shouldRetrySearch(error) {
        const retryableErrors = [
            'timeout',
            'NETWORK_ERROR',
            'RATE_LIMITED',
            'SERVER_ERROR',
            'AbortError'
        ];
        
        return retryableErrors.some(retryableError => 
            error.message.includes(retryableError) || 
            error.name === retryableError ||
            (error.status >= 500 && error.status < 600) // Server errors
        );
    }
    
    // Handle search errors with appropriate fallbacks
    handleSearchError(error) {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.error('Search API error after retries:', error);
        }
        
        // Use enhanced error handling if available
        if (window.errorHandler) {
            window.errorHandler.handleError(error, 'search', {
                retryFunction: () => this.applyFiltersWithAPI(0),
                fallbackFunction: () => this.filterClinicsByAdvancedFilters()
            });
        } else {
            // Fallback to basic error handling
            if (error.name === 'AbortError') {
                this.showError('Search timeout. Using local search as fallback.');
            } else if (error.message.includes('RATE_LIMITED')) {
                this.showError('Service busy. Using local search as fallback.');
            } else if (error.message.includes('BACKEND_UNAVAILABLE')) {
                this.showError('Service temporarily unavailable. Using local search.');
            } else {
                this.showError('Search service unavailable. Using local search as fallback.');
            }
        }
        
        // Always fallback to local filtering
        this.filterClinicsByAdvancedFilters();
    }
    
    // Show retry message to user
    showRetryMessage(attempt, maxAttempts) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            const messageEl = loadingIndicator.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = `Retrying search... (${attempt}/${maxAttempts})`;
            }
        }
        
        // Also show a temporary toast message
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10001;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        toast.textContent = `Search failed. Retrying... (${attempt}/${maxAttempts})`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }
    
    // Cache search results for better performance
    cacheSearchResults(params, data) {
        try {
            const cacheKey = `search_${JSON.stringify(params)}`;
            const cacheData = {
                data: data,
                timestamp: Date.now(),
                params: params
            };
            
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));
            
            // Clean old cache entries (keep only last 10)
            this.cleanSearchCache();
        } catch (e) {
            // localStorage might be full, ignore caching errors
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.warn('Failed to cache search results:', e.message);
            }
        }
    }
    
    // Clean old search cache entries
    cleanSearchCache() {
        try {
            const searchKeys = Object.keys(localStorage).filter(key => key.startsWith('search_'));
            
            if (searchKeys.length > 10) {
                // Sort by timestamp and remove oldest entries
                const entries = searchKeys.map(key => {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        return { key, timestamp: data.timestamp || 0 };
                    } catch {
                        return { key, timestamp: 0 };
                    }
                }).sort((a, b) => a.timestamp - b.timestamp);
                
                // Remove oldest entries
                const toRemove = entries.slice(0, entries.length - 10);
                toRemove.forEach(entry => localStorage.removeItem(entry.key));
            }
        } catch (e) {
            // Ignore cache cleanup errors
        }
    }
    
    showLoadingState() {
        // Show skeleton loading state for search results
        const resultsContainer = document.querySelector('.clinics-grid') || document.querySelector('.clinic-cards');
        if (resultsContainer && window.skeletonLoader) {
            window.skeletonLoader.show(resultsContainer, 'search-results', { count: 4 });
        } else {
            // Fallback to loading spinner
            const loadingIndicator = document.getElementById('loadingIndicator') || this.createLoadingIndicator();
            loadingIndicator.style.display = 'block';
        }
        
        // Disable filter controls
        if (this.advancedFilters) {
            this.advancedFilters.style.opacity = '0.6';
            this.advancedFilters.style.pointerEvents = 'none';
        }
    }
    
    hideLoadingState() {
        // Hide skeleton loading state for search results
        const resultsContainer = document.querySelector('.clinics-grid') || document.querySelector('.clinic-cards');
        if (resultsContainer && window.skeletonLoader && window.skeletonLoader.isLoading(resultsContainer)) {
            window.skeletonLoader.hide(resultsContainer);
        } else {
            // Fallback to hiding loading spinner
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
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
                text-align: center;
                min-width: 200px;
            ">
                <div class="loading-spinner" style="
                    width: 20px;
                    height: 20px;
                    border: 2px solid #ffffff40;
                    border-top: 2px solid #ffffff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 10px;
                "></div>
                <div class="loading-message">Searching clinics...</div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
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
            <article class="clinic-card" data-clinic-id="${clinic.id}" role="listitem" aria-labelledby="clinic-name-${clinic.id}">
                <div class="clinic-image">
                    <img src="${clinic.image || CloudAssets.getImageUrl("clinic-placeholder.jpg")}" 
                         alt="${clinic.name} clinic exterior" 
                         loading="lazy"
                         onerror="this.src=CloudAssets.getImageUrl("clinic-placeholder.jpg")">
                </div>
                <div class="clinic-info">
                    <h3 class="clinic-name" id="clinic-name-${clinic.id}">${clinic.name}</h3>
                    <p class="clinic-type" role="text">${clinic.type}</p>
                    <div class="clinic-location" aria-label="Address: ${clinic.address || clinic.location}">
                        <i class="fas fa-map-marker-alt" aria-hidden="true"></i>
                        ${clinic.address || clinic.location}
                    </div>
                    <div class="clinic-rating" role="group" aria-label="Rating information">
                        <span class="rating" aria-label="${clinic.rating || 'N/A'} out of 5 stars">${clinic.rating || 'N/A'}</span>
                        <span class="reviews">(${clinic.reviewCount || 0} reviews)</span>
                    </div>
                </div>
                <div class="clinic-actions" role="group" aria-label="Clinic actions">
                    <a href="clinic-profile.html?id=${clinic.id}" class="btn btn-outline" aria-describedby="clinic-name-${clinic.id}">
                        <i class="fas fa-eye" aria-hidden="true"></i>
                        View Details
                    </a>
                    <a href="booking.html?clinicId=${clinic.id}" class="btn btn-primary" aria-describedby="clinic-name-${clinic.id}">
                        <i class="fas fa-calendar-plus" aria-hidden="true"></i>
                        Book Now
                    </a>
                </div>
            </article>
        `;
    }
    
    showError(message) {
        // Use enhanced error display if available
        if (window.errorHandler && window.errorHandler.showUserFriendlyError) {
            window.errorHandler.showUserFriendlyError(message, 'search');
            return;
        }
        
        // Fallback to basic toast notification
        const toast = document.createElement('div');
        toast.className = 'search-error-toast';
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');
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
            font-size: 14px;
            line-height: 1.4;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
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
        try {
            let recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
            
            // Remove if already exists
            recentSearches = recentSearches.filter(search => search !== query);
            
            // Add to beginning
            recentSearches.unshift(query);
            
            // Keep only last 10 searches
            recentSearches = recentSearches.slice(0, 10);
            
            localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
        } catch (error) {
            console.warn('Could not save recent search:', error);
        }
    }
    
    // Helper methods for enhanced search functionality
    calculateRelevanceScore(clinic, query) {
        let score = 0;
        const name = (clinic.name || '').toLowerCase();
        const type = (clinic.type || '').toLowerCase();
        const location = (clinic.location || '').toLowerCase();
        
        // Exact matches get higher scores
        if (name === query) score += 1.0;
        else if (name.startsWith(query)) score += 0.8;
        else if (name.includes(query)) score += 0.6;
        
        if (type === query) score += 0.8;
        else if (type.startsWith(query)) score += 0.6;
        else if (type.includes(query)) score += 0.4;
        
        if (location.includes(query)) score += 0.3;
        
        return Math.min(score, 1.0);
    }
    
    calculateTextRelevance(text, query) {
        const textLower = text.toLowerCase();
        if (textLower === query) return 1.0;
        if (textLower.startsWith(query)) return 0.8;
        if (textLower.includes(query)) return 0.6;
        return 0.3;
    }
    
    getTreatmentCategory(treatment) {
        const categories = {
            'General Checkup': 'General Medicine',
            'Dental Cleaning': 'Dental Care',
            'Eye Exam': 'Eye Care',
            'Blood Test': 'Diagnostics',
            'X-Ray': 'Imaging',
            'Vaccination': 'Preventive Care',
            'Physical Therapy': 'Rehabilitation',
            'Counseling': 'Mental Health',
            'Skin Treatment': 'Dermatology',
            'Heart Screening': 'Cardiology',
            'Allergy Testing': 'Allergy & Immunology',
            'Pregnancy Care': 'Women\'s Health',
            'Child Wellness': 'Pediatrics',
            'Mental Health Assessment': 'Mental Health'
        };
        return categories[treatment] || 'General Care';
    }
    
    getRelatedTreatments(symptom) {
        const relations = {
            'Headache': ['General Checkup', 'Eye Exam'],
            'Fever': ['General Checkup', 'Blood Test'],
            'Cough': ['General Checkup', 'X-Ray'],
            'Back Pain': ['Physical Therapy', 'General Checkup'],
            'Chest Pain': ['Heart Screening', 'General Checkup'],
            'Stomach Pain': ['General Checkup', 'Blood Test'],
            'Fatigue': ['Blood Test', 'General Checkup'],
            'Dizziness': ['General Checkup', 'Heart Screening'],
            'Skin Rash': ['Skin Treatment', 'Allergy Testing'],
            'Joint Pain': ['Physical Therapy', 'General Checkup'],
            'Shortness of Breath': ['Heart Screening', 'General Checkup'],
            'Anxiety': ['Counseling', 'Mental Health Assessment'],
            'Depression': ['Counseling', 'Mental Health Assessment']
        };
        return relations[symptom] || ['General Checkup'];
    }
    
    getRecentSearches() {
        try {
            return JSON.parse(localStorage.getItem('recentSearches') || '[]');
        } catch (error) {
            return [];
        }
    }
    
    highlightMatch(text, query) {
        if (!query || query.length < 2) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
    
    groupSuggestionsByType(suggestions) {
        const groups = {
            recent: [],
            clinic: [],
            treatment: [],
            symptom: []
        };
        
        suggestions.forEach(suggestion => {
            if (groups[suggestion.type]) {
                groups[suggestion.type].push(suggestion);
            }
        });
        
        return groups;
    }
    
    createGroupedSuggestionsHTML(groups) {
        let html = '';
        
        // Order of display
        const order = ['recent', 'clinic', 'treatment', 'symptom'];
        const labels = {
            recent: 'Recent Searches',
            clinic: 'Clinics',
            treatment: 'Treatments',
            symptom: 'Symptoms'
        };
        
        order.forEach(type => {
            if (groups[type] && groups[type].length > 0) {
                html += `<div class="suggestion-group">`;
                html += `<div class="suggestion-group-label">${labels[type]}</div>`;
                groups[type].forEach(suggestion => {
                    html += this.createSuggestionHTML(suggestion);
                });
                html += `</div>`;
            }
        });
        
        return html;
    }
    
    showSuggestionsLoading() {
        if (!this.searchSuggestions) return;
        
        this.searchSuggestions.innerHTML = `
            <div class="suggestions-loading">
                <div class="loading-spinner"></div>
                <span>Searching...</span>
            </div>
        `;
        this.searchSuggestions.style.display = 'block';
    }
    
    showNoSuggestions(query) {
        if (!this.searchSuggestions) return;
        
        this.searchSuggestions.innerHTML = `
            <div class="no-suggestions">
                <i class="fas fa-search"></i>
                <span>No suggestions found for "${query}"</span>
                <small>Try a different search term</small>
            </div>
        `;
        this.searchSuggestions.style.display = 'block';
    }
    
    bindSuggestionEvents() {
        this.searchSuggestions.querySelectorAll('.search-suggestion').forEach(el => {
            el.addEventListener('click', () => this.selectSuggestion(el));
            el.addEventListener('mouseenter', () => {
                el.style.transform = 'translateX(4px)';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'translateX(0)';
            });
        });
    }
    
    animateSuggestions() {
        const suggestions = this.searchSuggestions.querySelectorAll('.search-suggestion');
        suggestions.forEach((suggestion, index) => {
            suggestion.style.opacity = '0';
            suggestion.style.transform = 'translateY(10px)';
            setTimeout(() => {
                suggestion.style.transition = 'all 0.3s ease';
                suggestion.style.opacity = '1';
                suggestion.style.transform = 'translateY(0)';
            }, index * 50);
        });
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