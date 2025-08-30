// /js/auth.js
import { fetchJson, getToken } from './api-base.js';

const UI = {
  progress: () => document.getElementById('authProgress'),
  error: () => document.getElementById('authError'),
  form: () => document.getElementById('signinForm')
};

async function validateAndMaybeRedirect() {
  const t = getToken();
  if (!t) return; // no token in storage

  try {
    await fetchJson('/api/auth/me', { headers: { Authorization: `Bearer ${t}` }, timeoutMs: 15000 });
    window.location.href = '/dashboard.html';
  } catch {
    localStorage.removeItem('caregrid_token');
    sessionStorage.removeItem('caregrid_token');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (UI.progress()) UI.progress().style.display = 'none';
  if (UI.error()) UI.error().style.display = 'none';

  validateAndMaybeRedirect();

  const form = UI.form();
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (UI.error()) { UI.error().style.display = 'none'; UI.error().textContent = ''; }
    if (UI.progress()) UI.progress().style.display = 'block';

    const email = form.querySelector('input[name="email"]')?.value?.trim();
    const password = form.querySelector('input[name="password"]')?.value;

    try {
      const rsp = await fetchJson('/api/auth/login', { method: 'POST', body: { email, password } });
      const token = rsp.token || rsp.accessToken;
      if (!token) throw new Error('missing_token');
      localStorage.setItem('caregrid_token', token);
      
      // Show success modal for existing users
      const successModal = document.getElementById('successModal');
      const successTitle = document.getElementById('successTitle');
      const successMessage = document.getElementById('successMessage');
      
      if (successModal && successTitle && successMessage) {
        successTitle.textContent = 'Welcome Back!';
        successMessage.textContent = 'You have successfully signed in to your CareGrid account.';
        
        if (UI.progress()) UI.progress().style.display = 'none';
        
        // Show the success modal
        successModal.classList.remove('hidden');
        successModal.style.display = 'flex';
        
        // Auto-redirect after 3 seconds or when user clicks continue
        const redirectTimer = setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 3000);
        
        // If user clicks continue, clear timer and redirect immediately
        const continueBtn = successModal.querySelector('.auth-btn');
        if (continueBtn) {
          continueBtn.onclick = () => {
            clearTimeout(redirectTimer);
            window.location.href = '/dashboard.html';
          };
        }
      } else {
        // Fallback: direct redirect if modal not found
        window.location.href = '/dashboard.html';
      }
    } catch (err) {
      if (UI.progress()) UI.progress().style.display = 'none';
      if (UI.error()) {
        UI.error().textContent = 'Login failed. Please check your details and try again.';
        UI.error().style.display = 'block';
      }
    }
  });
});