
// /js/home.js
import { fetchJson } from './api-base.js';
import { CloudAssets } from './cloud-config.js';
import clinicService from './clinic-service.js';

// Validate clinic data completeness
function validateClinicData(clinic) {
    const requiredFields = ['name', 'type', 'address'];
    const optionalFields = ['phone', 'website', 'rating', 'reviews', 'description', 'image'];
    
    let score = 0;
    let maxScore = requiredFields.length + optionalFields.length;
    
    // Check required fields (weighted more heavily)
    const missingRequired = requiredFields.filter(field => !clinic[field] || clinic[field].trim() === '');
    score += (requiredFields.length - missingRequired.length);
    
    // Check optional fields
    const presentOptional = optionalFields.filter(field => clinic[field] && clinic[field].toString().trim() !== '');
    score += presentOptional.length;
    
    const completenessScore = Math.round((score / maxScore) * 100);
    const isValid = missingRequired.length === 0 && completenessScore >= 60;
    
    return {
        isValid,
        completenessScore,
        missingRequired,
        presentOptional: presentOptional.length,
        quality: completenessScore >= 80 ? 'good' : completenessScore >= 60 ? 'incomplete' : 'poor'
    };
}


function el(id) { return document.getElementById(id); }

async function loadCities() {
  const container = el('citiesContainer'); // UL/div where you show city chips or list
  if (!container) return;
  container.innerHTML = '<div class="muted">Loading…</div>';

  try {
    const clinics = await clinicService.getClinics({ limit: 500 });
    
    // Add deduplication safeguard
    const uniq = arr => [...new Set(arr.filter(Boolean))];
    const cities = uniq(clinics.map(c => c.city)).sort();

    if (cities.length === 0) {
      container.innerHTML = `<div class="muted">No cities yet. Please check back soon.</div>`;
      return;
    }

    container.innerHTML = cities
      .map(c => `<button class="chip city-chip" data-city="${c}">${c}</button>`)
      .join('');

    container.querySelectorAll('.city-chip').forEach(btn => {
      btn.addEventListener('click', () => loadClinicsForCity(btn.dataset.city));
    });
  } catch (e) {
    container.innerHTML = `
      <div class="muted">Couldn't load locations (${e.message}).</div>
      <button class="btn btn-outline" id="retryCities">Retry</button>
    `;
    el('retryCities')?.addEventListener('click', loadCities);
  }
}

async function loadClinicsForCity(city) {
  const list = el('clinicsList'); // container where clinic cards render
  if (!list) return;
  list.innerHTML = '<div class="muted">Loading clinics…</div>';

  try {
    const items = await clinicService.getClinics({ city, limit: 100 });
    if (items.length === 0) {
      list.innerHTML = `<div class="muted">No clinics found in ${city} yet.</div>`;
      return;
    }
    list.innerHTML = items.map(renderClinicCard).join('');
  } catch (e) {
    list.innerHTML = `
      <div class="muted">Couldn't load clinics (${e.message}).</div>
      <button class="btn btn-outline" id="retryCity">Retry</button>
    `;
    el('retryCity')?.addEventListener('click', () => loadClinicsForCity(city));
  }
}

