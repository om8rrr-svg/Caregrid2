// Import required functions
import clinicService from './clinic-service.js';

// No longer need API service - using Supabase directly
// const apiService = new APIService(); // DEPRECATED

// Unregister any old service workers to prevent cache issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    });
}

// Sample clinic data (fallback)
let clinicsData = [
    {
        id: 1,
        name: "Pall Mall Medical Manchester",
        type: "Private GP",
        location: "Manchester",
        address: "61 King Street, Manchester M2 4PD",
        rating: 4.8,
        reviews: 342,
        image: "https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/pall_mall_medical.jpg",
        premium: true,
        phone: "0161 832 2111",
        website: "https://pallmallmedical.co.uk",
        description: "Private healthcare provider in Manchester's business district.",
        services: ["Private GP Consultations", "Health Screening", "Executive Health", "Travel Medicine"]
    },
    {
        id: 2,
        name: "Didsbury Dental Practice",
        type: "Private Dentist",
        location: "Manchester",
        address: "90 Barlow Moor Rd, Manchester M20 2PN",
        rating: 4.9,
        reviews: 567,
        image: "https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/didsbury_dental_practice.jpg",
        premium: true,
        phone: "0161 455 0005",
        website: "https://didsburydental.co.uk",
        description: "Modern dental clinic in Didsbury providing exceptional dental care.",
        services: ["General Dentistry", "Cosmetic Dentistry", "Invisalign", "Emergency Dental Care"]
    },
    {
        id: 3,
        name: "Manchester Eye Hospital",
        type: "NHS Hospital",
        location: "Manchester",
        address: "Oxford Rd, Manchester M13 9WL",
        rating: 4.2,
        reviews: 128,
        image: "https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/manchester_eye_hospital.jpg",
        premium: false,
        phone: "0161 276 1234",
        website: "https://www.mft.nhs.uk",
        description: "Specialist eye care services in Manchester.",
        services: ["Eye Examinations", "Cataract Surgery", "Retinal Services", "Emergency Eye Care"]
    }
];

// Load data on page load (function defined later)
document.addEventListener('DOMContentLoaded', async function() {
  try {
<<<<<<< Updated upstream
    // Load clinics directly from API (no need to wait for Supabase client)
    console.log('🔍 Fetching clinics from Supabase...');
    
=======
    // Wait for Supabase to be ready
    if (!window.supabase) {
      console.log('Waiting for Supabase to initialize...');
      await new Promise(resolve => {
        if (window.supabase) {
          resolve();
        } else {
          window.addEventListener('supabaseReady', resolve, { once: true });
          // Fallback timeout in case event doesn't fire
          setTimeout(resolve, 2000);
        }
      });
    }

>>>>>>> Stashed changes
    const loadedClinics = await loadClinicsFromSupabase();
    if (loadedClinics && Array.isArray(loadedClinics)) {
      clinicsData = loadedClinics;
      console.log('Loaded', clinicsData.length, 'clinics successfully');
      
      // Refresh the clinic display with new data
      if (typeof displayClinics === 'function') {
        displayClinics();
      }
      if (typeof updateStatsDisplay === 'function') {
        updateStatsDisplay();
      }
      
      // Also call renderClinics directly
      console.log('📋 Sample clinic data:', loadedClinics[0]);
      filteredClinics = loadedClinics;
      renderClinics();
    } else {
      console.warn('Failed to load clinics, using existing fallback data');
    }

    // Trigger any existing initialization functions
    if (typeof initializePage === 'function') {
      initializePage();
    }
    if (typeof displayClinics === 'function') {
      displayClinics(clinicsData);
    }
    if (typeof initializeSearch === 'function') {
      initializeSearch();
    }
  } catch (error) {
    console.error('Error initializing page:', error);
  }
});


// Global variables
let currentFilters = {
    category: 'all',
    location: 'all',
    search: '',
    sortBy: null,
    premium: null
};

// Function to reset filters
function resetFilters() {
    currentFilters = {
        category: 'all',
        location: 'all',
        search: '',
        sortBy: null,
        premium: null
    };

    // Reset dropdowns
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');
    const searchInput = document.getElementById('searchInput');

    if (categoryFilter) categoryFilter.value = 'all';
    if (locationFilter) locationFilter.value = 'all';
    if (searchInput) searchInput.value = '';

    applyFilters();
}
let currentPage = 1;
const clinicsPerPage = 6;
let filteredClinics = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();

    // Handle navbar shrinking on scroll for mobile
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const navbar = document.querySelector('.navbar');
        if (navbar) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            lastScrollTop = scrollTop;
        }
    });
});

async function initializeApp() {
    // Wait for CloudAssets to be ready
    if (!window.CloudAssets || !window.CloudAssets.supabase) {
        console.log('⏳ Waiting for CloudAssets to initialize...');
        await new Promise(resolve => {
            document.addEventListener('cloudAssetsReady', resolve, { once: true });
        });
    }

    // Load clinic data from Supabase
    await loadClinicsFromSupabase();

    setupEventListeners();

    // Handle URL parameters for category filtering
    handleURLParameters();

    filteredClinics = [...clinicsData];
    applyFilters();
    await updateLocationCounts();
    await updateCategoryCounts();
}

// Function to handle URL parameters
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');

    if (category) {
        // Map URL parameter values to filter values
        const categoryMap = {
            'gp': 'Private GP',
            'dentist': 'Private Dentist',
            'physiotherapy': 'Private Physiotherapy',
            'aesthetics': 'Private Aesthetics',
            'pharmacy': 'Pharmacy'
        };

        const filterValue = categoryMap[category.toLowerCase()];
        if (filterValue) {
            currentFilters.category = filterValue;

            // Update the category dropdown to reflect the selection
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = filterValue;
            }
        }
    }
}

// Load clinics using REST API (with Supabase backend)
async function loadClinicsFromSupabase(retryCount = 0) {
    // Show loading status
<<<<<<< Updated upstream
    showAPIStatus('Loading clinics...', 'info');
    
=======
    showAPIStatus('Loading clinics from Supabase...', 'info');

>>>>>>> Stashed changes
    try {
        // Get API base URL
        const apiBase = window.__CONFIG__ ? window.__CONFIG__.getApiBase() : window.__API_BASE__;
        const apiUrl = `${apiBase}/api/clinics`;
        
        console.log('🔍 Fetching clinics from:', apiUrl);
        
        // Fetch clinics from REST API
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            // Add timeout
            signal: AbortSignal.timeout(10000)
        });
        
        if (!response.ok) {
            throw new Error(`API responded with ${response.status}: ${response.statusText}`);
        }
<<<<<<< Updated upstream
        
        const data = await response.json();
        
        if (data && data.clinics && Array.isArray(data.clinics) && data.clinics.length > 0) {
            clinicsData = data.clinics;
            
            console.log('✅ Loaded', data.clinics.length, 'clinics from API');
            console.log('📊 Total available:', data.totalCount);
            
            // Cache the data
            setCachedClinics(data.clinics);
            
=======

        // Use the clinic service (now uses Supabase)
        const clinics = await clinicService.getClinics();

        if (clinics && Array.isArray(clinics) && clinics.length > 0) {
            clinicsData = clinics;

            console.log('✅ Loaded', clinics.length, 'clinics from Supabase');

>>>>>>> Stashed changes
            // Show success indicator
            showAPIStatus(`Live data loaded (${data.clinics.length} clinics)`, 'success');
            return data.clinics;
        } else {
            // API returned empty data, use fallback
            console.warn('No clinics data received from API, using fallback');
            showAPIStatus('Using sample data', 'info');
            return clinicsData;
        }
    } catch (error) {
        // Handle errors gracefully
        console.error('❌ Failed to load clinics from API:', error.message);
        
        // Try to use cached data first
        const cachedClinics = getCachedClinics();
        if (cachedClinics && cachedClinics.length > 0) {
            console.log('📦 Using cached clinic data');
            showAPIStatus('Using cached data', 'warning');
            clinicsData = cachedClinics;
            return cachedClinics;
        }
        
        handleAPIError(error);
        showAPIStatus('Using sample data', 'info');

        return clinicsData; // Always return fallback data on error
    }
}

