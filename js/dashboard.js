// /js/dashboard.js
import { fetchJson, getToken } from './api-base.js';

function el(id) { return document.getElementById(id); }

async function guard() {
  const t = getToken();
  if (!t) {
    window.location.href = '/auth.html';
    throw new Error('no_token');
  }
  try {
    await fetchJson('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
    return t;
  } catch {
    localStorage.removeItem('caregrid_token');
    sessionStorage.removeItem('caregrid_token');
    window.location.href = '/auth.html';
    throw new Error('invalid_token');
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

function renderStats(s) {
  const stats = el('statsRow');
  if (!stats) return;
  stats.innerHTML = `
    <div class="stat-box"><div class="stat-num">${s.totalBookings ?? 0}</div><div class="stat-label">Total Bookings</div></div>
    <div class="stat-box"><div class="stat-num">${s.pendingBookings ?? 0}</div><div class="stat-label">Pending</div></div>
    <div class="stat-box"><div class="stat-num">${s.totalPatients ?? 0}</div><div class="stat-label">Patients</div></div>
    <div class="stat-box"><div class="stat-num">£${(s.revenue ?? 0).toLocaleString()}</div><div class="stat-label">Revenue</div></div>
  `;
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
  const token = await guard(); // redirects if invalid

  try {
    const s = await fetchJson('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }, timeoutMs: 15000 });
    renderStats(s);
  } catch {
    renderStats({ totalBookings: 0, pendingBookings: 0, totalPatients: 0, revenue: 0 });
    toast('Could not load latest stats.');
  }
}

document.addEventListener('DOMContentLoaded', init);