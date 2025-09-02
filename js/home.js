// /js/home.js
import { fetchJson } from './api-base.js';

function el(id) { return document.getElementById(id); }

async function loadCities() {
  const container = el('citiesContainer'); // UL/div where you show city chips or list
  if (!container) return;
  container.innerHTML = '<div class="muted">Loading…</div>';

  try {
    const rsp = await fetchJson('/api/clinics', { params: { limit: 500 } });
    const clinics = rsp?.data || rsp || [];
    
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
    const rsp = await fetchJson('/api/clinics', { params: { city, limit: 100 } });
    const items = rsp?.data || rsp || [];
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

function renderClinicCard(c, isDemo = false) {
  const name = c.name || 'Clinic';
  const addr = [c.address, c.city, c.postcode].filter(Boolean).join(', ');
  const phone = c.phone || '—';
  const site = c.website ? `<a href="${c.website}" target="_blank" rel="noopener">Website</a>` : '';
  const rating = c.rating ? c.rating.toFixed(1) : '—';
  const reviews = c.reviews || 0;
  const image = c.image || 'images/clinic-placeholder.svg';
  const description = c.description || 'Healthcare services available';
  
  // Demo badge for fallback cards
  const demoBadge = isDemo ? 
    '<span class="demo-badge" style="background: #ff9500; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; position: absolute; top: 8px; right: 8px; z-index: 2;">Demo</span>' : '';
  
  return `
    <div class="clinic-card" style="position: relative;">
      ${demoBadge}
      <div class="clinic-card__image">
        <img src="${image}" alt="${name}" loading="lazy" style="width: 100%; height: 200px; object-fit: cover;">
      </div>
      <div class="clinic-card__head">
        <h3>${name}</h3>
        <span class="badge">${c.type || c.category || 'Healthcare'}</span>
      </div>
      <div class="clinic-card__body">
        <div class="clinic-rating" style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="color: #ffc107; margin-right: 5px;">★</span>
          <span style="font-weight: 600;">${rating}</span>
          <span style="color: #666; margin-left: 5px;">(${reviews} reviews)</span>
        </div>
        <div class="clinic-description" style="color: #666; font-size: 14px; margin-bottom: 8px;">${description}</div>
        <div class="clinic-address" style="color: #888; font-size: 13px;">${addr}</div>
        <div class="clinic-phone" style="color: #888; font-size: 13px;">${phone}</div>
      </div>
      <div class="clinic-card__actions">
        ${site}
        ${c.bookingLink ? `<a href="${c.bookingLink}" target="_blank" rel="noopener" style="min-height: 44px; min-width: 44px; padding: 10px 15px; display: inline-flex; align-items: center; justify-content: center;">Book</a>` : ''}
      </div>
    </div>
  `;
}

function renderSkeletonCards(count = 3) {
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

async function loadFeaturedClinics() {
  const list = el('clinicGrid'); // container where featured clinic cards render
  if (!list) return;
  
  // Check if clinics are already loaded by script.js
  if (list.children.length > 0 && !list.innerHTML.includes('Loading') && !list.innerHTML.includes('skeleton')) {
    return; // Already populated by script.js
  }
  
  // Show skeleton loading state
  list.innerHTML = renderSkeletonCards(3);

  // Define demo clinic data
  const demoClinicData = [
    { 
      name: 'Manchester Private GP', 
      city: 'Manchester', 
      postcode: 'M3 2BB', 
      type: 'GP', 
      website: '#',
      rating: 4.8,
      reviews: 156,
      description: 'Comprehensive private healthcare services in Manchester city centre',
      phone: '0161 234 5678',
      address: '123 Deansgate, Manchester',
      image: 'images/clinic1.svg'
    },
    { 
      name: 'Bolton Smile Dental', 
      city: 'Bolton', 
      postcode: 'BL1 1AA', 
      type: 'Dentist', 
      website: '#',
      rating: 4.9,
      reviews: 89,
      description: 'Modern dental practice offering cosmetic and general dentistry',
      phone: '01204 567 890',
      address: '45 Chorley New Road, Bolton',
      image: 'images/clinic2.svg'
    },
    { 
      name: 'Leeds Physio Hub', 
      city: 'Leeds', 
      postcode: 'LS1 4HT', 
      type: 'Physio', 
      website: '#',
      rating: 4.7,
      reviews: 124,
      description: 'Sports injury rehabilitation and physiotherapy specialists',
      phone: '0113 456 7890',
      address: '78 The Headrow, Leeds',
      image: 'images/clinic3.svg'
    }
  ];

  try {
    const rsp = await fetchJson('/api/clinics', { params: { limit: 100 } });
    const clinics = rsp?.data || rsp || [];
    const items = Array.isArray(clinics) ? clinics.slice(0, 3) : []; // Limit to 3 featured
    
    let data, isDemo = false;
    
    if (items.length >= 3) {
      data = items;
    } else {
      // Use demo data if API returns insufficient results
      data = demoClinicData;
      isDemo = true;
      
      // Show demo data badge
      const resultsInfo = el('resultsInfo');
      if (resultsInfo) {
        resultsInfo.innerHTML = '<span class="badge demo-badge" style="background: #ff9500; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">Demo Data</span>Showing demo clinics';
        resultsInfo.style.display = 'block';
      }
    }
    
    renderClinics(data, isDemo);
  } catch (e) {
    // Always use demo data on API failure
    const data = demoClinicData;
    const isDemo = true;
    
    // Show demo data badge with API unavailable message
    const resultsInfo = el('resultsInfo');
    if (resultsInfo) {
      resultsInfo.innerHTML = '<span class="badge demo-badge" style="background: #ff9500; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">Demo Data</span>Showing demo clinics (API unavailable)';
      resultsInfo.style.display = 'block';
    }
    
    renderClinics(data, isDemo);
  }
}

function renderClinics(data, isDemo = false) {
  const list = el('clinicGrid');
  if (!list) return;
  
  if (data.length === 0) {
    list.innerHTML = '<div class="muted">No featured clinics available.</div>';
    return;
  }
  
  list.innerHTML = data.map(clinic => renderClinicCard(clinic, isDemo)).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Clear any placeholder text on init
  document.querySelectorAll('.clinic-count').forEach(el => el.textContent = '—');
  
  loadCities();
  loadFeaturedClinics();
  initMobileFilters();
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
  
  // Filter data - deduplicated using Set
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
      { id: 'manchester', name: 'Manchester', count: '8' },
      { id: 'bolton', name: 'Bolton', count: '4' },
      { id: 'liverpool', name: 'Liverpool', count: '6' },
      { id: 'leeds', name: 'Leeds', count: '5' },
      { id: 'london', name: 'London', count: '2' }
    ],
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
    ]
  };
  
  // Deduplicate locations using Set
  const uniqueLocations = [...new Set(filterData.locations.map(l => l.name))]
    .map(name => filterData.locations.find(l => l.name === name));
  filterData.locations = uniqueLocations;
  
  function renderFilterChips() {
    const visibleChips = [];
    const allChips = [
      { type: 'category', ...filterData.categories.find(c => c.id === filterState.category) },
      { type: 'location', ...filterData.locations.find(l => l.id === filterState.location) },
      { type: 'rating', ...filterData.ratings.find(r => r.id === filterState.rating) },
      { type: 'sort', name: `Sort: ${filterData.sorts.find(s => s.id === filterState.sort).name}` }
    ];
    
    // Show first 3 chips on mobile, with overflow handling
    const maxVisible = window.innerWidth > 480 ? 4 : 3;
    visibleChips.push(...allChips.slice(0, maxVisible));
    
    filterChips.innerHTML = visibleChips.map(chip => `
      <button class="filter-chip ${chip.id === filterState[chip.type] ? 'active' : ''}" 
              data-type="${chip.type}" 
              data-value="${chip.id || chip.type}"
              ${chip.count ? `data-count="${chip.count}"` : ''}>
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
    
    // Add click handlers
    filterChips.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const type = chip.dataset.type;
        if (type !== 'sort') {
          openBottomSheet(type);
        } else {
          openBottomSheet('sort');
        }
      });
    });
  }
  
  function openBottomSheet(activeSection = null) {
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
    // Update filter chips
    renderFilterChips();
    
    // Apply filters to clinic display (integrate with existing filter logic)
    if (window.filterByCategory) {
      window.filterByCategory(filterState.category);
    }
    if (window.filterByLocation) {
      window.filterByLocation(filterState.location);
    }
    
    // Preserve scroll position
    const scrollPosition = window.pageYOffset;
    closeBottomSheet();
    
    // Restore scroll position after a short delay
    setTimeout(() => {
      window.scrollTo(0, scrollPosition);
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