function renderClinicCard(c) {
  // Validate clinic data
  const validation = validateClinicData(c);
  
  // Handle missing or incomplete data with fallbacks
  const name = c.name || 'Healthcare Provider';
  const addr = [c.address, c.city, c.postcode].filter(Boolean).join(', ') || 'Address not available';
  const phone = c.phone || null;
  const site = c.website ? `<a href="${c.website}" target="_blank" rel="noopener">Website</a>` : '';
  const rating = c.rating ? c.rating.toFixed(1) : 'N/A';
  const reviews = c.reviews || 0;
  const image = c.image || 'images/clinic-placeholder.svg';
  const description = c.description || 'Healthcare services available';
  const clinicType = c.type || c.category || 'Healthcare';
  
  // Generate data completeness indicator
  let completenessIndicator = '';
  if (!validation.isValid) {
    completenessIndicator = `
      <div class="data-completeness-badge" style="position: absolute; top: 10px; right: 10px; background: rgba(255, 193, 7, 0.9); color: #856404; padding: 4px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; z-index: 10;" title="Profile ${validation.completenessScore}% complete">
        <i class="fas fa-info-circle" style="margin-right: 4px;"></i>${validation.completenessScore}%
      </div>
    `;
  }
  
  // Generate contact actions based on available data
  let phoneAction = '';
  if (phone) {
    phoneAction = `<div class="clinic-phone" style="color: #888; font-size: 13px;"><a href="tel:${phone}" style="color: #2A6EF3; text-decoration: none;">${phone}</a></div>`;
  } else {
    phoneAction = `<div class="clinic-phone" style="color: #dc3545; font-size: 13px; font-style: italic;"><i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>Phone not available</div>`;
  }
  
  return `
    <div class="clinic-card" data-quality="${validation.quality}" style="position: relative;">
      ${completenessIndicator}
      <div class="clinic-card__image">
        <img src="${image}" alt="${name}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;">
      </div>
      <div class="clinic-card__head">
        <h3>${name}</h3>
        <span class="badge">${clinicType}</span>
      </div>
      <div class="clinic-card__body">
        <div class="clinic-rating" style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="color: #ffc107; margin-right: 5px;">★</span>
          <span style="font-weight: 600;">${rating}</span>
          <span style="color: #666; margin-left: 5px;">(${reviews} reviews)</span>
        </div>
        <div class="clinic-description" style="color: #666; font-size: 14px; margin-bottom: 8px;">${description}</div>
        <div class="clinic-address ${addr === 'Address not available' ? 'missing-data' : ''}" style="color: #888; font-size: 13px; ${addr === 'Address not available' ? 'color: #dc3545; font-style: italic;' : ''}">
          ${addr === 'Address not available' ? '<i class="fas fa-exclamation-triangle" style="margin-right: 4px;"></i>' : ''}${addr}
        </div>
        ${phoneAction}
      </div>
      <div class="clinic-card__actions">
        ${site}
        ${c.bookingLink ? `<a href="${c.bookingLink}" target="_blank" rel="noopener" style="min-height: 44px; min-width: 44px; padding: 10px 15px; display: inline-flex; align-items: center; justify-content: center;">Book</a>` : ''}
      </div>
    </div>
  `;
}

function renderSkeletonCards(count = 3) {
  if (window.skeletonLoader) {
    return window.skeletonLoader.generateHTML('cards', { count });
  } else {
    // Fallback for legacy support
    return Array(count).fill(0).map(() => `
      <div class="clinic-card skeleton-card" aria-hidden="true">
        <div class="skeleton-image" style="width: 100%; height: 200px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: skeleton-shimmer 1.5s infinite;"></div>
        <div class="clinic-card__head">
          <div class="skeleton-text" style="height: 20px; width: 70%; background: #f0f0f0; margin-bottom: 8px;"></div>
          <div class="skeleton-text" style="height: 16px; width: 40%; background: #f0f0f0;"></div>
        </div>
        <div class="clinic-card__body">
          <div class="skeleton-text" style="height: 14px; width: 80%; background: #f0f0f0; margin-bottom: 6px;"></div>
          <div class="skeleton-text" style="height: 14px; width: 60%; background: #f0f0f0; margin-bottom: 6px;"></div>
          <div class="skeleton-text" style="height: 14px; width: 50%; background: #f0f0f0;"></div>
        </div>
      </div>
    `).join('');
  }
}

