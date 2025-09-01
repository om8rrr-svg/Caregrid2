// /js/header.js
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

export function renderNavAuth() {
  const authNavItem = document.getElementById('authNavItem');
  const userNavItem = document.getElementById('userNavItem');
  const userMenuContainer = document.getElementById('userMenuContainer');
  const signInContainer = document.getElementById('signInContainer');
  
  // Fallback to navAccount if the main nav items don't exist
  const navAccount = document.getElementById('navAccount');
  
  if (isAuthenticated()) {
    const currentUser = getCurrentUser();
    let userName = 'Loading...';
    
    // If user data is available, use it; otherwise show loading
    if (currentUser && currentUser.firstName) {
      userName = currentUser.firstName;
    } else if (window.apiService) {
      // Try to get user data from apiService
      const userData = window.apiService.getUserData();
      if (userData && userData.firstName) {
        userName = userData.firstName;
      }
    }
    
    if (userMenuContainer && signInContainer) {
      // Use the new Bootstrap dropdown structure
      userMenuContainer.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-outline-primary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-user me-2"></i>${userName}
          </button>
          <ul class="dropdown-menu" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="dashboard.html"><i class="fas fa-tachometer-alt me-2"></i>Dashboard</a></li>
            <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user-edit me-2"></i>Profile</a></li>
            <li><a class="dropdown-item" href="booking.html"><i class="fas fa-calendar-plus me-2"></i>Book Appointment</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()"><i class="fas fa-sign-out-alt me-2"></i>Logout</a></li>
          </ul>
        </div>
      `;
      
      userMenuContainer.style.display = 'block';
      signInContainer.style.display = 'none';
    } else if (authNavItem && userNavItem) {
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
    if (userMenuContainer && signInContainer) {
      userMenuContainer.style.display = 'none';
      signInContainer.style.display = 'block';
    } else if (authNavItem && userNavItem) {
      authNavItem.style.display = 'block';
      userNavItem.style.display = 'none';
    } else if (navAccount) {
      navAccount.innerHTML = `<a href="/auth.html">Sign in</a>`;
    }
  }
}

function logout() {
  // Clear all possible token storage locations
  // Use apiService to remove token consistently
    if (window.apiService) {
        window.apiService.removeToken();
    } else {
        localStorage.removeItem('careGridToken');
        sessionStorage.removeItem('careGridToken');
    }
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

// Listen for user data updates
window.addEventListener('userDataLoaded', function(event) {
  renderNavAuth();
});

// Initial render
document.addEventListener('DOMContentLoaded', renderNavAuth);