// Keep old function name for backward compatibility
const loadClinicsFromAPI = loadClinicsFromSupabase;

// Determine if an error should trigger a retry
function shouldRetry(error) {
    const retryableErrors = [
        'timeout',
        'NETWORK_ERROR',
        'RATE_LIMITED',
        'SERVER_ERROR'
    ];

    return retryableErrors.some(retryableError =>
        error.message.includes(retryableError) ||
        error.name === retryableError
    );
}

// Handle API errors with appropriate user messaging
function handleAPIError(error, context = 'general', retryFunction = null) {
    // Use enhanced error handling if available
    if (window.errorHandler) {
        return window.errorHandler.handleError(error, context, {
            retryFunction: retryFunction,
            allowRetry: retryFunction !== null
        });
    }

    // Fallback to existing API status display
    if (error.message === 'BACKEND_UNAVAILABLE') {
        showAPIStatus('Demo mode', 'offline');
    } else if (error.message === 'timeout') {
        showAPIStatus('Slow connection - using sample data', 'offline');
    } else if (error.message === 'RATE_LIMITED') {
        showAPIStatus('Service busy - using sample data', 'warning');
    } else {
        showAPIStatus('Demo mode', 'offline');
    }

    return { success: false, error: error };
}

// Load fallback data when API is unavailable
function loadFallbackData() {
    // clinicsData is already populated with sample data from the beginning of the file
    // This function can be extended to load from localStorage or other sources

    // Try to load from localStorage as secondary fallback
    const localData = localStorage.getItem('clinics_backup');
    if (localData) {
        try {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
                clinicsData = parsedData;
                const apiBase = window.__CONFIG__ ? window.__CONFIG__.getApiBase() : window.__API_BASE__;
                if (apiBase && apiBase.includes('localhost')) {
                    console.log('📦 Loaded backup data from localStorage');
                }
                return;
            }
        } catch (e) {
            // Invalid localStorage data, continue with default sample data
        }
    }

    // Default sample data is already loaded at the top of the file
    const apiBase = window.__CONFIG__ ? window.__CONFIG__.getApiBase() : window.__API_BASE__;
    if (apiBase && apiBase.includes('localhost')) {
        console.log('📋 Using default sample data');
    }
}

// Cache management functions
function setCachedClinics(clinics) {
    const cacheData = {
        data: clinics,
        timestamp: Date.now(),
        version: '1.0'
    };

    try {
        localStorage.setItem('clinics_cache', JSON.stringify(cacheData));
        // Also store as backup
        localStorage.setItem('clinics_backup', JSON.stringify(clinics));
    } catch (e) {
        // localStorage might be full or disabled
        const apiBase = window.__CONFIG__ ? window.__CONFIG__.getApiBase() : window.__API_BASE__;
        if (apiBase && apiBase.includes('localhost')) {
            console.warn('Failed to cache clinic data:', e.message);
        }
    }
}

function getCachedClinics() {
    try {
        const cached = localStorage.getItem('clinics_cache');
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const cacheAge = Date.now() - cacheData.timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes

        if (cacheAge < maxAge && cacheData.data && Array.isArray(cacheData.data)) {
            return cacheData.data;
        }

        // Cache expired, remove it
        localStorage.removeItem('clinics_cache');
        return null;
    } catch (e) {
        // Invalid cache data
        localStorage.removeItem('clinics_cache');
        return null;
    }
}

// Show API connection status to users
function showAPIStatus(message, status) {
    // Don't show status indicator on auth pages to avoid visual clutter
    if (document.body.classList.contains('auth-page')) {
        return;
    }

    // Create or update a small status indicator
    let statusIndicator = document.getElementById('api-status-indicator');
    if (!statusIndicator) {
        statusIndicator = document.createElement('div');
        statusIndicator.id = 'api-status-indicator';
        statusIndicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(statusIndicator);
    }

    // Set styles based on status
    const styles = {
        success: {
            background: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        info: {
            background: '#cce7ff',
            color: '#004085',
            border: '1px solid #a6d3ff'
        },
        offline: {
            background: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f1aeb5'
        }
    };

    const style = styles[status] || styles.info;
    statusIndicator.style.background = style.background;
    statusIndicator.style.color = style.color;
    statusIndicator.style.border = style.border;
    statusIndicator.textContent = message;

    // Auto-hide success messages after 3 seconds
    if (status === 'success') {
        setTimeout(() => {
            if (statusIndicator) {
                statusIndicator.style.opacity = '0';
                setTimeout(() => {
                    if (statusIndicator && statusIndicator.parentNode) {
                        statusIndicator.parentNode.removeChild(statusIndicator);
                    }
                }, 300);
            }
        }, 3000);
    }
}

// Enhanced API error handling with detailed feedback
window.addEventListener('api-error', (event) => {
    const errorDetail = event.detail;
    let message = typeof errorDetail === 'string' ? errorDetail : errorDetail.message;

    // Provide context-specific error messages
    if (errorDetail.endpoint) {
        if (errorDetail.endpoint.includes('/clinics')) {
            message = 'Unable to load clinic data. Showing cached results.';
        } else if (errorDetail.endpoint.includes('/auth')) {
            message = 'Authentication service temporarily unavailable.';
        } else if (errorDetail.endpoint.includes('/appointments')) {
            message = 'Appointment service temporarily unavailable.';
        }
    }

    showAPIStatus(message, 'error');

    // Log detailed error info in development
    const apiBase = window.__CONFIG__ ? window.__CONFIG__.getApiBase() : window.__API_BASE__;
    if (apiBase && apiBase.includes('localhost')) {
        console.warn('API Error Details:', errorDetail);
    }
});

function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    if (hamburger && navMenu) {
        // Add ARIA attributes for accessibility
        hamburger.setAttribute('aria-label', 'Toggle navigation menu');
        hamburger.setAttribute('aria-expanded', 'false');
        navMenu.setAttribute('aria-hidden', 'true');

        hamburger.addEventListener('click', () => {
            const isActive = navMenu.classList.contains('active');

            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
            document.body.classList.toggle('nav-open');

            // Update ARIA attributes
            hamburger.setAttribute('aria-expanded', !isActive);
            navMenu.setAttribute('aria-hidden', isActive);
        });

        // Close mobile menu when clicking on nav links
        const navLinks = navMenu.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('nav-open');

                // Update ARIA attributes
                hamburger.setAttribute('aria-expanded', 'false');
                navMenu.setAttribute('aria-hidden', 'true');
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('nav-open');

                // Update ARIA attributes
                hamburger.setAttribute('aria-expanded', 'false');
                navMenu.setAttribute('aria-hidden', 'true');
            }
        });

        // Close mobile menu on window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768 && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('nav-open');

                // Update ARIA attributes
                hamburger.setAttribute('aria-expanded', 'false');
                navMenu.setAttribute('aria-hidden', 'true');
            }
        });
    }

    // Search input - only handle if AdvancedSearch is not available
    const searchInput = document.getElementById('searchInput');
    if (searchInput && typeof AdvancedSearch === 'undefined') {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }

    // Filter dropdowns
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', applyFilters);
    }

    if (locationFilter) {
        locationFilter.addEventListener('change', applyFilters);
    }
}

// Search functionality
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value) {
        const query = searchInput.value.toLowerCase().trim();
        parseNaturalLanguageQuery(query);
        applyFilters();

        // Scroll to results section if search has content
        if (query.length > 0) {
            const clinicGrid = document.getElementById('clinicGrid');
            if (clinicGrid) {
                // Add a small delay to ensure filters are applied first
                setTimeout(() => {
                    clinicGrid.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                        inline: 'nearest'
                    });
                }, 100);
            }
        }
    }
}

