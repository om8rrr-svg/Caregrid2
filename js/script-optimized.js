// Optimized CareGrid Script - Performance Enhanced Version
import { buildUrl } from './api-base.js';
import { APIService } from './api-service.js';
import { CloudAssets } from './cloud-config.js';


// Initialize API service
const apiService = new APIService();

// Unregister service workers to prevent cache issues
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
    });
}

// Minimal fallback data - reduced from 500+ to essential clinics only
let clinicsData = [
    {
        "id": 1,
        "name": "Pall Mall Medical Manchester",
        "type": "Private GP",
        "location": "Manchester",
        "address": "61 King Street, Manchester M2 4PD",
        "rating": 4.8,
        "reviews": 342,
        "image": CloudAssets.getClinicPlaceholder(1),
        "premium": true,
        "phone": "0161 832 2111",
        "website": "https://pallmallmedical.co.uk",
        "description": "Premium private healthcare provider in Manchester's business district.",
        "services": ["Private GP Consultations", "Health Screening", "Executive Health", "Travel Medicine"]
    },
    {
        "id": 2,
        "name": "Didsbury Dental Practice",
        "type": "Private Dentist",
        "location": "Manchester",
        "address": "90 Barlow Moor Rd, Manchester M20 2PN",
        "rating": 4.9,
        "reviews": 567,
        "image": CloudAssets.getClinicPlaceholder(2),
        "premium": true,
        "phone": "0161 455 0005",
        "website": "https://didsburydental.co.uk",
        "description": "Modern dental clinic providing exceptional dental care in Didsbury.",
        "services": ["General Dentistry", "Cosmetic Dentistry", "Invisalign", "Emergency Dental Care"]
    },
    {
        "id": 3,
        "name": "City Rehab Liverpool",
        "type": "Private Physiotherapy",
        "location": "Liverpool",
        "address": "Liverpool City Centre, L1 8JQ",
        "rating": 4.7,
        "reviews": 423,
        "image": CloudAssets.getClinicPlaceholder(3),
        "premium": true,
        "phone": "0151 707 2345",
        "website": "https://cityrehab.co.uk",
        "description": "Leading physiotherapy clinic specializing in sports injury rehabilitation.",
        "services": ["Sports Injury Treatment", "Physiotherapy", "Sports Massage", "Biomechanical Analysis"]
    }
];

// Performance optimized filters
let currentFilters = {
    category: 'all',
    location: 'all',
    search: '',
    sortBy: null,
    premium: null
};

// Pagination with reduced load
let currentPage = 1;
const clinicsPerPage = 6;
let filteredClinics = [];

// Debounced event handlers to reduce CPU usage
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttled scroll handler
const throttle = (func, limit) => {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
};

// Optimized DOM ready handler
function initializeApp() {
    try {
        handleURLParameters();
        loadClinicsFromAPI();
        setupEventListeners();
        updateLocationCounts();
        updateCategoryCounts();
    } catch (error) {
        console.error('App initialization error:', error);
        loadFallbackData();
    }
}

// Lazy load clinics from API with better error handling
async function loadClinicsFromAPI(retryCount = 0) {
    const maxRetries = 2;
    
    try {
        showAPIStatus('Loading clinics...', 'loading');
        
        const response = await apiService.getClinics({
            limit: 50, // Reduced from unlimited
            timeout: 8000
        });
        
        if (response?.data?.length > 0) {
            clinicsData = response.data.slice(0, 50); // Limit to 50 clinics max
            setCachedClinics(clinicsData);
            showAPIStatus('Clinics loaded successfully', 'success');
        } else {
            throw new Error('No clinics data received');
        }
    } catch (error) {
        console.warn('API load failed:', error.message);
        
        if (retryCount < maxRetries) {
            setTimeout(() => loadClinicsFromAPI(retryCount + 1), 2000);
            return;
        }
        
        // Use cached data or fallback
        const cached = getCachedClinics();
        if (cached?.length > 0) {
            clinicsData = cached;
            showAPIStatus('Using cached data', 'warning');
        } else {
            loadFallbackData();
        }
    } finally {
        applyFilters();
        updateLocationCounts();
        updateCategoryCounts();
    }
}

// Optimized event listeners setup
function setupEventListeners() {
    // Use passive listeners where possible
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 500), { passive: true });
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', debounce(applyFilters, 300));
    }
    
    const locationFilter = document.getElementById('locationFilter');
    if (locationFilter) {
        locationFilter.addEventListener('change', debounce(applyFilters, 300));
    }
    
    // Throttled scroll handler
    window.addEventListener('scroll', throttle(() => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-section');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    }, 16), { passive: true }); // 60fps throttling
}

// Optimized search with reduced processing
function handleSearch(event) {
    currentFilters.search = event.target.value.toLowerCase().trim();
    applyFilters();
}

// Efficient filtering with early returns
function applyFilters() {
    let filtered = [...clinicsData];
    
    // Early return if no filters
    if (currentFilters.category === 'all' && 
        currentFilters.location === 'all' && 
        !currentFilters.search && 
        !currentFilters.premium) {
        filteredClinics = filtered;
        currentPage = 1;
        renderClinics();
        return;
    }
    
    // Apply filters efficiently
    if (currentFilters.category !== 'all') {
        filtered = filtered.filter(clinic => 
            clinic.type.toLowerCase().includes(currentFilters.category.toLowerCase())
        );
    }
    
    if (currentFilters.location !== 'all') {
        filtered = filtered.filter(clinic => 
            clinic.location.toLowerCase() === currentFilters.location.toLowerCase()
        );
    }
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search;
        filtered = filtered.filter(clinic => 
            clinic.name.toLowerCase().includes(searchTerm) ||
            clinic.type.toLowerCase().includes(searchTerm) ||
            clinic.location.toLowerCase().includes(searchTerm) ||
            clinic.services?.some(service => service.toLowerCase().includes(searchTerm))
        );
    }
    
    if (currentFilters.premium !== null) {
        filtered = filtered.filter(clinic => clinic.premium === currentFilters.premium);
    }
    
    filteredClinics = filtered;
    currentPage = 1;
    renderClinics();
}

