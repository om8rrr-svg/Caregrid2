// Operations API functions

export async function runHealth() {
  const res = await fetch('/api/ops/health', { method: 'GET', cache: 'no-store' });
  return await res.json();
}

export async function runSynthetic() {
  const res = await fetch('/api/ops/synthetic', { method: 'GET', cache: 'no-store' });
  return await res.json();
}

export async function toggleMaintenance(enabled: boolean, message?: string) {
  const res = await fetch('/api/ops/maintenance', {
    method: 'POST',
    body: JSON.stringify({ enabled, message }),
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}

export async function getMaintenanceStatus() {
  const res = await fetch('/api/ops/maintenance', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}

// Alert API functions
export async function getAlerts(filters?: { status?: string; severity?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.severity) params.append('severity', filters.severity);
  
  const url = `/api/ops/alerts${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });
  return await res.json();
}

export async function createAlert(alert: { title: string; description: string; severity: string; tags?: string[] }) {
  const res = await fetch('/api/ops/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}

export async function acknowledgeAlert(alertId: string) {
  const res = await fetch(`/api/ops/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return await res.json();
}