function handleSearch(event) {
    const query = (event.target.value || '').toLowerCase().trim();
    parseNaturalLanguageQuery(query);
    applyFilters();
}

// Enhanced natural language query parser
function parseNaturalLanguageQuery(query) {
    // If query is empty, reset filters
    if (!query || query.trim() === '') {
        resetFilters();
        applyFilters(); // Re-render clinics to remove highlighting
        return;
    }

    // Reset specific filters but keep search term
    currentFilters.search = query;
    currentFilters.sortBy = null;
    currentFilters.premium = null;

    // Define patterns for different types of queries
    const patterns = {
        // Location patterns
        location: {
            'in manchester': 'Manchester',
            'in liverpool': 'Liverpool',
            'in london': 'London',
            'in preston': 'Preston',
            'manchester': 'Manchester',
            'liverpool': 'Liverpool',
            'london': 'London',
            'preston': 'Preston',
            'near me': 'all', // Could be enhanced with geolocation
            'nearby': 'all',
            'close to me': 'all'
        },

        // Service type patterns
        serviceType: {
            'gp': 'gp',
            'doctor': 'gp',
            'general practitioner': 'gp',
            'physician': 'gp',
            'medical': 'gp',
            'dentist': 'dentist',
            'dental': 'dentist',
            'teeth': 'dentist',
            'tooth': 'dentist',
            'orthodontist': 'dentist',
            'physio': 'physio',
            'physiotherapy': 'physio',
            'physiotherapist': 'physio',
            'physical therapy': 'physio',
            'rehab': 'physio',
            'rehabilitation': 'physio',
            'sports injury': 'physio',
            'pharmacy': 'pharmacy',
            'chemist': 'pharmacy',
            'pharmacist': 'pharmacy',
            'prescription': 'pharmacy',
            'aesthetic': 'aesthetic',
            'cosmetic': 'aesthetic',
            'beauty': 'aesthetic'
        },

        // Service-specific patterns
        services: {
            'same day': ['same-day', 'same day'],
            'emergency': ['emergency'],
            'urgent': ['emergency', 'urgent'],
            'appointment': ['consultation', 'appointment'],
            'consultation': ['consultation'],
            'checkup': ['check-up', 'screening'],
            'check up': ['check-up', 'screening'],
            'screening': ['screening'],
            'vaccination': ['vaccination', 'vaccine'],
            'vaccine': ['vaccination', 'vaccine'],
            'travel': ['travel'],
            'cosmetic': ['cosmetic'],
            'invisalign': ['invisalign'],
            'implant': ['implant'],
            'whitening': ['whitening'],
            'cleaning': ['cleaning', 'hygiene'],
            'massage': ['massage'],
            'acupuncture': ['acupuncture'],
            'pilates': ['pilates'],
            'sports': ['sports'],
            'injury': ['injury'],
            'pain': ['pain'],
            'back pain': ['back pain'],
            'neck pain': ['neck pain']
        }
    };

    // Extract location from query
    for (const [pattern, location] of Object.entries(patterns.location)) {
        if (query.includes(pattern)) {
            if (location !== 'all') {
                currentFilters.location = location.toLowerCase();
                // Update location filter dropdown if it exists
                const locationFilter = document.getElementById('locationFilter');
                if (locationFilter) {
                    locationFilter.value = location.toLowerCase();
                }
            }
            break;
        }
    }

    // Extract service type from query
    for (const [pattern, serviceType] of Object.entries(patterns.serviceType)) {
        if (query.includes(pattern)) {
            currentFilters.category = serviceType;
            // Update category filter dropdown if it exists
            const categoryFilter = document.getElementById('categoryFilter');
            if (categoryFilter) {
                categoryFilter.value = serviceType;
            }
            break;
        }
    }

    // Handle complex queries like "dentist in manchester"
    const complexPatterns = [
        {
            regex: /(gp|doctor|medical|physician)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'gp'
        },
        {
            regex: /(dentist|dental)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'dentist'
        },
        {
            regex: /(physio|physiotherapy|rehab)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'physio'
        },
        {
            regex: /(pharmacy|chemist)\s+(in|near)\s+(manchester|liverpool|london|preston)/,
            type: 'pharmacy'
        }
    ];

    for (const pattern of complexPatterns) {
        const match = query.match(pattern.regex);
        if (match) {
            currentFilters.category = pattern.type;
            const location = match[3];
            currentFilters.location = location.toLowerCase();

            // Update dropdowns
            const categoryFilter = document.getElementById('categoryFilter');
            const locationFilter = document.getElementById('locationFilter');
            if (categoryFilter) categoryFilter.value = pattern.type;
            if (locationFilter) locationFilter.value = location.toLowerCase();
            break;
        }
    }

    // Handle "near me" queries with geolocation (placeholder for future enhancement)
    if (query.includes('near me') || query.includes('nearby') || query.includes('close to me')) {
        // For now, show all locations. Could be enhanced with geolocation API
        currentFilters.location = 'all';
        const locationFilter = document.getElementById('locationFilter');
        if (locationFilter) locationFilter.value = 'all';
    }

    // Handle rating-based queries
    if (query.includes('best') || query.includes('top rated') || query.includes('highest rated')) {
        // This will be handled in the enhanced applyFilters function
        currentFilters.sortBy = 'rating';
    }

    // Handle premium/private queries
    if (query.includes('private') || query.includes('premium')) {
        currentFilters.premium = true;
    }

    // Handle NHS queries
    if (query.includes('nhs') || query.includes('free')) {
        currentFilters.premium = false;
    }
}

