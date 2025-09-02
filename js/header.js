// /js/header.js
import { buildUrl } from './api-base.js';

function isAuthenticated() {
  // Use apiService for consistent token management if available
  if (window.apiService) {
    return !!window.apiService.getStoredToken();
  }
  // Fallback to direct storage access
  return !!(localStorage.getItem('careGridToken') || sessionStorage.getItem('careGridToken'));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser') || 'null');
  } catch {
    return null;
  }
}

async function getSession() {
  try {
    const token = localStorage.getItem('careGridToken') || sessionStorage.getItem('careGridToken');
    if (!token) {
      return { authenticated: false, user: null };
    }

    const response = await fetch(buildUrl('/api/auth/me'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const userData = await response.json();
      return { authenticated: true, user: userData };
    } else {
      // Token might be invalid, clear it
      localStorage.removeItem('careGridToken');
      sessionStorage.removeItem('careGridToken');
      localStorage.removeItem('careGridCurrentUser');
      sessionStorage.removeItem('careGridCurrentUser');
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('Session check failed:', error);
    return { authenticated: false, user: null };
  }
}

export async function renderNavAuth() {
  const authNavItem = document.getElementById('authNavItem');
  const userNavItem = document.getElementById('userNavItem');
  
  if (!authNavItem || !userNavItem) {
    console.warn('Navigation elements not found');
    return;
  }

  try {
    const session = await getSession();
    
    if (session.authenticated) {
      // Hide Sign In, show Dashboard and Logout only
      authNavItem.style.display = 'none';
      userNavItem.style.display = 'block';
      
      const userName = session.user?.firstName || session.user?.name || 'User';
      
      // Update user menu content with proper accessibility
      const userMenu = userNavItem.querySelector('.user-menu');
      if (userMenu) {
        userMenu.innerHTML = `
          <div class="user-avatar" onclick="toggleUserMenu()" 
               aria-expanded="false" 
               aria-controls="userDropdown" 
               aria-label="User menu for ${userName}"
               role="button" 
               tabindex="0"
               onkeydown="if(event.key==='Enter'||event.key===' ')toggleUserMenu()">
            <img src="images/default-avatar.svg" alt="User Avatar" id="userAvatar">
            <span class="user-name" id="userName">${userName}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="user-dropdown" id="userDropdown" role="menu">
            <a href="dashboard.html" class="dropdown-item" role="menuitem">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
            <a href="#" class="dropdown-item" id="logoutLink" role="menuitem">
              <i class="fas fa-sign-out-alt"></i>
              Logout
            </a>
          </div>
        `;
        
        // Add logout functionality
        const logoutLink = userMenu.querySelector('#logoutLink');
        if (logoutLink) {
          logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
          });
        }
      }
    } else {
      // Show Sign In only, hide user menu
      authNavItem.style.display = 'block';
      userNavItem.style.display = 'none';
    }
  } catch (error) {
    console.error('Error rendering navigation:', error);
    // Fallback to showing sign in on error
    authNavItem.style.display = 'block';
    userNavItem.style.display = 'none';
  }
}

export function logout() {
  // Clear all possible token storage locations
  localStorage.removeItem('careGridToken');
  sessionStorage.removeItem('careGridToken');
  localStorage.removeItem('careGridCurrentUser');
  sessionStorage.removeItem('careGridCurrentUser');
  
  // Use apiService to clear auth data if available
  if (window.apiService && typeof window.apiService.clearAuthData === 'function') {
    window.apiService.clearAuthData();
  }
  
  // Dispatch auth state change event
  window.dispatchEvent(new CustomEvent('authStateChanged'));
  
  // Update navigation immediately
  setTimeout(() => renderNavAuth(), 50);
  
  // Redirect to home
  window.location.href = '/';
}

// Toggle user menu dropdown
function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  const avatar = document.querySelector('.user-avatar');
  
  if (dropdown && avatar) {
    const isOpen = dropdown.style.display === 'block';
    dropdown.style.display = isOpen ? 'none' : 'block';
    avatar.setAttribute('aria-expanded', !isOpen);
    
    // Close dropdown when clicking outside
    if (!isOpen) {
      const handleClickOutside = (event) => {
        if (!dropdown.contains(event.target) && !avatar.contains(event.target)) {
          dropdown.style.display = 'none';
          avatar.setAttribute('aria-expanded', 'false');
          document.removeEventListener('click', handleClickOutside);
        }
      };
      setTimeout(() => document.addEventListener('click', handleClickOutside), 0);
    }
  }
}

// Make functions globally available
window.renderNavAuth = renderNavAuth;
window.logout = logout;
window.getSession = getSession;
window.toggleUserMenu = toggleUserMenu;

// Update auth state on auth changes
window.addEventListener('authStateChanged', renderNavAuth);

// Listen for user data updates
window.addEventListener('userDataLoaded', function(event) {
  renderNavAuth();
});

// Initial render when DOM is loaded
document.addEventListener('DOMContentLoaded', renderNavAuth);