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
});