// Filter functions
function filterByCategory(category) {
    currentFilters.category = category;

    // Update UI
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');

    // Update dropdown
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.value = category;
    }

    applyFilters();

    // Scroll to featured clinics section to show filtered results
    const featuredClinicsSection = document.querySelector('.featured-clinics');
    if (featuredClinicsSection) {
        setTimeout(() => {
            featuredClinicsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

function filterByLocation(location) {
    currentFilters.location = location;

    // Update UI
    document.querySelectorAll('.location-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const targetBtn = document.querySelector(`[data-location="${location}"]`);
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // Update dropdown
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.value = location;
    }

    applyFilters();

    // Scroll to featured clinics section
    const featuredClinicsSection = document.querySelector('.featured-clinics');
    if (featuredClinicsSection) {
        setTimeout(() => {
            featuredClinicsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
                inline: 'nearest'
            });
        }, 100);
    }
}

function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter');
    const locationFilter = document.getElementById('locationFilter');

    // Always update from dropdowns if they exist (allows manual filter changes to override search)
    if (categoryFilter) {
        currentFilters.category = categoryFilter.value;
    }

    if (locationFilter) {
        currentFilters.location = locationFilter.value;
    }

    filteredClinics = clinicsData.filter(clinic => {
        // Map filter categories to clinic types with enhanced matching
        let matchesCategory = currentFilters.category === 'all' || !currentFilters.category;
        if (!matchesCategory) {
            const categoryMap = {
                'gp': ['GP', 'Private GP'],
                'dentist': ['Dentist', 'Private Dentist'],
                'physio': ['Physio', 'Private Physiotherapy'],
                'optician': ['Optician', 'Private Optician'],
                'pharmacy': ['Pharmacy']
            };
            const allowedTypes = categoryMap[currentFilters.category] || [];
            matchesCategory = allowedTypes.some(type =>
                (clinic.type || '').toLowerCase().includes(type.toLowerCase())
            );
        }

        // Enhanced location matching
        const matchesLocation = currentFilters.location === 'all' ||
            !currentFilters.location ||
            (clinic.city || clinic.location || '').toLowerCase() === currentFilters.location.toLowerCase();

        // Enhanced search matching with better natural language support
        let matchesSearch = currentFilters.search === '' || !currentFilters.search;
        if (!matchesSearch) {
            const searchTerms = currentFilters.search.toLowerCase();

            // Basic field matching
            const basicMatch =
                (clinic.name || '').toLowerCase().includes(searchTerms) ||
                (clinic.type || '').toLowerCase().includes(searchTerms) ||
                (clinic.city || clinic.location || '').toLowerCase().includes(searchTerms) ||
                (clinic.address || '').toLowerCase().includes(searchTerms) ||
                (clinic.description || '').toLowerCase().includes(searchTerms) ||
                (clinic.services || []).some(service => (service || '').toLowerCase().includes(searchTerms));

            // Enhanced service matching for natural language
            const serviceKeywords = {
                'same day': ['same-day', 'same day', 'urgent', 'immediate'],
                'emergency': ['emergency', 'urgent', 'immediate'],
                'private': ['private'],
                'nhs': ['nhs'],
                'consultation': ['consultation', 'appointment'],
                'screening': ['screening', 'check-up', 'health check'],
                'travel': ['travel'],
                'cosmetic': ['cosmetic', 'aesthetic'],
                'sports': ['sports', 'injury'],
                'dental implants': ['implant'],
                'invisalign': ['invisalign'],
                'teeth whitening': ['whitening'],
                'physiotherapy': ['physio', 'rehabilitation', 'rehab'],
                'massage': ['massage'],
                'acupuncture': ['acupuncture'],
                'pilates': ['pilates']
            };

            let enhancedMatch = false;
            for (const [keyword, variations] of Object.entries(serviceKeywords)) {
                if (variations.some(variation => searchTerms.includes(variation))) {
                    enhancedMatch = clinic.services.some(service =>
                        service.toLowerCase().includes(keyword) ||
                        variations.some(v => service.toLowerCase().includes(v))
                    );
                    if (enhancedMatch) break;
                }
            }

            matchesSearch = basicMatch || enhancedMatch;
        }

        // Premium/Private filter
        let matchesPremium = true;
        if (currentFilters.premium === true) {
            matchesPremium = clinic.premium === true;
        } else if (currentFilters.premium === false) {
            matchesPremium = clinic.premium === false || !clinic.premium;
        }

        return matchesCategory && matchesLocation && matchesSearch && matchesPremium;
    });

    // Apply sorting - default to premium first, then rating, then name
    if (currentFilters.sortBy === 'rating') {
        filteredClinics.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (currentFilters.sortBy === 'reviews') {
        filteredClinics.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    } else {
        // Default sorting: premium first, then by rating, then by name
        filteredClinics.sort((a, b) => {
            // First sort by premium status (premium clinics first)
            const aPremium = a.premium || a.is_premium || false;
            const bPremium = b.premium || b.is_premium || false;
            if (aPremium !== bPremium) {
                return bPremium - aPremium; // true (1) comes before false (0)
            }

            // Then sort by rating (higher first)
            const aRating = a.rating || 0;
            const bRating = b.rating || 0;
            if (aRating !== bRating) {
                return bRating - aRating;
            }

            // Finally sort by name (alphabetical)
            const aName = (a.name || '').toLowerCase();
            const bName = (b.name || '').toLowerCase();
            return aName.localeCompare(bName);
        });
    }

    currentPage = 1;
    renderClinics();
}

// Render functions
function renderClinics() {
    const clinicGrid = document.getElementById('clinicGrid');
    if (!clinicGrid) return;

    // Log search analytics
    if (currentFilters.search) {
        logSearchQuery(currentFilters.search, filteredClinics.length);
    }

    const startIndex = (currentPage - 1) * clinicsPerPage;
    const endIndex = startIndex + clinicsPerPage;
    const clinicsToShow = filteredClinics.slice(startIndex, endIndex);

    // Display results count
    const resultsInfo = document.getElementById('resultsInfo');
    if (resultsInfo) {
        const totalResults = filteredClinics.length;
        if (totalResults > 0) {
            const showing = Math.min(endIndex, totalResults);
            resultsInfo.textContent = `Showing ${startIndex + 1}-${showing} of ${totalResults} results`;
            resultsInfo.style.display = 'block';
        } else {
            resultsInfo.style.display = 'none';
        }
    }

    clinicGrid.innerHTML = '';

    if (clinicsToShow.length === 0) {
        let noResultsMessage = getNoResultsMessage();
        clinicGrid.innerHTML = `
            <div class="no-results">
                <h3>No clinics found</h3>
                <p>${noResultsMessage}</p>
                <button onclick="resetFilters()" class="btn btn-primary">Clear all filters</button>
            </div>
        `;
        return;
    }

    clinicsToShow.forEach(clinic => {
        const clinicCard = createClinicCard(clinic);

        // Highlight search terms if there's an active search, or remove highlights if search is cleared
        const searchableElements = clinicCard.querySelectorAll('.clinic-name, .clinic-type, .clinic-location, .clinic-services');
        searchableElements.forEach(element => {
            if (element.textContent) {
                if (currentFilters.search) {
                    // Apply highlighting
                    element.innerHTML = highlightSearchTerms(element.textContent, currentFilters.search);
                } else {
                    // Remove any existing highlights by replacing innerHTML with plain text
                    element.innerHTML = element.textContent;
                }
            }
        });

        clinicGrid.appendChild(clinicCard);
    });

    // Render pagination
    renderPagination();
}

/**
 * Validate clinic data completeness
 * @param {Object} clinic - Clinic data object
 * @returns {Object} Validation result with missing fields and completeness score
 */
function validateClinicData(clinic) {
    const requiredFields = {
        name: 'Clinic name',
        type: 'Clinic type',
        address: 'Address'
    };

    const optionalFields = {
        phone: 'Phone number',
        website: 'Website',
        rating: 'Rating',
        image: 'Image',
        description: 'Description'
    };

    const missing = [];
    const present = [];

    // Check required fields
    Object.keys(requiredFields).forEach(field => {
        if (!clinic[field] || clinic[field].toString().trim() === '') {
            missing.push(requiredFields[field]);
        } else {
            present.push(requiredFields[field]);
        }
    });

    // Check optional fields
    Object.keys(optionalFields).forEach(field => {
        if (clinic[field] && clinic[field].toString().trim() !== '') {
            present.push(optionalFields[field]);
        }
    });

    const totalFields = Object.keys(requiredFields).length + Object.keys(optionalFields).length;
    const completenessScore = Math.round((present.length / totalFields) * 100);

    return {
        isValid: missing.length === 0,
        missing,
        present,
        completenessScore,
        hasMinimumData: clinic.name && clinic.type
    };
}

function createClinicCard(clinic) {
    const card = document.createElement('div');
    card.className = 'clinic-card fade-in';
    card.style.cursor = 'pointer';

    // Validate clinic data
    const validation = validateClinicData(clinic);

    // Add data quality indicator
    if (!validation.isValid) {
        card.classList.add('incomplete-data');
        card.setAttribute('data-completeness', validation.completenessScore);
    }

    // Add click event to entire card
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on action buttons
        if (!e.target.closest('.clinic-actions')) {
            window.location.href = `clinic-profile.html?id=${clinic.frontendId || clinic.id}`;
        }
    });

    // Create star rating with actual star icons
    const fullStars = Math.floor(clinic.rating);
    const hasHalfStar = clinic.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    // Get type icon for overlay
    const typeIcon = getTypeIcon(clinic.type || 'healthcare');

    // Handle missing or incomplete data with fallbacks
    const clinicName = clinic.name || 'Healthcare Provider';
    const clinicType = clinic.type || 'Healthcare';
    const clinicAddress = clinic.address || 'Address not available';
    const clinicImage = clinic.logoUrl || (clinic.images && clinic.images[0]) || clinic.image || 'https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/clinic1.svg';
    const clinicPhone = clinic.phone || null;
    const clinicRating = clinic.rating || 0;
    const reviewCount = clinic.reviewCount || clinic.reviews || 0;

    // Generate data completeness indicator
    let completenessIndicator = '';
    if (!validation.isValid) {
        completenessIndicator = `
            <div class="data-completeness-indicator" title="Profile ${validation.completenessScore}% complete">
                <i class="fas fa-info-circle"></i>
                <span>${validation.completenessScore}% complete</span>
            </div>
        `;
    }

    // Generate contact actions based on available data
    let contactActions = '';
    if (clinicPhone) {
        contactActions += `<a href="tel:${clinicPhone}" class="contact-btn">Call Now</a>`;
    } else {
        contactActions += `<span class="contact-btn disabled" title="Phone number not available">No Phone</span>`;
    }

    card.innerHTML = `
        <div class="clinic-image-container">
            <img src="${clinicImage}"
                 alt="${clinicName} - ${formatType(clinicType)} clinic"
                 class="clinic-image"
                 loading="lazy"
                 onerror="this.src='https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/clinic1.svg'">
            <div class="image-overlay">
                <div class="type-badge">
                    <i class="${typeIcon}"></i>
                    <span>${formatType(clinicType)}</span>
                </div>
                ${(clinic.premium !== undefined ? clinic.premium : false) ? '<div class="premium-badge-image"><i class="fas fa-crown"></i> Premium</div>' : ''}
                ${completenessIndicator}
            </div>
            <div class="image-gradient"></div>
        </div>
        <div class="clinic-content">
            <div class="clinic-header">
                <div>
                    <h3 class="clinic-name">${clinicName}</h3>
                    <p class="clinic-type">${formatType(clinicType)}</p>
                </div>
            </div>
            <p class="clinic-location ${!clinic.address ? 'missing-data' : ''}">
                ${clinicAddress === 'Address not available' ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}${clinicAddress}
            </p>
            <div class="clinic-rating">
                <div class="stars">${starsHTML}</div>
                <span class="rating-text">${clinicRating || 'N/A'}</span>
                <span class="review-count">(${reviewCount} reviews)</span>
            </div>
            <div class="clinic-actions">
                <a href="clinic-profile.html?id=${clinic.id}" class="visit-btn">View Details</a>
                ${contactActions}
            </div>
        </div>
    `;

    return card;
}

