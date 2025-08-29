// /js/header.js
function isAuthenticated() {
  return !!(localStorage.getItem('caregrid_token') || sessionStorage.getItem('caregrid_token'));
}

export function renderNavAuth() {
  const container = document.getElementById('navAccount');
  if (!container) return;

  if (isAuthenticated()) {
    container.innerHTML = `
      <a href="/dashboard.html">Dashboard</a>
      <a href="#" id="logoutLink">Logout</a>
    `;
    document.getElementById('logoutLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('caregrid_token');
      sessionStorage.removeItem('caregrid_token');
      window.location.href = '/';
    });
  } else {
    container.innerHTML = `<a href="/auth.html">Sign in</a>`;
  }
}

document.addEventListener('DOMContentLoaded', renderNavAuth);