// Home page functionality - cities and featured clinics loading
import { buildUrl, withTimeout } from './api-base.js';

async function loadCities() {
  const container = document.getElementById('citiesContainer'); // adjust selector
  try {
    const res = await withTimeout(fetch(buildUrl('/api/clinics', { limit: 200 })), 15000);
    if (!res.ok) throw new Error('bad status ' + res.status);
    const { data } = await res.json();

    // compute unique cities
    const cities = [...new Set((data || []).map(c => c.city).filter(Boolean))].sort();

    container.innerHTML = cities.map(c =>
      `<button class="chip" data-city="${c}">${c}</button>`
    ).join('');
  } catch (e) {
    // graceful fallback
    container.innerHTML = `
      <div class="muted">Couldn't load cities right now.</div>
      <div class="chip-row">
        <button class="chip" data-city="Manchester">Manchester</button>
        <button class="chip" data-city="London">London</button>
        <button class="chip" data-city="Liverpool">Liverpool</button>
      </div>
      <button class="btn btn-outline" id="retryCities">Try again</button>
    `;
    const retry = document.getElementById('retryCities');
    if (retry) retry.addEventListener('click', loadCities);
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
    const res = await withTimeout(fetch(buildUrl('/api/clinics', { limit: 1000 })), 15000);
    if (!res.ok) throw new Error('bad status ' + res.status);
    const { data } = await res.json();
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
      const res = await withTimeout(fetch(buildUrl('/api/clinics', { city: location.city, limit: 1000 })), 15000);
      if (!res.ok) throw new Error('bad status ' + res.status);
      const { data } = await res.json();
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', loadCitiesWithFallback);

// Export for global access
if (typeof window !== 'undefined') {
  window.loadCities = loadCities;
  window.loadCitiesWithFallback = loadCitiesWithFallback;
}