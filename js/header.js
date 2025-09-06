// Header navigation management
import { buildUrl } from './api-base.js';

function isAuthenticated() {
  const token = localStorage.getItem('careGridToken');
  if (!token) {
    return false;
  }
  // Basic token validation - check if it's not expired
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser') || 'null');
}

async function getSession() {
  try {
    const token = localStorage.getItem('careGridToken');
    
    if (!token) {
      return { authenticated: false, user: null };
    }

    // Validate token
    const response = await fetch(buildUrl('/api/auth/validate'), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        authenticated: true,
        user: data.user || getCurrentUser()
      };
    } else {
      // Token is invalid, clean up
      localStorage.removeItem('careGridToken');
      sessionStorage.removeItem('careGridToken');
      localStorage.removeItem('careGridCurrentUser');
      sessionStorage.removeItem('careGridCurrentUser');
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('Session validation error:', error);
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
      // Get user name from session or fallback to current user data
      let userName = session.user?.firstName || session.user?.name || 'User';
      
      // If user data is available from currentUser, use it as fallback
      if (!userName || userName === 'User') {
        const currentUser = getCurrentUser();
        if (currentUser && currentUser.firstName) {
          const firstName = currentUser.firstName || '';
          const lastName = currentUser.lastName || '';
          userName = `${firstName} ${lastName}`.trim() || firstName;
        } else if (window.apiService) {
          // Try to get user data from apiService
          const userData = window.apiService.getUserData();
          if (userData && userData.firstName) {
            const firstName = userData.firstName || '';
            const lastName = userData.lastName || '';
            userName = `${firstName} ${lastName}`.trim() || firstName;
          }
        }
      }
      
      // Update user name in the existing navigation structure
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = userName;
      }
      
      // Show user menu, hide sign in
      authNavItem.style.display = 'none';
      userNavItem.style.display = 'block';
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
  
  // Dispatch auth state change event
  window.dispatchEvent(new CustomEvent('authStateChanged'));
  
  // Redirect to home page
  window.location.href = 'index.html';
}

function toggleUserMenu() {
  const userDropdown = document.getElementById('userDropdown');
  const userAvatar = document.querySelector('.user-avatar');
  
  if (userDropdown && userAvatar) {
    const isExpanded = userAvatar.getAttribute('aria-expanded') === 'true';
    
    if (isExpanded) {
      userDropdown.style.display = 'none';
      userAvatar.setAttribute('aria-expanded', 'false');
    } else {
      userDropdown.style.display = 'block';
      userAvatar.setAttribute('aria-expanded', 'true');
    }
  }
}

// Export functions to window for global access
window.renderNavAuth = renderNavAuth;
window.logout = logout;
window.getSession = getSession;
window.toggleUserMenu = toggleUserMenu;

// Listen for auth state changes
window.addEventListener('authStateChanged', renderNavAuth);

// Listen for user data updates
window.addEventListener('userDataLoaded', function(event) {
  renderNavAuth();
});

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', renderNavAuth);