function formatType(type) {
    const typeMap = {
        'gp': 'General Practitioner',
        'GP': 'General Practitioner',
        'Private GP': 'General Practitioner',
        'dentist': 'Dentist',
        'Dentist': 'Dentist',
        'Private Dentist': 'Dentist',
        'physio': 'Physiotherapist',
        'Physio': 'Physiotherapist',
        'Private Physiotherapy': 'Physiotherapist',
        'aesthetic': 'Aesthetic Clinic'
    };
    return typeMap[type] || type;
}

function getTypeIcon(type) {
    const iconMap = {
        'gp': 'fas fa-stethoscope',
        'GP': 'fas fa-stethoscope',
        'Private GP': 'fas fa-stethoscope',
        'dentist': 'fas fa-tooth',
        'Dentist': 'fas fa-tooth',
        'Private Dentist': 'fas fa-tooth',
        'physio': 'fas fa-dumbbell',
        'Physio': 'fas fa-dumbbell',
        'Private Physiotherapy': 'fas fa-dumbbell',
        'optician': 'fas fa-eye',
        'Optician': 'fas fa-eye',
        'Private Optician': 'fas fa-eye'
    };
    return iconMap[type] || 'fas fa-hospital';
}

function goToPage(page) {
    currentPage = page;
    renderClinics();

    // Scroll to top of clinic results
    const clinicGrid = document.getElementById('clinicGrid');
    if (clinicGrid) {
        clinicGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderPagination() {
    const paginationControls = document.getElementById('paginationControls');
    if (!paginationControls) return;

    const totalPages = Math.ceil(filteredClinics.length / clinicsPerPage);

    if (totalPages <= 1) {
        paginationControls.innerHTML = '';
        return;
    }

    const maxVisiblePages = 5; // Maximum number of page buttons to show
    let paginationHTML = '';

    // Calculate the range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage - 1})">&laquo; Previous</button>`;
    }

    // First page and ellipsis if needed
    if (startPage > 1) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="pagination-btn active">${i}</button>`;
        } else {
            paginationHTML += `<button class="pagination-btn" onclick="goToPage(${i})">${i}</button>`;
        }
    }

    // Last page and ellipsis if needed
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            paginationHTML += `<span class="pagination-ellipsis">...</span>`;
        }
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button class="pagination-btn" onclick="goToPage(${currentPage + 1})">Next &raquo;</button>`;
    }

    paginationControls.innerHTML = paginationHTML;
}

async function updateLocationCounts() {
    console.log('updateLocationCounts: Starting function');
    const locations = [
        { key: 'manchester', city: 'Manchester' },
        { key: 'bolton', city: 'Bolton' },
        { key: 'liverpool', city: 'Liverpool' },
        { key: 'leeds', city: 'Leeds' },
        { key: 'glasgow', city: 'Glasgow' },
        { key: 'birmingham', city: 'Birmingham' },
        { key: 'london', city: 'London' }
    ];

    // Check if backend is healthy before making requests
    const isBackendHealthy = await window.apiService.isBackendHealthy();
    console.log('updateLocationCounts: Backend healthy?', isBackendHealthy);

    // Update total count for 'All Locations'
    try {
        let totalCount;
        if (isBackendHealthy) {
            const totalData = await clinicService.getClinics({ limit: 1000 });
            totalCount = totalData.pagination?.total || totalData.data?.length || 0;
        } else {
            // Use fallback data when backend is not healthy
            totalCount = clinicsData.length;
        }

        const totalCountElement = document.querySelector('[data-location="all"] .clinic-count');
        console.log('updateLocationCounts: Total count:', totalCount, 'Element found:', !!totalCountElement);
        if (totalCountElement) {
            totalCountElement.textContent = `${totalCount} clinics`;
            console.log('updateLocationCounts: Updated total count element to:', totalCountElement.textContent);
        }

        // Also update mobile dropdown
        const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
        if (mobileAllOption) {
            mobileAllOption.textContent = `All Locations (${totalCount} clinics)`;
        }
    } catch (error) {
        // Only log errors if we expected the backend to be healthy
        if (isBackendHealthy) {
            console.warn('Error fetching total clinic count, using fallback data:', error.message);
        }
        // Use local fallback data
        const totalCount = clinicsData.length;
        const totalCountElement = document.querySelector('[data-location="all"] .clinic-count');
        if (totalCountElement) {
            totalCountElement.textContent = `${totalCount} clinics`;
        }

        const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
        if (mobileAllOption) {
            mobileAllOption.textContent = `All Locations (${totalCount} clinics)`;
        }
    }

    // Update individual location counts
    for (const location of locations) {
        try {
            let count;
            if (isBackendHealthy) {
                const data = await clinicService.getClinics({ city: location.city, limit: 1000 });
                count = data.pagination?.total || data.data?.length || 0;
            } else {
                // Use fallback data when backend is not healthy
                count = clinicsData.filter(clinic =>
                    clinic.location && clinic.location.toLowerCase() === location.city.toLowerCase()
                ).length;
            }

            const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
            console.log(`updateLocationCounts: ${location.city} count:`, count, 'Element found:', !!countElement);
            if (countElement) {
                countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;
                console.log(`updateLocationCounts: Updated ${location.city} element to:`, countElement.textContent);
            }

            // Also update mobile dropdown
            const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
            if (mobileOption) {
                mobileOption.textContent = `${location.city} (${count} ${count === 1 ? 'clinic' : 'clinics'})`;
            }
        } catch (error) {
            // Only log errors if we expected the backend to be healthy
            if (isBackendHealthy) {
                console.warn(`Error fetching clinic count for ${location.city}, using fallback data:`, error.message);
            }
            // Use local fallback data
            const count = clinicsData.filter(clinic =>
                clinic.location && clinic.location.toLowerCase() === location.city.toLowerCase()
            ).length;

            const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
            if (countElement) {
                countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;
            }

            // Also update mobile dropdown
            const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
            if (mobileOption) {
                mobileOption.textContent = `${location.city} (${count} ${count === 1 ? 'clinic' : 'clinics'})`;
            }
        }
    }
}

