import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';

// Test endpoint to simulate data completeness issues
export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const simulate = searchParams.get('simulate');
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
      
      // Test the actual clinic data completeness
      const response = await fetch(`${API_BASE}/api/clinics`);
      
      if (!response.ok) {
        return NextResponse.json({
          status: 'error',
          message: `API returned ${response.status}`,
          issue: 'api_unavailable',
        });
      }
      
      const data = await response.json();
      const clinics = data.clinics || data.data || data || [];
      const clinicCount = Array.isArray(clinics) ? clinics.length : 0;
      
      // Simulate different scenarios for testing
      if (simulate === 'incomplete') {
        return NextResponse.json({
          status: 'incomplete',
          message: `Only ${Math.min(clinicCount, 3)} clinics returned, expected at least 10`,
          clinicCount: Math.min(clinicCount, 3),
          expectedMinimum: 10,
          issue: 'data_incomplete',
          recommendation: 'Check API connectivity and database health',
        });
      }
      
      if (simulate === 'empty') {
        return NextResponse.json({
          status: 'critical',
          message: 'No clinics returned from API',
          clinicCount: 0,
          expectedMinimum: 10,
          issue: 'no_data',
          recommendation: 'Check database connection and API endpoint',
        });
      }
      
      // Real data completeness check
      const status = clinicCount >= 10 ? 'healthy' : 'incomplete';
      const severity = clinicCount === 0 ? 'critical' : clinicCount < 5 ? 'high' : 'medium';
      
      return NextResponse.json({
        status,
        severity: clinicCount >= 10 ? 'none' : severity,
        message: clinicCount >= 10 
          ? `Data completeness check passed: ${clinicCount} clinics found`
          : `Data completeness issue: only ${clinicCount} clinics returned, expected at least 10`,
        clinicCount,
        expectedMinimum: 10,
        issue: clinicCount >= 10 ? 'none' : 'data_incomplete',
        recommendation: clinicCount >= 10 
          ? 'System is healthy'
          : 'Check API connectivity, database health, and network connectivity',
        testScenarios: {
          simulate_incomplete: '/api/test/data-completeness?simulate=incomplete',
          simulate_empty: '/api/test/data-completeness?simulate=empty',
          real_check: '/api/test/data-completeness',
        },
      });
    } catch (error) {
      console.error('Data completeness test failed:', error);
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to test data completeness',
          error: error instanceof Error ? error.message : 'Unknown error',
          issue: 'test_failed',
        },
        { status: 500 }
      );
    }
  }
);

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