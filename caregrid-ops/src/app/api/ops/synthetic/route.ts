import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';

interface StepResult {
  name: string;
  ok: boolean;
  ms: number;
  data?: unknown;
  error?: string;
}

interface SyntheticResult {
  startedAt: string;
  finishedAt?: string;
  steps: StepResult[];
  ok?: boolean;
}

interface SyntheticTest {
  id: string;
  name: string;
  url: string;
  method: string;
  status: 'passing' | 'failing' | 'unknown';
  lastRun: Date;
  responseTime: number;
  uptime: number;
  description: string;
}

async function step(name: string, fn: () => Promise<unknown>): Promise<StepResult> {
  const start = performance.now();
  try {
    const data = await fn();
    return { name, ok: true, ms: Math.round(performance.now() - start), data };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : 'error';
    return { name, ok: false, ms: Math.round(performance.now() - start), error };
  }
}

// Run actual synthetic transaction test
async function runSyntheticTest(request: NextRequest): Promise<SyntheticResult> {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
  const SYN_EMAIL = process.env.SYNTHETIC_USER_EMAIL || '';
  const SYN_PASS = process.env.SYNTHETIC_USER_PASSWORD || '';
  
  const result: SyntheticResult = { startedAt: new Date().toISOString(), steps: [] };
  const headersJson = { 'Content-Type': 'application/json' };

  const login = await step('login', async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: headersJson,
      body: JSON.stringify({ email: SYN_EMAIL, password: SYN_PASS }),
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) throw new Error(`login ${res.status}`);
    const json = await res.json();
    if (!json?.token) throw new Error('no token');
    return { token: json.token };
  });
  result.steps.push(login);
  const token = login.ok && login.data && typeof login.data === 'object' && 'token' in login.data 
    ? (login.data as { token: string }).token 
    : null;

  const list = await step('listClinics', async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 30_000);
    const res = await fetch(`${API_BASE}/api/clinics?limit=1`, {
      headers: { Authorization: token ? `Bearer ${token}` : '' },
      signal: ctrl.signal,
    });
    clearTimeout(to);
    if (!res.ok) throw new Error(`list clinics ${res.status}`);
    const json = await res.json();
    return { count: Array.isArray(json) ? json.length : (json?.data?.length ?? 0) };
  });
  result.steps.push(list);

  result.ok = result.steps.every((s: StepResult) => s.ok);
  result.finishedAt = new Date().toISOString();
  return result;
}

const getSyntheticTests = async (): Promise<SyntheticTest[]> => {
  // TODO: Replace with actual data from monitoring systems in production
  // For now, return empty array to show "no data" state
  
  // In a real implementation, this would:
  // 1. Connect to monitoring service (e.g., Pingdom, New Relic, DataDog)
  // 2. Fetch real synthetic test results
  // 3. Transform the data to match our interface
  
  // Example real implementation:
  // const response = await fetch('https://api.monitoring-service.com/synthetic-tests', {
  //   headers: { 'Authorization': `Bearer ${process.env.MONITORING_API_KEY}` }
  // });
  // return response.json();
  
  return [];
};



// GET /api/ops/synthetic - Get synthetic test results or run live test (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const status = url.searchParams.get('status');
    const testId = url.searchParams.get('id');

    // If action=run, execute live synthetic test
    if (action === 'run') {
      const result = await runSyntheticTest(request);
      return NextResponse.json({
        success: true,
        data: result,
      }, { status: result.ok ? 200 : 500 });
    }

    let syntheticTests = await getSyntheticTests();

    // Filter by specific test if requested
    if (testId) {
      const test = syntheticTests.find(t => t.id === testId);
      if (!test) {
        return NextResponse.json(
          {
            success: false,
            error: 'Synthetic test not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: test,
      });
    }

    // Filter by status if requested
    if (status) {
      syntheticTests = syntheticTests.filter(test => test.status === status);
    }

    // Calculate summary statistics
    const summary = {
      total: syntheticTests.length,
      passing: syntheticTests.filter(t => t.status === 'passing').length,
      failing: syntheticTests.filter(t => t.status === 'failing').length,
      unknown: syntheticTests.filter(t => t.status === 'unknown').length,
      averageResponseTime: Math.round(
        syntheticTests.reduce((sum, t) => sum + t.responseTime, 0) / syntheticTests.length
      ),
      averageUptime: Math.round(
        syntheticTests.reduce((sum, t) => sum + t.uptime, 0) / syntheticTests.length * 100
      ) / 100,
    };

    return NextResponse.json({
      success: true,
      data: {
        tests: syntheticTests,
        summary,
      },
      message: syntheticTests.length === 0 ? 'No synthetic tests configured yet. Connect a monitoring service to see real test data.' : undefined
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