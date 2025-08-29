function isAuthenticated() {
  return !!(localStorage.getItem('caregrid_token') || sessionStorage.getItem('caregrid_token'));
}

export function renderNavAuth() {
  const navAccount = document.getElementById('navAccount');
  if (!navAccount) return;
  if (isAuthenticated()) {
    navAccount.innerHTML = `
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
    navAccount.innerHTML = `<a href="/auth.html">Sign in</a>`;
  }
}

document.addEventListener('DOMContentLoaded', renderNavAuth);