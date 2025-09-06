import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';

// Mock maintenance state (in production, this would be stored in a database)
let maintenanceMode = {
  enabled: false,
  message: '',
  scheduledStart: null as string | null,
  scheduledEnd: null as string | null,
  lastUpdatedBy: '',
  lastUpdatedAt: new Date().toISOString(),
};

// GET /api/ops/maintenance - Get maintenance status (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager', 'viewer'],
  async (request: NextRequest) => {
    return NextResponse.json({
      success: true,
      data: maintenanceMode,
    });
  }
);

// POST /api/ops/maintenance - Toggle maintenance mode (Admin only)
export const POST = createProtectedRoute(
  ['admin'],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { enabled, message, scheduledStart, scheduledEnd } = body;

      // Validate input
      if (typeof enabled !== 'boolean') {
        return NextResponse.json(
          {
            success: false,
            error: 'enabled field must be a boolean',
          },
          { status: 400 }
        );
      }

      // Update maintenance mode
      maintenanceMode = {
        enabled,
        message: message || '',
        scheduledStart: scheduledStart || null,
        scheduledEnd: scheduledEnd || null,
        lastUpdatedBy: user.email,
        lastUpdatedAt: new Date().toISOString(),
      };

      console.log(`Maintenance mode ${enabled ? 'enabled' : 'disabled'} by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: maintenanceMode,
        message: `Maintenance mode ${enabled ? 'enabled' : 'disabled'} successfully`,
      });
    } catch (error) {
      console.error('Maintenance toggle error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }
  }
);

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}