async function loadFeaturedClinics() {
  const list = el('clinicGrid'); // container where featured clinic cards render
  if (!list) return;
  
  // Check if clinics are already loaded by script.js
  if (list.children.length > 0 && !list.innerHTML.includes('Loading') && !list.innerHTML.includes('skeleton')) {
    return; // Already populated by script.js
  }
  
  // Show skeleton loading state
  if (window.skeletonLoader) {
    window.skeletonLoader.show(list, 'cards', { count: 3 });
  } else {
    list.innerHTML = renderSkeletonCards(3);
  }

  // No demo data - service will show error state if API is unavailable

  try {
    let clinics;
    try {
      // Try clinic service first
      clinics = await clinicService.getClinics({ limit: 100 });
    } catch (serviceError) {
      console.warn('Clinic service failed, falling back to Supabase:', serviceError);
      // Fallback to direct Supabase query
      const { createClient } = supabase;
      const supabaseUrl = 'https://vzjqrbicwhyawtsjnplt.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anFyYmljd2h5YXd0c2pucGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxODU1NzksImV4cCI6MjA3Mjc2MTU3OX0.JlK3oGXK3rzaez8p-6BmGDZRNAUEKTpJgZ3flicw7ds';
      const supabaseClient = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabaseClient
        .from('clinics')
        .select('*')
        .limit(100);
      
      if (error) throw error;
      clinics = data || [];
    }
    
    const items = Array.isArray(clinics) ? clinics.slice(0, 6) : []; // Take up to 6 featured
    
    let data, isDemo = false;
    
    if (items.length > 0) {
      data = items;
      
      // Hide any demo badge if present
      const resultsInfo = el('resultsInfo');
      if (resultsInfo) {
        resultsInfo.style.display = 'none';
      }
    } else {
      // If no data from any source, throw error
      throw new Error('No clinic data available from any source');
    }
    
    // Hide skeleton and render actual clinics
    if (window.skeletonLoader && window.skeletonLoader.isLoading(list)) {
      window.skeletonLoader.hide(list);
    }
    
    renderClinics(data);
  } catch (e) {
    // Hide skeleton and show error state
    if (window.skeletonLoader && window.skeletonLoader.isLoading(list)) {
      window.skeletonLoader.hide(list);
    }
    
    // Show error message instead of demo data
    list.innerHTML = `
      <div class="error-state" style="text-align: center; padding: 40px 20px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 20px 0;">
        <div style="font-size: 48px; color: #856404; margin-bottom: 16px;">⚠️</div>
        <h3 style="color: #856404; margin-bottom: 12px;">Service Temporarily Unavailable</h3>
        <p style="color: #856404; margin-bottom: 20px;">We're currently working to fix this issue. Please try again in a few moments.</p>
        <button class="btn btn-primary" id="retryFeatured" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Try Again</button>
      </div>
    `;
    
    // Add retry functionality
    el('retryFeatured')?.addEventListener('click', loadFeaturedClinics);
    
    // Hide results info
    const resultsInfo = el('resultsInfo');
    if (resultsInfo) {
      resultsInfo.style.display = 'none';
    }
  }
}

function renderClinics(data) {
  const list = el('clinicGrid');
  if (!list) return;
  
  if (data.length === 0) {
    list.innerHTML = '<div class="muted">No featured clinics available.</div>';
    return;
  }
  
  list.innerHTML = data.map(clinic => renderClinicCard(clinic)).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize accessibility helper
  if (typeof AccessibilityHelper !== 'undefined') {
    window.accessibilityHelper = new AccessibilityHelper();
    window.accessibilityHelper.init();
  }
  
  // Clear any placeholder text on init
  document.querySelectorAll('.clinic-count').forEach(el => el.textContent = '—');
  
  loadCities();
  loadFeaturedClinics();
  initMobileFilters();
});

// Listen for clinic data loaded event to retry featured clinics loading
document.addEventListener('clinicsDataLoaded', () => {
  // Retry loading featured clinics now that data is available
  loadFeaturedClinics();
});

