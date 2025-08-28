// Home page functionality - cities and featured clinics loading
import { fetchJson } from './api-base.js';

async function loadCities() {
  const el = document.getElementById('citiesContainer'); // adjust to your DOM
  if (!el) return;
  
  el.innerHTML = '<div class="muted">Loading…</div>';

  try {
    const rsp = await fetchJson('/api/clinics', { params: { limit: 250 } });
    const items = rsp.data || rsp || [];
    const cities = [...new Set(items.map(c => c.city).filter(Boolean))].sort();

    if (!cities.length) {
      el.innerHTML = `<div class="muted">No cities yet. Try again later.</div>`;
      return;
    }
    el.innerHTML = cities.map(c => `<button class="chip" data-city="${c}">${c}</button>`).join('');
  } catch (e) {
    el.innerHTML = `
      <div class="muted">Couldn't load cities (${e.message}).</div>
      <button class="btn btn-outline" id="retryCities">Try again</button>
    `;
    document.getElementById('retryCities')?.addEventListener('click', loadCities);
  }
}

// Enhanced version that works with the existing location buttons
async function loadCitiesWithFallback() {
  const locations = [
    { key: 'manchester', city: 'Manchester' },
    { key: 'bolton', city: 'Bolton' },
    { key: 'liverpool', city: 'Liverpool' },
    { key: 'leeds', city: 'Leeds' },
    { key: 'glasgow', city: 'Glasgow' },
    { key: 'birmingham', city: 'Birmingham' },
    { key: 'london', city: 'London' }
  ];

  // Update total count for 'All Locations' with timeout
  try {
    const rsp = await fetchJson('/api/clinics', { params: { limit: 1000 } });
    const data = rsp.data || rsp || [];
    const totalCount = data?.length || 0;
    
    const totalCountElement = document.querySelector('[data-location="all"] .clinic-count');
    if (totalCountElement) {
      totalCountElement.textContent = `${totalCount} clinics`;
    }
    
    // Also update mobile dropdown
    const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
    if (mobileAllOption) {
      mobileAllOption.textContent = `All Locations (${totalCount} clinics)`;
    }
  } catch (e) {
    // graceful fallback - show fallback cities and retry option
    const allCountElements = document.querySelectorAll('[data-location="all"] .clinic-count');
    allCountElements.forEach(element => {
      element.innerHTML = `
        <span class="muted">Couldn't load data</span>
        <button class="btn-link retry-btn" onclick="loadCitiesWithFallback()">Retry</button>
      `;
    });
    
    // Set fallback counts for mobile
    const mobileAllOption = document.querySelector('.mobile-location-select option[value="all"]');
    if (mobileAllOption) {
      mobileAllOption.textContent = `All Locations (Data unavailable)`;
    }
  }

  // Update individual location counts with fallback
  for (const location of locations) {
    try {
      const rsp = await fetchJson('/api/clinics', { params: { city: location.city, limit: 1000 } });
      const data = rsp.data || rsp || [];
      const count = data?.length || 0;
      
      const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
      if (countElement) {
        countElement.textContent = `${count} ${count === 1 ? 'clinic' : 'clinics'}`;
      }
      
      // Also update mobile dropdown
      const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
      if (mobileOption) {
        mobileOption.textContent = `${location.city} (${count} ${count === 1 ? 'clinic' : 'clinics'})`;
      }
    } catch (e) {
      // graceful fallback for individual cities
      const countElement = document.querySelector(`[data-location="${location.key}"] .clinic-count`);
      if (countElement) {
        countElement.innerHTML = `
          <span class="muted">Data unavailable</span>
          <button class="btn-link retry-btn" onclick="loadCitiesWithFallback()">Retry</button>
        `;
      }
      
      // Also update mobile dropdown
      const mobileOption = document.querySelector(`.mobile-location-select option[value="${location.key}"]`);
      if (mobileOption) {
        mobileOption.textContent = `${location.city} (Data unavailable)`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadCities();
  loadCitiesWithFallback();
});

// Export for global access
if (typeof window !== 'undefined') {
  window.loadCities = loadCities;
  window.loadCitiesWithFallback = loadCitiesWithFallback;
}