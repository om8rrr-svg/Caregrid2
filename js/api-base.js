// Centralized API Base Configuration for CareGrid
// This ensures all API calls use the correct base URL and never relative URLs

export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  (typeof process !== 'undefined' && (process.env.NEXT_PUBLIC_API_BASE || process.env.API_BASE)) ||
  'https://caregrid-backend.onrender.com';

export function buildUrl(path, params = {}) {
  const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
  const url = new URL(path.replace(/^\//, ''), base);
  Object.entries(params).forEach(([k, v]) => v != null && url.searchParams.set(k, v));
  return url.toString();
}

export function withTimeout(promise, ms = 15000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))
  ]);
}

// Set global window variables for access from other scripts
if (typeof window !== 'undefined') {
  window.__API_BASE__ = API_BASE;
  window.buildUrl = buildUrl;
  window.withTimeout = withTimeout;
}