// Mobile Filter Bar Implementation
function initMobileFilters() {
  const filterBar = document.getElementById('mobileFilterBar');
  const filterChips = document.getElementById('filterChips');
  const moreFiltersBtn = document.getElementById('moreFiltersBtn');
  const bottomSheet = document.getElementById('filterBottomSheet');
  const closeSheetBtn = document.getElementById('closeSheetBtn');
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  
  if (!filterBar) return; // Not on homepage
  
  // Initialize filter state
  const filterState = {
    category: 'all',
    location: 'all',
    rating: 'all',
    sort: 'rating'
  };
  
  // Filter data - deduplicated using Set and alphabetically sorted
  const filterData = {
    categories: [
      { id: 'all', name: 'All', icon: 'fas fa-hospital', count: '25+' },
      { id: 'gp', name: 'GP', icon: 'fas fa-stethoscope', count: '8' },
      { id: 'dentist', name: 'Dentist', icon: 'fas fa-tooth', count: '6' },
      { id: 'physio', name: 'Physio', icon: 'fas fa-dumbbell', count: '4' },
      { id: 'optician', name: 'Optician', icon: 'fas fa-eye', count: '5' },
      { id: 'pharmacy', name: 'Pharmacy', icon: 'fas fa-capsules', count: '2' }
    ],
    locations: [
      { id: 'all', name: 'All Locations', count: '25+' },
      { id: 'bolton', name: 'Bolton', count: '4' },
      { id: 'leeds', name: 'Leeds', count: '5' },
      { id: 'liverpool', name: 'Liverpool', count: '6' },
      { id: 'london', name: 'London', count: '2' },
      { id: 'manchester', name: 'Manchester', count: '8' }
    ].sort((a, b) => a.name === 'All Locations' ? -1 : b.name === 'All Locations' ? 1 : a.name.localeCompare(b.name)),
    ratings: [
      { id: 'all', name: 'Any Rating' },
      { id: '4plus', name: '4+ Stars' },
      { id: '4.5plus', name: '4.5+ Stars' }
    ],
    sorts: [
      { id: 'rating', name: 'Rating' },
      { id: 'reviews', name: 'Reviews' },
      { id: 'distance', name: 'Distance' },
      { id: 'name', name: 'Name' }
    ],
    map: [
      { id: 'map', name: 'Map', icon: 'fas fa-map-marker-alt' }
    ]
  };
  
  // Deduplicate locations using Set and ensure alphabetical order
  const uniqueLocations = [...new Set(filterData.locations.map(l => l.name))]
    .sort()
    .map(name => filterData.locations.find(l => l.name === name));
  filterData.locations = uniqueLocations;
  
  function renderFilterChips() {
    const visibleChips = [];
    const allChips = [
      { type: 'category', ...filterData.categories.find(c => c.id === filterState.category) },
      { type: 'location', ...filterData.locations.find(l => l.id === filterState.location) },
      { type: 'rating', ...filterData.ratings.find(r => r.id === filterState.rating) },
      { type: 'sort', name: `Sort: ${filterData.sorts.find(s => s.id === filterState.sort).name}` },
      { type: 'map', ...filterData.map[0] }
    ];
    
    // Show first 3 chips on mobile, with overflow handling
    const maxVisible = window.innerWidth > 480 ? 4 : 3;
    visibleChips.push(...allChips.slice(0, maxVisible));
    
    // Add proper ARIA roles for accessibility
    filterChips.setAttribute('role', 'tablist');
    filterChips.setAttribute('aria-label', 'Filter options');
    
    filterChips.innerHTML = visibleChips.map(chip => `
      <button class="filter-chip ${chip.id === filterState[chip.type] ? 'active' : ''}" 
              data-type="${chip.type}" 
              data-value="${chip.id || chip.type}"
              ${chip.count ? `data-count="${chip.count}"` : ''}
              role="tab"
              aria-selected="${chip.id === filterState[chip.type] ? 'true' : 'false'}"
              tabindex="${chip.id === filterState[chip.type] ? '0' : '-1'}">
        ${chip.icon ? `<i class="${chip.icon}"></i> ` : ''}${chip.name}
      </button>
    `).join('');
    
    // Show "+N" button if there are hidden chips
    const hiddenCount = allChips.length - maxVisible;
    if (hiddenCount > 0) {
      moreFiltersBtn.style.display = 'block';
      moreFiltersBtn.querySelector('.more-count').textContent = `+${hiddenCount}`;
    } else {
      moreFiltersBtn.style.display = 'none';
    }
    
    // Add click handlers with keyboard navigation support
    filterChips.querySelectorAll('.filter-chip').forEach((chip, index) => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        if (type === 'map') {
          // Handle map functionality
          handleMapToggle();
        } else if (type !== 'sort') {
          openBottomSheet(type);
        } else {
          openBottomSheet('sort');
        }
      });
      
      // Keyboard navigation
      chip.addEventListener('keydown', (e) => {
        const chips = filterChips.querySelectorAll('.filter-chip');
        let currentIndex = Array.from(chips).indexOf(chip);
        
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            currentIndex = currentIndex > 0 ? currentIndex - 1 : chips.length - 1;
            chips[currentIndex].focus();
            break;
          case 'ArrowRight':
            e.preventDefault();
            currentIndex = currentIndex < chips.length - 1 ? currentIndex + 1 : 0;
            chips[currentIndex].focus();
            break;
          case 'Enter':
          case ' ':
            e.preventDefault();
            chip.click();
            break;
        }
      });
    });
  }
  
  function openBottomSheet(activeSection = null) {
    // Save current scroll position for restoration
    window.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    
    // Populate bottom sheet with current filters
    populateBottomSheetFilters();
    bottomSheet.classList.add('open');
    document.body.style.overflow = 'hidden';
    
    // Focus on active section if specified
    if (activeSection) {
      const section = bottomSheet.querySelector(`#${activeSection}Filters`);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }
  
  function closeBottomSheet() {
    bottomSheet.classList.remove('open');
    document.body.style.overflow = '';
    
    // Restore scroll position if saved
    if (typeof window.savedScrollPosition !== 'undefined') {
      setTimeout(() => {
        window.scrollTo(0, window.savedScrollPosition);
      }, 50);
    }
  }
  
  function handleMapToggle() {
    // Toggle map view functionality
    console.log('Map toggle clicked - implement map view');
    // Could integrate with Google Maps or similar
    
    // For now, show a placeholder notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 100px; left: 50%; transform: translateX(-50%);
      background: #007bff; color: white; padding: 12px 20px;
      border-radius: 8px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    `;
    notification.textContent = 'Map view coming soon!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 2000);
  }
  
  function populateBottomSheetFilters() {
    // Populate category filters
    const categoryFilters = document.getElementById('categoryFilters');
    categoryFilters.innerHTML = filterData.categories.map(cat => `
      <button class="filter-option ${cat.id === filterState.category ? 'active' : ''}" 
              data-type="category" 
              data-value="${cat.id}">
        <i class="${cat.icon}"></i> ${cat.name} (${cat.count})
      </button>
    `).join('');
    
    // Populate location filters
    const locationFilters = document.getElementById('locationFilters');
    locationFilters.innerHTML = filterData.locations.map(loc => `
      <button class="filter-option ${loc.id === filterState.location ? 'active' : ''}" 
              data-type="location" 
              data-value="${loc.id}">
        ${loc.name} ${loc.count ? `(${loc.count})` : ''}
      </button>
    `).join('');
    
    // Populate rating filters
    const ratingFilters = document.getElementById('ratingFilters');
    ratingFilters.innerHTML = filterData.ratings.map(rating => `
      <button class="filter-option ${rating.id === filterState.rating ? 'active' : ''}" 
              data-type="rating" 
              data-value="${rating.id}">
        ${rating.name}
      </button>
    `).join('');
    
    // Populate sort filters
    const sortFilters = document.getElementById('sortFilters');
    sortFilters.innerHTML = filterData.sorts.map(sort => `
      <button class="filter-option ${sort.id === filterState.sort ? 'active' : ''}" 
              data-type="sort" 
              data-value="${sort.id}">
        ${sort.name}
      </button>
    `).join('');
    
    // Add click handlers to all filter options
    bottomSheet.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', () => {
        const type = option.dataset.type;
        const value = option.dataset.value;
        
        // Update active state
        option.parentElement.querySelectorAll('.filter-option').forEach(opt => 
          opt.classList.remove('active'));
        option.classList.add('active');
        
        // Update filter state
        filterState[type] = value;
      });
    });
  }
  
  function applyFilters() {
    // Save current scroll position
    const scrollPosition = window.savedScrollPosition || window.pageYOffset || document.documentElement.scrollTop;
    
    // Update filter chips
    renderFilterChips();
    
    // Apply filters to clinic display (integrate with existing filter logic)
    if (window.filterByCategory) {
      window.filterByCategory(filterState.category);
    }
    if (window.filterByLocation) {
      window.filterByLocation(filterState.location);
    }
    
    // Close bottom sheet
    closeBottomSheet();
    
    // Restore scroll position after a short delay to ensure DOM updates
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
      // Clear saved position
      delete window.savedScrollPosition;
    }, 100);
  }
  
  function clearAllFilters() {
    filterState.category = 'all';
    filterState.location = 'all';
    filterState.rating = 'all';
    filterState.sort = 'rating';
    
    populateBottomSheetFilters();
    renderFilterChips();
  }
  
  // Event listeners
  moreFiltersBtn?.addEventListener('click', () => openBottomSheet());
  closeSheetBtn?.addEventListener('click', closeBottomSheet);
  applyFiltersBtn?.addEventListener('click', applyFilters);
  clearFiltersBtn?.addEventListener('click', clearAllFilters);
  
  // Close bottom sheet when clicking outside
  bottomSheet?.addEventListener('click', (e) => {
    if (e.target === bottomSheet) {
      closeBottomSheet();
    }
  });
  
  // Initial render
  renderFilterChips();
  
  // Handle window resize
  window.addEventListener('resize', () => {
    renderFilterChips();
  });
}