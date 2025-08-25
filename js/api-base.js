// Centralized API Base Configuration for CareGrid
// This ensures all API calls use the correct base URL and never relative URLs

const API_BASE =
  window.__API_BASE__ ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE)) ||
  'https://caregrid-backend.onrender.com';

function buildUrl(path, params = {}) {
  const url = new URL(path.replace(/^\//, ''), API_BASE.endsWith('/') ? API_BASE : API_BASE + '/');
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  return url.toString();
}

// Set global window variables for access from other scripts
if (typeof window !== 'undefined') {
  window.__API_BASE__ = API_BASE;
  window.buildUrl = buildUrl;
}