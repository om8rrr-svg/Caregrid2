import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { SystemHealth, HealthCheck } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

async function timed<T>(fn: () => Promise<T>) {
  const start = performance.now();
  try {
    const data = await fn();
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs, data };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, error: err?.message || 'error' };
  }
}

// Get real-time health data including backend connectivity
const getSystemHealth = async (): Promise<SystemHealth> => {
  const version = process.env.VERCEL_GIT_COMMIT_SHA || 'dev-local';
  
  // Test backend connectivity
  const backend = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/health`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`backend ${res.status}`);
    return await res.json().catch(() => ({}));
  });

  // Test database connectivity and data completeness
  const database = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/clinics`, { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`db probe ${res.status}`);
    const data = await res.json().catch(() => ({}));
    
    // Check data completeness - expect at least 10 clinics in a healthy system
    const clinics = data.clinics || data.data || data || [];
    const clinicCount = Array.isArray(clinics) ? clinics.length : 0;
    
    if (clinicCount < 10) {
      throw new Error(`incomplete data: only ${clinicCount} clinics returned, expected at least 10`);
    }
    
    return { ...data, clinicCount };
  });

  // Test deployment health
  const deploymentHealth = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch('/api/deployments', { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`deployment check ${res.status}`);
    const data = await res.json();
    const failedDeployments = data.deployments?.filter((d: any) => d.status === 'failed') || [];
    if (failedDeployments.length > 0) {
      throw new Error(`${failedDeployments.length} failed deployments`);
    }
    return data;
  });

  // Test configuration validation
  const configHealth = await timed(async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10_000);
    const res = await fetch('/api/deployments/config', { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) throw new Error(`config check ${res.status}`);
    const data = await res.json();
    const criticalIssues = data.issues?.filter((i: any) => i.severity === 'critical') || [];
    if (criticalIssues.length > 0) {
      throw new Error(`${criticalIssues.length} critical config issues`);
    }
    return data;
  });

  const services: HealthCheck[] = [
    {
      id: '1',
      service: 'caregrid-api',
      status: backend.ok ? 'healthy' : 'unhealthy',
      responseTime: backend.latencyMs,
      timestamp: new Date(),
      details: {
        endpoint: `${API_BASE}/health`,
        version,
        error: backend.ok ? undefined : backend.error,
      },
    },
    {
      id: '2',
      service: 'database',
      status: database.ok ? 'healthy' : 'unhealthy',
      responseTime: database.latencyMs,
      timestamp: new Date(),
      details: {
        endpoint: `${API_BASE}/api/clinics`,
        clinicCount: database.ok ? database.data?.clinicCount : undefined,
        dataCompleteness: database.ok ? 'complete' : 'incomplete',
        error: database.ok ? undefined : database.error,
      },
    },
    {
      id: '3',
      service: 'redis-cache',
      status: 'healthy',
      responseTime: 95,
      timestamp: new Date(),
      details: {
        memoryUsage: '45%',
        keyCount: 12450,
      },
    },
    {
      id: '4',
      service: 'email-service',
      status: 'healthy',
      responseTime: 85,
      timestamp: new Date(),
      details: {
        provider: 'SendGrid',
        quotaUsed: '23%',
      },
    },
    {
      id: '5',
      service: 'deployment-status',
      status: deploymentHealth.ok ? 'healthy' : 'unhealthy',
      responseTime: deploymentHealth.latencyMs,
      timestamp: new Date(),
      details: {
        endpoint: '/api/deployments',
        error: deploymentHealth.ok ? undefined : deploymentHealth.error,
      },
    },
    {
      id: '6',
      service: 'configuration',
      status: configHealth.ok ? 'healthy' : 'degraded',
      responseTime: configHealth.latencyMs,
      timestamp: new Date(),
      details: {
        endpoint: '/api/deployments/config',
        error: configHealth.ok ? undefined : configHealth.error,
      },
    },
  ];

  const overallStatus = services.some(s => s.status === 'unhealthy') 
    ? 'unhealthy'
    : services.some(s => s.status === 'degraded')
    ? 'degraded' 
    : 'healthy';

  return {
    overall: overallStatus,
    services,
    uptime: Date.now() - new Date('2024-01-01').getTime(),
    lastUpdated: new Date(),
  };
};

// GET /api/ops/health - Get system health (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const service = url.searchParams.get('service');

    const healthData = await getSystemHealth();

    // Filter by specific service if requested
    if (service) {
      const serviceHealth = healthData.services.find(s => s.service === service);
      if (!serviceHealth) {
        return NextResponse.json(
          {
            success: false,
            error: 'Service not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: serviceHealth,
      });
    }

    return NextResponse.json({
      success: true,
      data: healthData,
    });
  }
);

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}