async function updateCategoryCounts() {
    const categories = [
        { key: 'all', type: 'All' },
        { key: 'gp', type: 'Private GP' },
        { key: 'dentist', type: 'Dentist' },
        { key: 'physio', type: 'Physiotherapist' },
        { key: 'optician', type: 'Optician' },
        { key: 'pharmacy', type: 'Pharmacy' }
    ];

    // Update individual category counts
    for (const category of categories) {
        try {
            let count;
            if (category.key === 'all') {
                // Total count for all clinics
                count = clinicsData.length;
            } else {
                // Count for specific category
                count = clinicsData.filter(clinic => {
                    if (!clinic.type) return false;
                    const clinicType = clinic.type.toLowerCase();
                    const categoryType = category.type.toLowerCase();

                    // Handle different naming variations
                    if (category.key === 'gp') {
                        return clinicType.includes('gp') || clinicType.includes('general practice');
                    } else if (category.key === 'dentist') {
                        return clinicType.includes('dentist') || clinicType.includes('dental');
                    } else if (category.key === 'physio') {
                        return clinicType.includes('physio') || clinicType.includes('physiotherapy');
                    } else if (category.key === 'optician') {
                        return clinicType.includes('optician') || clinicType.includes('optical');
                    } else if (category.key === 'pharmacy') {
                        return clinicType.includes('pharmacy') || clinicType.includes('pharmacist');
                    }
                    return false;
                }).length;
            }

            const countElement = document.querySelector(`[data-category="${category.key}"] .clinic-count`);
            if (countElement) {
                countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;

                // Disable category if count is 0 (except for 'all')
                const categoryBtn = document.querySelector(`[data-category="${category.key}"]`);
                if (categoryBtn && category.key !== 'all') {
                    if (count === 0) {
                        categoryBtn.disabled = true;
                        categoryBtn.style.opacity = '0.5';
                        categoryBtn.style.cursor = 'not-allowed';
                    } else {
                        categoryBtn.disabled = false;
                        categoryBtn.style.opacity = '1';
                        categoryBtn.style.cursor = 'pointer';
                    }
                }
            }
        } catch (error) {
            console.warn(`Error updating count for ${category.key}:`, error.message);
            // Fallback to showing no count
            const countElement = document.querySelector(`[data-category="${category.key}"] .clinic-count`);
            if (countElement) {
                countElement.textContent = '';
            }
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Smooth scrolling for same-page anchor links only
document.querySelectorAll('a[href^="#"]:not([href*=".html"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        // Only proceed if href is not just '#' and contains a valid selector
        if (href && href.length > 1) {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Navbar scroll effect
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = '#ffffff';
            navbar.style.backdropFilter = 'none';
        }
    }
});

// Handle hash navigation on page load
function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash) {
        const target = document.querySelector(hash);
        if (target) {
            // Small delay to ensure page is fully loaded
            setTimeout(() => {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 100);
        }
    }
}

// Animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe elements for animation and handle hash navigation
document.addEventListener('DOMContentLoaded', function() {
    const elementsToAnimate = document.querySelectorAll('.category-btn, .location-btn, .clinic-card');
    elementsToAnimate.forEach(el => observer.observe(el));

    // Handle hash navigation after page loads
    handleHashNavigation();
});

// Also handle hash changes (for single page navigation)
window.addEventListener('hashchange', handleHashNavigation);

// Hero animations are handled by CSS
// No additional JavaScript needed for the new hero design

// Export functions and data for global access
// Export functions to global scope
window.performSearch = performSearch;
window.filterByCategory = filterByCategory;
window.filterByLocation = filterByLocation;
window.applyFilters = applyFilters;
window.goToPage = goToPage;
window.clinicsData = clinicsData;
window.resetFilters = resetFilters;
window.parseNaturalLanguageQuery = parseNaturalLanguageQuery;

// Search suggestions function
function getSearchSuggestions(query) {
    const suggestions = [];
    const lowerQuery = query.toLowerCase();

    // Location suggestions
    const locations = ['Manchester', 'Liverpool', 'London', 'Preston'];
    locations.forEach(location => {
        if (location.toLowerCase().includes(lowerQuery)) {
            suggestions.push(location);
        }
    });

    // Service type suggestions
    const serviceTypes = ['GP', 'Dentist', 'Physiotherapy', 'Pharmacy', 'Aesthetic'];
    serviceTypes.forEach(type => {
        if (type.toLowerCase().includes(lowerQuery)) {
            suggestions.push(type);
        }
    });

    // Common search patterns
    const commonSearches = [
        'dentist in manchester',
        'gp near me',
        'physio in liverpool',
        'pharmacy in london',
        'private gp',
        'same day appointment',
        'emergency dentist',
        'sports injury physio',
        'cosmetic dentistry',
        'travel vaccination'
    ];

    commonSearches.forEach(search => {
        if (search.includes(lowerQuery)) {
            suggestions.push(search);
        }
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
}

// Function to highlight search terms in results
function highlightSearchTerms(text, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return text;

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Function to get search analytics (for future enhancement)
function logSearchQuery(query, resultsCount) {
    // This could be enhanced to send analytics to a backend service
    console.log(`Search: "${query}" returned ${resultsCount} results`);
}

// Get contextual no results message
function getNoResultsMessage() {
    const { search, category, location, premium } = currentFilters;

    if (search && search.trim()) {
        if (location !== 'all' && category !== 'all') {
            return `No ${category.toLowerCase()} found for "${search}" in ${location}. Try expanding your search area or adjusting your criteria.`;
        } else if (location !== 'all') {
            return `No results found for "${search}" in ${location}. Try searching in nearby areas or adjusting your search terms.`;
        } else if (category !== 'all') {
            return `No ${category.toLowerCase()} found for "${search}". Try different search terms or browse all categories.`;
        } else {
            return `No results found for "${search}". Try different keywords, check spelling, or browse our categories.`;
        }
    } else if (location !== 'all' && category !== 'all') {
        return `No ${category.toLowerCase()} available in ${location}. Try expanding to nearby areas.`;
    } else if (location !== 'all') {
        return `No clinics found in ${location}. Try selecting a different location.`;
    } else if (category !== 'all') {
        return `No ${category.toLowerCase()} currently available. Try browsing other categories.`;
    } else if (premium !== null) {
        return premium ? 'No premium clinics match your criteria.' : 'No NHS/standard clinics match your criteria.';
    } else {
        return 'No clinics found. Please try adjusting your search criteria or filters.';
    }
}

// Rotating Text Animation
function initRotatingText() {
    const rotatingText = document.getElementById('rotating-text');
    if (!rotatingText) return;

    const words = ['Medical Care', 'GPs', 'Dentists', 'Physios', 'Pharmacies'];
    let currentIndex = 1;
    let isAnimating = false;

    function rotateText() {
        if (isAnimating) return;
        isAnimating = true;

        // Start fade-out animation
        rotatingText.classList.add('text-fade-out');

        setTimeout(() => {
            // Add shimmer effect during text change
            rotatingText.classList.add('changing');

            setTimeout(() => {
                // Change the text
                rotatingText.textContent = words[currentIndex];

                // Remove fade-out and changing classes
                rotatingText.classList.remove('text-fade-out', 'changing');

                // Add fade-in animation
                rotatingText.classList.add('text-fade-in');

                // Move to next word
                currentIndex = (currentIndex + 1) % words.length;

                // Clean up after fade-in completes
                setTimeout(() => {
                    rotatingText.classList.remove('text-fade-in');
                    isAnimating = false;
                }, 600);
            }, 200);
        }, 400);
    }

    // Start rotation after initial delay
    setTimeout(() => {
        rotateText();
        // Continue rotating every 3 seconds for smoother experience
        setInterval(rotateText, 3000);
    }, 3000);
}

// Initialize rotating text when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRotatingText);
} else {
    initRotatingText();
}
window.currentFilters = currentFilters;

// Stakeholder Mode Functionality
function initStakeholderMode() {
    // Check for stakeholder parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const isStakeholder = urlParams.get('stakeholder') === 'true' ||
                         localStorage.getItem('stakeholderMode') === 'true';

    if (isStakeholder) {
        document.body.classList.add('stakeholder');
        // Store stakeholder mode in localStorage for persistence
        localStorage.setItem('stakeholderMode', 'true');
    }

    // Add keyboard shortcut (Ctrl+Shift+S) to toggle stakeholder mode
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            toggleStakeholderMode();
        }
    });
}

