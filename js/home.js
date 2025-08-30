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

function renderClinicCard(c) {
  const name = c.name || 'Clinic';
  const addr = [c.address, c.city, c.postcode].filter(Boolean).join(', ');
  const phone = c.phone || '—';
  const site = c.website ? `<a href="${c.website}" target="_blank" rel="noopener">Website</a>` : '';
  return `
    <div class="clinic-card">
      <div class="clinic-card__head">
        <h3>${name}</h3>
        <span class="badge">${c.type || c.category || 'Healthcare'}</span>
      </div>
      <div class="clinic-card__body">
        <div>${addr}</div>
        <div>${phone}</div>
      </div>
      <div class="clinic-card__actions">
        ${site}
        ${c.bookingLink ? `<a href="${c.bookingLink}" target="_blank" rel="noopener">Book</a>` : ''}
      </div>
    </div>
  `;
}

async function loadFeaturedClinics() {
  const list = el('clinicGrid'); // container where featured clinic cards render
  if (!list) return;
  
  // Check if clinics are already loaded by script.js
  if (list.children.length > 0 && !list.innerHTML.includes('Loading')) {
    return; // Already populated by script.js
  }
  
  list.innerHTML = '<div class="muted">Loading featured clinics…</div>';

  try {
    const rsp = await fetchJson('/api/clinics', { params: { limit: 100 } });
    const clinics = rsp?.data || rsp || [];
    const items = Array.isArray(clinics) ? clinics : [];
    const data = items.length ? items : [
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
        address: '123 Deansgate, Manchester'
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
        address: '45 Chorley New Road, Bolton'
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
        address: '78 The Headrow, Leeds'
      },
      { 
        name: 'Liverpool Eye Care', 
        city: 'Liverpool', 
        postcode: 'L1 8JQ', 
        type: 'Optician', 
        website: '#',
        rating: 4.6,
        reviews: 67,
        description: 'Comprehensive eye care and designer eyewear specialists',
        phone: '0151 789 0123',
        address: '32 Bold Street, Liverpool'
      },
      { 
        name: 'London Wellness Pharmacy', 
        city: 'London', 
        postcode: 'SW1A 1AA', 
        type: 'Pharmacy', 
        website: '#',
        rating: 4.5,
        reviews: 203,
        description: 'Full-service pharmacy with health consultations and wellness products',
        phone: '020 7123 4567',
        address: '15 Harley Street, London'
      }
    ];
    
    // Show demo data badge if using fallback
    if (data.length === 5 && data[0].name === 'Manchester Private GP') {
      const resultsInfo = el('resultsInfo');
      if (resultsInfo) {
        resultsInfo.innerHTML = '<span class="badge demo-badge" style="background: #ff9500; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">Demo Data</span>Showing demo clinics';
        resultsInfo.style.display = 'block';
      }
    }
    
    renderClinics(data);
  } catch (e) {
    const data = [
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
        address: '123 Deansgate, Manchester'
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
        address: '45 Chorley New Road, Bolton'
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
        address: '78 The Headrow, Leeds'
      },
      { 
        name: 'Liverpool Eye Care', 
        city: 'Liverpool', 
        postcode: 'L1 8JQ', 
        type: 'Optician', 
        website: '#',
        rating: 4.6,
        reviews: 67,
        description: 'Comprehensive eye care and designer eyewear specialists',
        phone: '0151 789 0123',
        address: '32 Bold Street, Liverpool'
      },
      { 
        name: 'London Wellness Pharmacy', 
        city: 'London', 
        postcode: 'SW1A 1AA', 
        type: 'Pharmacy', 
        website: '#',
        rating: 4.5,
        reviews: 203,
        description: 'Full-service pharmacy with health consultations and wellness products',
        phone: '020 7123 4567',
        address: '15 Harley Street, London'
      }
    ];
    
    // Show demo data badge
    const resultsInfo = el('resultsInfo');
    if (resultsInfo) {
      resultsInfo.innerHTML = '<span class="badge demo-badge" style="background: #ff9500; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-right: 10px;">Demo Data</span>Showing demo clinics (API unavailable)';
      resultsInfo.style.display = 'block';
    }
    
    renderClinics(data);
  }
}

function renderClinics(data) {
  const list = el('clinicGrid');
  if (!list) return;
  
  if (data.length === 0) {
    list.innerHTML = '<div class="muted">No featured clinics available.</div>';
    return;
  }
  
  list.innerHTML = data.map(renderClinicCard).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  // Clear any placeholder text on init
  document.querySelectorAll('.clinic-count').forEach(el => el.textContent = '—');
  
  loadCities();
  loadFeaturedClinics();
});