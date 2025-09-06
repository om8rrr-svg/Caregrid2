import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { Alert } from '@/types';

// Mock alerts storage (shared with main route)
let alerts: Alert[] = [
  {
    id: '1',
    title: 'High CPU Usage',
    description: 'CPU usage exceeded 90% threshold',
    severity: 'high',
    status: 'open',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    tags: ['cpu', 'performance'],
  },
  {
    id: '2',
    title: 'Database Connection Timeout',
    description: 'Database connection timeout detected',
    severity: 'critical',
    status: 'acknowledged',
    createdAt: new Date('2024-01-15T11:00:00Z'),
    assignedTo: 'manager@caregrid.co.uk',
    tags: ['database', 'connectivity'],
  },
];

// PUT /api/ops/alerts/[id] - Update alert routing (Admin only)
export const PUT = createProtectedRoute(
  ['admin'],
  async (request: NextRequest, user) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert ID is required',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { assignedTo, severity, tags } = body;

      // Find existing alert
      const alertIndex = alerts.findIndex(alert => alert.id === id);
      if (alertIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert not found',
          },
          { status: 404 }
        );
      }

      // Update alert routing information
      const existingAlert = alerts[alertIndex];
      const updatedAlert: Alert = {
        ...existingAlert,
        assignedTo: assignedTo !== undefined ? assignedTo : existingAlert.assignedTo,
        severity: severity || existingAlert.severity,
        tags: tags !== undefined ? tags : existingAlert.tags,
      };

      alerts[alertIndex] = updatedAlert;

      console.log(`Alert '${updatedAlert.title}' routing updated by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: updatedAlert,
        message: 'Alert routing updated successfully',
      });
    } catch (error) {
      console.error('Alert routing update error:', error);
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
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}