function toggleStakeholderMode() {
    const isCurrentlyStakeholder = document.body.classList.contains('stakeholder');

    if (isCurrentlyStakeholder) {
        document.body.classList.remove('stakeholder');
        localStorage.setItem('stakeholderMode', 'false');
        console.log('Stakeholder mode disabled');
    } else {
        document.body.classList.add('stakeholder');
        localStorage.setItem('stakeholderMode', 'true');
        console.log('Stakeholder mode enabled');
    }
}

// Initialize stakeholder mode when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStakeholderMode);
} else {
    initStakeholderMode();
}

// Share clinic function
function shareClinic() {
    const clinicName = document.getElementById('clinicName')?.textContent || 'Clinic';
    const url = window.location.href;
    const title = `${clinicName} - CareGrid`;
    const text = `Check out ${clinicName} on CareGrid - Your trusted healthcare directory`;

    // Check if Web Share API is supported
    if (navigator.share) {
        navigator.share({
            title: title,
            text: text,
            url: url
        }).then(() => {
            console.log('Clinic shared successfully');
        }).catch((error) => {
            console.log('Error sharing clinic:', error);
            fallbackShare(url, title, text);
        });
    } else {
        fallbackShare(url, title, text);
    }
}

// Fallback share function for browsers without Web Share API
function fallbackShare(url, title, text) {
    // Try to copy to clipboard
    if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(() => {
            alert('Clinic link copied to clipboard!');
        }).catch(() => {
            // If clipboard fails, show a modal with the link
            showShareModal(url, title, text);
        });
    } else {
        showShareModal(url, title, text);
    }
}

// Show share modal with social media options
function showShareModal(url, title, text) {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = encodeURIComponent(text);

    const shareOptions = [
        {
            name: 'Facebook',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
            icon: 'fab fa-facebook-f'
        },
        {
            name: 'Twitter',
            url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
            icon: 'fab fa-twitter'
        },
        {
            name: 'LinkedIn',
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
            icon: 'fab fa-linkedin-in'
        },
        {
            name: 'WhatsApp',
            url: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
            icon: 'fab fa-whatsapp'
        },
        {
            name: 'Email',
            url: `mailto:?subject=${encodedTitle}&body=${encodedText}%20${encodedUrl}`,
            icon: 'fas fa-envelope'
        }
    ];

    let modalHtml = `
        <div id="shareModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 400px; width: 90%;">
                <h3 style="margin-top: 0; text-align: center; color: #333;">Share Clinic</h3>
                <div style="margin: 20px 0;">
                    <input type="text" value="${url}" readonly style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;" onclick="this.select()">
                    <button onclick="copyToClipboard('${url}')" style="width: 100%; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; margin-bottom: 15px; cursor: pointer;">Copy Link</button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap: 10px; margin: 20px 0;">
    `;

    shareOptions.forEach(option => {
        modalHtml += `
            <a href="${option.url}" target="_blank" style="display: flex; flex-direction: column; align-items: center; padding: 10px; text-decoration: none; color: #333; border: 1px solid #ddd; border-radius: 5px; transition: background 0.3s;" onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background='white'">
                <i class="${option.icon}" style="font-size: 20px; margin-bottom: 5px;"></i>
                <span style="font-size: 12px;">${option.name}</span>
            </a>
        `;
    });

    modalHtml += `
                </div>
                <button onclick="closeShareModal()" style="width: 100%; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;">Close</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Copy to clipboard function
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            alert('Link copied to clipboard!');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
    }
}

// Close share modal
function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.remove();
    }
}

// Get Directions functionality
function getDirections(address) {
    // Encode the address for URL
    const encodedAddress = encodeURIComponent(address);

    // Check if geolocation is available
    if ('geolocation' in navigator) {
        // Request user's current location
        navigator.geolocation.getCurrentPosition(
            function(position) {
                // Success: Got user's location
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                openMapsWithLocation(encodedAddress, userLat, userLng);
            },
            function(error) {
                // Error or permission denied: Fall back to destination-only directions
                console.log('Geolocation error:', error.message);
                openMapsWithoutLocation(encodedAddress);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    } else {
        // Geolocation not supported: Fall back to destination-only directions
        openMapsWithoutLocation(encodedAddress);
    }
}

function openMapsWithLocation(encodedAddress, userLat, userLng) {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // Try to open in native maps app with current location as start point
        const mapsUrl = `maps://maps.google.com/maps?saddr=${userLat},${userLng}&daddr=${encodedAddress}`;
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodedAddress}`;

        // Try native app first, fallback to web
        window.location.href = mapsUrl;

        // Fallback to Google Maps web after a short delay
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1000);
    } else {
        // Desktop: Open Google Maps in new tab with directions from current location
        const googleMapsUrl = `https://www.google.com/maps/dir/${userLat},${userLng}/${encodedAddress}`;
        window.open(googleMapsUrl, '_blank');
    }
}

function openMapsWithoutLocation(encodedAddress) {
    // Check if user is on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (isMobile) {
        // Try to open in native maps app first, fallback to Google Maps web
        const mapsUrl = `maps://maps.google.com/maps?daddr=${encodedAddress}`;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;

        // Create a temporary link to test if maps:// protocol is supported
        const tempLink = document.createElement('a');
        tempLink.href = mapsUrl;

        // Try native app, fallback to web
        window.location.href = mapsUrl;

        // Fallback to Google Maps web after a short delay
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
        }, 1000);
    } else {
        // Desktop: Open Google Maps in new tab
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
        window.open(googleMapsUrl, '_blank');
    }
}

// Navbar Authentication State Management
function updateNavbarAuthState() {
    const authNavItem = document.getElementById('authNavItem');
    const userNavItem = document.getElementById('userNavItem');
    const userName = document.getElementById('userName');

    if (window.authSystem && window.authSystem.isAuthenticated()) {
        const currentUser = window.authSystem.getCurrentUser();

        if (authNavItem) authNavItem.style.display = 'none';
        if (userNavItem) userNavItem.style.display = 'block';

        if (userName && currentUser) {
            const firstName = currentUser.firstName || currentUser.name || 'User';
            const title = currentUser.role === 'doctor' ? 'Dr.' : '';
            userName.textContent = `${title} ${firstName}`.trim();
        }
    } else {
        if (authNavItem) authNavItem.style.display = 'block';
        if (userNavItem) userNavItem.style.display = 'none';
    }
}

// Enhanced logout function
function logout() {
    if (window.authSystem) {
        window.authSystem.logout();
    } else {
        // Fallback logout
        localStorage.removeItem('careGridCurrentUser');
        sessionStorage.removeItem('careGridCurrentUser');
        localStorage.removeItem('careGridToken');
        window.location.href = 'index.html';
    }
}

// Check authentication state on page load
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit for auth system to initialize
    setTimeout(() => {
        updateNavbarAuthState();
    }, 100);
});

// Update navbar when auth state changes
window.addEventListener('authStateChanged', updateNavbarAuthState);

/** @description Manages multi-step form for CareGrid clinic registration */
function nextStep(step) {
    document.querySelectorAll('.step').forEach(s => s.style.display = 'none');
    document.getElementById(`step${step}`).style.display = 'block';
}

// Make nextStep function available globally
window.nextStep = nextStep;

// Add event listener for clinic form submission
document.addEventListener('DOMContentLoaded', function() {
    const clinicForm = document.getElementById('clinic-form');
    if (clinicForm) {
        clinicForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (e.target.checkValidity()) {
                console.log('Form data:', new FormData(e.target));
            }
        });
    }

    // Initialize mobile filter chips
    initializeMobileFilters();
});

