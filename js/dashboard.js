// /js/dashboard.js
import { fetchJson, getToken } from './api-base.js';

function el(id) { return document.getElementById(id); }

async function guard() {
  const t = getToken();
  if (!t) {
<<<<<<< HEAD
    window.location.href = '/auth.html';
    throw new Error('no_token');
=======
    showError('No authentication token found. Please sign in.');
    setTimeout(() => window.location.href = '/auth.html', 2000);
    return Promise.reject(new Error('no_token'));
>>>>>>> origin/copilot/fix-3adb1fa2-252d-4fed-814b-349a116416db
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetchJson('/api/auth/me', { 
      headers: { Authorization: `Bearer ${t}` },
      timeoutMs: 30000
    });
    
    clearTimeout(timeoutId);
    return t;
  } catch (error) {
    localStorage.removeItem('caregrid_token');
    sessionStorage.removeItem('caregrid_token');
<<<<<<< HEAD
    window.location.href = '/auth.html';
    throw new Error('invalid_token');
=======
    
    if (error.message.includes('network_error') || error.message.includes('timeout')) {
      showError('Connection timeout. Please check your internet connection and try again.');
      setTimeout(() => window.location.reload(), 3000);
    } else {
      showError('Invalid authentication. Redirecting to sign in...');
      setTimeout(() => window.location.href = '/auth.html', 2000);
    }
    return Promise.reject(error);
>>>>>>> origin/copilot/fix-3adb1fa2-252d-4fed-814b-349a116416db
  }
}

function showSkeletons() {
<<<<<<< HEAD
  const stats = el('statsRow');
  if (stats) {
    stats.innerHTML = `
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
=======
  const stats = document.getElementById('statsRow');
  if (stats) {
    stats.innerHTML = `
      <div class="skeleton stat" style="animation: pulse 1.5s ease-in-out infinite;">
        <div style="height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 30px; background: #e0e0e0; border-radius: 4px;"></div>
      </div>
      <div class="skeleton stat" style="animation: pulse 1.5s ease-in-out infinite 0.2s;">
        <div style="height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 30px; background: #e0e0e0; border-radius: 4px;"></div>
      </div>
      <div class="skeleton stat" style="animation: pulse 1.5s ease-in-out infinite 0.4s;">
        <div style="height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 30px; background: #e0e0e0; border-radius: 4px;"></div>
      </div>
      <div class="skeleton stat" style="animation: pulse 1.5s ease-in-out infinite 0.6s;">
        <div style="height: 20px; background: #e0e0e0; border-radius: 4px; margin-bottom: 8px;"></div>
        <div style="height: 30px; background: #e0e0e0; border-radius: 4px;"></div>
      </div>
    `;
    
    // Add pulse animation if not already added
    if (!document.getElementById('pulseAnimation')) {
      const style = document.createElement('style');
      style.id = 'pulseAnimation';
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

function renderStats(stats) {
  const statsRow = document.getElementById('statsRow');
  if (statsRow) {
    statsRow.innerHTML = `
      <div class="stat-card">
        <h3>Total Bookings</h3>
        <p class="stat-number">${stats.totalBookings || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Pending Bookings</h3>
        <p class="stat-number">${stats.pendingBookings || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Total Patients</h3>
        <p class="stat-number">${stats.totalPatients || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Revenue</h3>
        <p class="stat-number">£${stats.revenue || 0}</p>
      </div>
>>>>>>> origin/copilot/fix-3adb1fa2-252d-4fed-814b-349a116416db
    `;
  }
}

<<<<<<< HEAD
function renderStats(s) {
  const stats = el('statsRow');
  if (!stats) return;
  stats.innerHTML = `
    <div class="stat-box"><div class="stat-num">${s.totalBookings ?? 0}</div><div class="stat-label">Total Bookings</div></div>
    <div class="stat-box"><div class="stat-num">${s.pendingBookings ?? 0}</div><div class="stat-label">Pending</div></div>
    <div class="stat-box"><div class="stat-num">${s.totalPatients ?? 0}</div><div class="stat-label">Patients</div></div>
    <div class="stat-box"><div class="stat-num">£${(s.revenue ?? 0).toLocaleString()}</div><div class="stat-label">Revenue</div></div>
  `;
=======
function toast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  const bgColor = type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#333';
  toast.style.cssText = `
    position: fixed; 
    top: 20px; 
    right: 20px; 
    background: ${bgColor}; 
    color: white; 
    padding: 12px 16px; 
    border-radius: 4px; 
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  `;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showError(message) {
  const errorContainer = document.getElementById('errorContainer') || createErrorContainer();
  errorContainer.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      ${message}
    </div>
  `;
  errorContainer.style.display = 'block';
}

function createErrorContainer() {
  const container = document.createElement('div');
  container.id = 'errorContainer';
  container.style.cssText = `
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    background: #dc3545;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10001;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: none;
  `;
  
  container.querySelector = container.querySelector || (() => null);
  document.body.appendChild(container);
  return container;
>>>>>>> origin/copilot/fix-3adb1fa2-252d-4fed-814b-349a116416db
}

function toast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

async function init() {
  showSkeletons();
<<<<<<< HEAD
  const token = await guard(); // redirects if invalid

  try {
    const s = await fetchJson('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 15000 });
    renderStats(s);
  } catch {
    renderStats({ totalBookings: 0, pendingBookings: 0, totalPatients: 0, revenue: 0 });
    toast('Could not load latest stats.');
=======
  
  try {
    const t = await guard(); // redirects if invalid

    try {
      const stats = await fetchJson('/api/admin/stats', { 
        headers: { Authorization: `Bearer ${t}` },
        timeoutMs: 30000 
      });
      renderStats(stats);
    } catch (e) {
      console.warn('Failed to load stats:', e);
      renderStats({ totalBookings: 0, pendingBookings: 0, totalPatients: 0, revenue: 0 });
      
      if (e.message.includes('network_error') || e.message.includes('timeout')) {
        toast('Connection timeout loading stats. Using default values.', 'error');
      } else {
        toast('Could not load stats. Using default values.', 'error');
      }
    }
  } catch (e) {
    // Guard failed, error already handled in guard function
    console.log('Dashboard initialization failed due to auth guard');
>>>>>>> origin/copilot/fix-3adb1fa2-252d-4fed-814b-349a116416db
  }
}

document.addEventListener('DOMContentLoaded', init);