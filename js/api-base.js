// /js/api-base.js
// Centralized API base configuration - CLOUD-FIRST MODE

// Import cloud configuration
import { CLOUD_CONFIG, CloudAssets } from './cloud-config.js';

// Get API base from centralized config
let API_BASE;

if (typeof window !== 'undefined' && window.__CONFIG__) {
    // Browser environment with config loaded
    API_BASE = window.__CONFIG__.getApiBase();
} else if (typeof window !== 'undefined' && window.__API_BASE__) {
    // Fallback to legacy global variable
    API_BASE = window.__API_BASE__;
} else {
    // Server-side or fallback - use production URL
    API_BASE = 'https://api.caregrid.co.uk';
}

// Validate no localhost in production
if (typeof window !== 'undefined') {
    const envMeta = document.querySelector('meta[name="environment"]');
    const environment = envMeta ? envMeta.content : 'production';
    
    if (environment === 'production' && API_BASE.includes('localhost')) {
        throw new Error('Production build contains localhost API reference. Check environment configuration.');
    }
}

export { API_BASE };

// Export cloud assets helper for easy access
export { CloudAssets };

export function buildUrl(path, params = {}) {
  const base = API_BASE.endsWith('/') ? API_BASE : API_BASE + '/';
  const url = new URL(path.replace(/^\//, ''), base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  }
  return url.toString();
}

export async function fetchJson(path, { params, method = 'GET', headers = {}, body, timeoutMs = 30000 } = {}) {
  const url = buildUrl(path, params);
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? JSON.stringify(body) : undefined,
      signal: ac.signal
    });
  } catch (err) {
    clearTimeout(t);
    throw new Error(`network_error:${err.message}`);
  }
  clearTimeout(t);

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`http_${res.status}:${text.slice(0, 200)}`);
  }
  return res.headers.get('content-type')?.includes('application/json')
    ? res.json()
    : {};
}

export function getToken() {
    return localStorage.getItem('careGridToken');
}