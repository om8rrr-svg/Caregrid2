// /js/dashboard.js
import { fetchJson, getToken } from './api-base.js';

function el(id) { return document.getElementById(id); }

async function guard() {
  // Use apiService for consistent token management
  const t = window.apiService ? window.apiService.getStoredToken() : getToken();
  if (!t) {
    showError('No authentication token found. Please sign in.');
    setTimeout(() => window.location.href = 'auth.html', 2000);
    return Promise.reject(new Error('no_token'));
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
    // Use apiService to remove token consistently
        if (window.apiService) {
            window.apiService.removeToken();
        } else {
            localStorage.removeItem('careGridToken');
            sessionStorage.removeItem('careGridToken');
        }
    
    if (error.message.includes('network_error') || error.message.includes('timeout')) {
      showError('Connection timeout. Please check your internet connection and try again.');
      setTimeout(() => window.location.reload(), 3000);
    } else {
      showError('Invalid authentication. Redirecting to sign in...');
      setTimeout(() => window.location.href = 'auth.html', 2000);
    }
    return Promise.reject(error);
  }
}

function showSkeletons() {
  const stats = el('statsRow');
  if (stats) {
    stats.innerHTML = `
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
      <div class="skeleton stat"></div>
    `;
  }
}

function renderStats(stats) {
  const statsRow = el('statsRow');
  if (!statsRow) return;
  statsRow.innerHTML = `
    <div class="stat-box"><div class="stat-num">${stats.totalBookings ?? 0}</div><div class="stat-label">Total Bookings</div></div>
    <div class="stat-box"><div class="stat-num">${stats.pendingBookings ?? 0}</div><div class="stat-label">Pending</div></div>
    <div class="stat-box"><div class="stat-num">${stats.totalPatients ?? 0}</div><div class="stat-label">Patients</div></div>
    <div class="stat-box"><div class="stat-num">£${(stats.revenue ?? 0).toLocaleString()}</div><div class="stat-label">Revenue</div></div>
  `;
}
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
}



function showUserLoading() {
  const userNameElements = [
    document.getElementById('dashboardUserName'),
    document.getElementById('userName')
  ];
  
  userNameElements.forEach(element => {
    if (element) {
      element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      element.style.opacity = '0.7';
    }
  });
}

function hideUserLoading() {
  const userNameElements = [
    document.getElementById('dashboardUserName'),
    document.getElementById('userName')
  ];
  
  userNameElements.forEach(element => {
    if (element) {
      element.style.opacity = '1';
    }
  });
}

async function loadUserData(token) {
  try {
    showUserLoading();
    
    const response = await fetchJson('/api/auth/me', { 
      headers: { Authorization: `Bearer ${token}` },
      timeoutMs: 15000
    });
    
    if (response && response.user) {
      const user = response.user;
      const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'User';
      
      // Store user data for consistent access
      if (window.apiService) {
        window.apiService.setUserData(user);
      } else {
        localStorage.setItem('careGridCurrentUser', JSON.stringify(user));
      }
      
      // Update all user name displays
      const userNameElements = [
        document.getElementById('dashboardUserName'),
        document.getElementById('userName')
      ];
      
      userNameElements.forEach(element => {
        if (element) {
          element.textContent = userName;
        }
      });
      
      hideUserLoading();
      
      // Dispatch event for header to update
      window.dispatchEvent(new CustomEvent('userDataLoaded', { detail: { user } }));
      
      return user;
    }
  } catch (error) {
    console.warn('Failed to load user data:', error);
    hideUserLoading();
    
    // Fallback to stored user data
    const storedUser = getCurrentUser();
    if (storedUser) {
      const userName = `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim() || storedUser.email || 'User';
      const userNameElements = [
        document.getElementById('dashboardUserName'),
        document.getElementById('userName')
      ];
      
      userNameElements.forEach(element => {
        if (element) {
          element.textContent = userName;
        }
      });
    }
  }
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser') || 'null');
  } catch {
    return null;
  }
}

async function init() {
  showSkeletons();
  
  try {
    const token = await guard(); // redirects if invalid
    
    // Load user data immediately after authentication
    await loadUserData(token);

    try {
      const stats = await fetchJson('/api/admin/stats', { 
        headers: { Authorization: `Bearer ${token}` },
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
  }
}

document.addEventListener('DOMContentLoaded', init);