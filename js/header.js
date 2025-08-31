// /js/header.js
function isAuthenticated() {
  return !!(localStorage.getItem('caregrid_token') || sessionStorage.getItem('caregrid_token') ||
           localStorage.getItem('careGridToken') || sessionStorage.getItem('careGridToken'));
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('careGridCurrentUser') || sessionStorage.getItem('careGridCurrentUser') || 'null');
  } catch {
    return null;
  }
}

export function renderNavAuth() {
  const authNavItem = document.getElementById('authNavItem');
  const userNavItem = document.getElementById('userNavItem');
  
  // Fallback to navAccount if the main nav items don't exist
  const navAccount = document.getElementById('navAccount');
  
  if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    const userName = currentUser ? 
      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'User' : 'User';
    
    if (authNavItem && userNavItem) {
      // Use the existing nav structure
      authNavItem.style.display = 'none';
      userNavItem.style.display = 'block';
      
      // Update user menu content
      const userMenu = userNavItem.querySelector('.user-menu');
      if (userMenu) {
        userMenu.innerHTML = `
          <div class="user-avatar" onclick="toggleUserMenu()" aria-expanded="false" aria-controls="userDropdown" role="button" tabindex="0">
            <img src="images/default-avatar.svg" alt="User Avatar" id="userAvatar">
            <span class="user-name" id="userName">${userName}</span>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="user-dropdown" id="userDropdown">
            <a href="dashboard.html" class="dropdown-item">
              <i class="fas fa-tachometer-alt"></i>
              Dashboard
            </a>
            <a href="#" class="dropdown-item" id="logoutLink">
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
    } else if (navAccount) {
      // Fallback for pages without the main nav structure
      navAccount.innerHTML = `
        <a href="/dashboard.html">Dashboard</a>
        <a href="#" id="logoutLink">Logout</a>
      `;
      document.getElementById('logoutLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }
  } else {
    if (authNavItem && userNavItem) {
      authNavItem.style.display = 'block';
      userNavItem.style.display = 'none';
    } else if (navAccount) {
      navAccount.innerHTML = `<a href="/auth.html">Sign in</a>`;
    }
  }
}

function logout() {
  // Clear all possible token storage locations
  localStorage.removeItem('caregrid_token');
  sessionStorage.removeItem('caregrid_token');
  localStorage.removeItem('careGridToken');
  sessionStorage.removeItem('careGridToken');
  localStorage.removeItem('careGridCurrentUser');
  sessionStorage.removeItem('careGridCurrentUser');
  
  // Dispatch auth state change event
  window.dispatchEvent(new CustomEvent('authStateChanged'));
  
  // Redirect to home
  window.location.href = '/';
}

// Make functions globally available
window.renderNavAuth = renderNavAuth;
window.logout = logout;

// Update auth state on auth changes
window.addEventListener('authStateChanged', renderNavAuth);

// Initial render
document.addEventListener('DOMContentLoaded', renderNavAuth);