// ==================================================================
// MOBILE FILTER CHIPS FUNCTIONALITY
// ==================================================================

function initializeMobileFilters() {
    const filterChips = document.querySelectorAll('.filter-chip');

    filterChips.forEach(chip => {
        chip.addEventListener('click', function(e) {
            e.preventDefault();

            const filter = this.getAttribute('data-filter');

            if (filter === 'more') {
                // Show more filters modal/sheet
                showMoreFiltersSheet();
                return;
            }

            // Remove active class from all chips
            filterChips.forEach(c => c.classList.remove('active'));

            // Add active class to clicked chip
            this.classList.add('active');

            // Apply the filter
            applyMobileFilter(filter);
        });
    });
}

function applyMobileFilter(filter) {
    // Update the dropdown filters to match the chip selection
    if (['gp', 'dentist', 'physio', 'optician', 'pharmacy'].includes(filter)) {
        // It's a category filter
        const categorySelect = document.getElementById('categoryFilter');
        if (categorySelect) {
            categorySelect.value = filter;
        }
        filterByCategory(filter);
    } else if (['manchester', 'bolton', 'liverpool', 'leeds', 'london'].includes(filter)) {
        // It's a location filter
        const locationSelect = document.getElementById('locationFilter');
        if (locationSelect) {
            locationSelect.value = filter;
        }
        filterByLocation(filter);
    } else if (filter === 'all') {
        // Reset all filters
        resetFilters();
    }
}

function showMoreFiltersSheet() {
    // Create a simple modal for additional filters
    const modal = document.createElement('div');
    modal.className = 'mobile-filter-modal';
    modal.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>More Filters</h3>
                <button class="modal-close" onclick="closeMobileFilterModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="filter-group">
                    <label>Sort by:</label>
                    <div class="filter-options">
                        <button class="filter-option" data-sort="rating">Highest Rated</button>
                        <button class="filter-option" data-sort="reviews">Most Reviews</button>
                        <button class="filter-option" data-sort="distance">Nearest</button>
                    </div>
                </div>
                <div class="filter-group">
                    <label>Rating:</label>
                    <div class="filter-options">
                        <button class="filter-option" data-rating="4">4+ Stars</button>
                        <button class="filter-option" data-rating="4.5">4.5+ Stars</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add styles for the modal
    if (!document.getElementById('mobile-filter-modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'mobile-filter-modal-styles';
        styles.textContent = `
            .mobile-filter-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
            }

            .modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
            }

            .modal-content {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: white;
                border-radius: 16px 16px 0 0;
                padding: 24px;
                max-height: 70vh;
                overflow-y: auto;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }

            .modal-close {
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .filter-group {
                margin-bottom: 20px;
            }

            .filter-group label {
                display: block;
                font-weight: 600;
                margin-bottom: 12px;
                color: #333;
            }

            .filter-options {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }

            .filter-option {
                padding: 8px 16px;
                background: #f3f4f6;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .filter-option:hover,
            .filter-option.active {
                background: #2A6EF3;
                color: white;
                border-color: #2A6EF3;
            }
        `;
        document.head.appendChild(styles);
    }

    // Close modal when clicking backdrop
    modal.querySelector('.modal-backdrop').addEventListener('click', closeMobileFilterModal);
}

function closeMobileFilterModal() {
    const modal = document.querySelector('.mobile-filter-modal');
    if (modal) {
        modal.remove();
    }
}

// Enhanced createClinicCard function for mobile improvements
function createEnhancedClinicCard(clinic) {
    const card = document.createElement('div');
    card.className = 'clinic-card fade-in';
    card.style.cursor = 'pointer';

    // Add click event to entire card
    card.addEventListener('click', function(e) {
        // Don't navigate if clicking on action buttons
        if (!e.target.closest('.clinic-actions')) {
            window.location.href = `clinic-profile.html?id=${clinic.frontendId || clinic.id}`;
        }
    });

    // Create star rating with actual star icons
    const fullStars = Math.floor(clinic.rating);
    const hasHalfStar = clinic.rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    let starsHTML = '';
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }

    // Get type icon for overlay
    const typeIcon = getTypeIcon(clinic.type);

    card.innerHTML = `
        <div class="clinic-image-container">
            <img src="${clinic.logoUrl || (clinic.images && clinic.images[0]) || clinic.image}"
                 alt="${clinic.name} - ${formatType(clinic.type)} clinic"
                 class="clinic-image"
                 loading="lazy"
                 onerror="this.src="https://vzjqrbicwhyawtsjnplt.supabase.co/storage/v1/object/public/clinic-images/clinic1.svg"">
            <div class="image-overlay">
                <div class="type-badge">
                    <i class="${typeIcon}"></i>
                    <span>${formatType(clinic.type)}</span>
                </div>
                ${(clinic.premium !== undefined ? clinic.premium : false) ? '<div class="premium-badge-image"><i class="fas fa-crown"></i> Premium</div>' : ''}
            </div>
        </div>
        <div class="clinic-content">
            <h3 class="clinic-name">${clinic.name}</h3>
            <p class="clinic-type">${formatType(clinic.type)}</p>
            <p class="clinic-location">${clinic.address}</p>
            <div class="clinic-rating">
                <div class="stars">${starsHTML}</div>
                <span class="rating-text">${clinic.rating}</span>
                <span class="review-count">(${clinic.reviewCount || clinic.reviews} reviews)</span>
            </div>
            <div class="clinic-actions">
                <a href="clinic-profile.html?id=${clinic.id}" class="visit-btn">
                    <i class="fas fa-eye"></i> View Details
                </a>
                <a href="tel:${clinic.phone}" class="contact-btn">
                    <i class="fas fa-phone"></i> Call Now
                </a>
            </div>
        </div>
    `;

    return card;
}

// Create skeleton loading cards
function createSkeletonCard() {
    const card = document.createElement('div');
    card.className = 'clinic-card skeleton';

    card.innerHTML = `
        <div class="clinic-image-container">
            <div class="clinic-image"></div>
        </div>
        <div class="clinic-content">
            <div class="clinic-name"></div>
            <div class="clinic-type"></div>
            <div class="clinic-location"></div>
            <div class="clinic-rating">
                <div class="stars">★★★★★</div>
                <span class="rating-text">4.8</span>
                <span class="review-count">(123 reviews)</span>
            </div>
            <div class="clinic-actions">
                <div class="visit-btn">View Details</div>
                <div class="contact-btn">Call Now</div>
            </div>
        </div>
    `;

    return card;
}

// Show skeleton loading state
function showSkeletonLoading(container, count = 6) {
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        container.appendChild(createSkeletonCard());
    }
}

// Hide skeleton and show actual content with fade-in
function hideSkeletonAndShowContent(container, content) {
    if (!container) return;

    // Remove skeleton cards
    const skeletons = container.querySelectorAll('.clinic-card.skeleton');
    skeletons.forEach(skeleton => skeleton.remove());

    // Add real content with fade-in animation
    if (Array.isArray(content)) {
        content.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                container.appendChild(card);
                // Trigger fade-in animation
                setTimeout(() => {
                    card.style.transition = 'opacity 0.3s ease';
                    card.style.opacity = '1';
                }, 50);
            }, index * 100); // Stagger the appearance
        });
    }
}

// Make functions available globally
window.initializeMobileFilters = initializeMobileFilters;
window.applyMobileFilter = applyMobileFilter;
window.showMoreFiltersSheet = showMoreFiltersSheet;
window.closeMobileFilterModal = closeMobileFilterModal;
window.createEnhancedClinicCard = createEnhancedClinicCard;
window.createSkeletonCard = createSkeletonCard;
window.showSkeletonLoading = showSkeletonLoading;
window.hideSkeletonAndShowContent = hideSkeletonAndShowContent;console.log("Script.js loaded and executing");