// Optimized rendering with virtual scrolling concept
function renderClinics() {
    const container = document.getElementById('clinicsContainer');
    if (!container) return;
    
    const startIndex = (currentPage - 1) * clinicsPerPage;
    const endIndex = startIndex + clinicsPerPage;
    const clinicsToShow = filteredClinics.slice(startIndex, endIndex);
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    clinicsToShow.forEach(clinic => {
        const card = createOptimizedClinicCard(clinic);
        fragment.appendChild(card);
    });
    
    // Single DOM update
    container.innerHTML = '';
    container.appendChild(fragment);
    
    renderPagination();
}

// Lightweight clinic card creation
function createOptimizedClinicCard(clinic) {
    const card = document.createElement('div');
    card.className = 'clinic-card';
    card.innerHTML = `
        <div class="clinic-image">
            <img src="${clinic.image}" alt="${clinic.name}" loading="lazy">
            ${clinic.premium ? '<span class="premium-badge">Premium</span>' : ''}
        </div>
        <div class="clinic-info">
            <h3>${clinic.name}</h3>
            <p class="clinic-type">${formatType(clinic.type)}</p>
            <p class="clinic-location">${clinic.location}</p>
            <div class="clinic-rating">
                <span class="stars">${'★'.repeat(Math.floor(clinic.rating))}</span>
                <span class="rating-text">${clinic.rating} (${clinic.reviews} reviews)</span>
            </div>
        </div>
    `;
    
    // Single event listener per card
    card.addEventListener('click', () => {
        window.location.href = `clinic-profile.html?id=${clinic.id}`;
    }, { passive: true });
    
    return card;
}

// Utility functions
function formatType(type) {
    return type.replace('Private ', '');
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    
    const totalPages = Math.ceil(filteredClinics.length / clinicsPerPage);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    if (currentPage > 1) {
        paginationHTML += `<button onclick="goToPage(${currentPage - 1})" class="pagination-btn">Previous</button>`;
    }
    
    // Page numbers (show max 5 pages)
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    
    for (let i = startPage; i <= endPage; i++) {
        paginationHTML += `<button onclick="goToPage(${i})" class="pagination-btn ${i === currentPage ? 'active' : ''}">${i}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="goToPage(${currentPage + 1})" class="pagination-btn">Next</button>`;
    }
    
    container.innerHTML = paginationHTML;
}

function goToPage(page) {
    currentPage = page;
    renderClinics();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Optimized caching
function setCachedClinics(clinics) {
    try {
        // Only cache essential data
        const essentialData = clinics.slice(0, 20).map(clinic => ({
            id: clinic.id,
            name: clinic.name,
            type: clinic.type,
            location: clinic.location,
            rating: clinic.rating,
            reviews: clinic.reviews,
            premium: clinic.premium,
            image: clinic.image
        }));
        localStorage.setItem('caregrid_clinics', JSON.stringify(essentialData));
        localStorage.setItem('caregrid_cache_time', Date.now().toString());
    } catch (error) {
        console.warn('Cache storage failed:', error);
    }
}

function getCachedClinics() {
    try {
        const cacheTime = localStorage.getItem('caregrid_cache_time');
        const maxAge = 30 * 60 * 1000; // 30 minutes
        
        if (cacheTime && (Date.now() - parseInt(cacheTime)) < maxAge) {
            return JSON.parse(localStorage.getItem('caregrid_clinics') || '[]');
        }
    } catch (error) {
        console.warn('Cache retrieval failed:', error);
    }
    return null;
}

function loadFallbackData() {
    console.log('Using fallback clinic data');
    showAPIStatus('Using offline data', 'warning');
    applyFilters();
}

function showAPIStatus(message, status) {
    const statusEl = document.getElementById('apiStatus');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.className = `api-status ${status}`;
        
        if (status === 'success' || status === 'warning') {
            setTimeout(() => {
                statusEl.style.opacity = '0';
                setTimeout(() => statusEl.textContent = '', 300);
            }, 3000);
        }
    }
}

// Optimized location and category counting
async function updateLocationCounts() {
    const locationFilter = document.getElementById('locationFilter');
    if (!locationFilter) return;
    
    const counts = {};
    clinicsData.forEach(clinic => {
        counts[clinic.location] = (counts[clinic.location] || 0) + 1;
    });
    
    // Update options efficiently
    Array.from(locationFilter.options).forEach(option => {
        if (option.value !== 'all') {
            const count = counts[option.value] || 0;
            option.textContent = `${option.value} (${count})`;
        }
    });
}

async function updateCategoryCounts() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;
    
    const counts = {};
    clinicsData.forEach(clinic => {
        const type = clinic.type.toLowerCase();
        counts[type] = (counts[type] || 0) + 1;
    });
    
    Array.from(categoryFilter.options).forEach(option => {
        if (option.value !== 'all') {
            const count = counts[option.value] || 0;
            option.textContent = `${option.textContent.split(' (')[0]} (${count})`;
        }
    });
}

function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.has('category')) {
        currentFilters.category = urlParams.get('category');
    }
    if (urlParams.has('location')) {
        currentFilters.location = urlParams.get('location');
    }
    if (urlParams.has('search')) {
        currentFilters.search = urlParams.get('search');
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = currentFilters.search;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export essential functions
window.goToPage = goToPage;
window.applyFilters = applyFilters;
window.currentFilters = currentFilters;
window.clinicsData = clinicsData;