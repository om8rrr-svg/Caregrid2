// /js/api-base.js
// Centralized API base configuration
export const API_BASE =
  (typeof window !== 'undefined' && window.__API_BASE__) ||
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_BASE || process.env?.API_BASE)) ||
  'https://caregrid-backend.onrender.com';

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
  return localStorage.getItem('caregrid_token') || sessionStorage.getItem('caregrid_token');
}