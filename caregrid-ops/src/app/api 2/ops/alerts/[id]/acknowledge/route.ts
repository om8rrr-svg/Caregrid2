import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { Alert } from '@/types';

// Mock alerts storage (shared with other routes)
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

// POST /api/ops/alerts/[id]/acknowledge - Acknowledge alert (Manager+ can acknowledge)
export const POST = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest, user) => {
    try {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const id = pathParts[pathParts.length - 2]; // Get ID from path before 'acknowledge'
      
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert ID is required',
          },
          { status: 400 }
        );
      }

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

      const existingAlert = alerts[alertIndex];

      // Check if alert is already acknowledged or resolved
      if (existingAlert.status === 'acknowledged') {
        return NextResponse.json(
          {
            success: false,
            error: 'Alert is already acknowledged',
          },
          { status: 409 }
        );
      }

      if (existingAlert.status === 'resolved') {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot acknowledge a resolved alert',
          },
          { status: 409 }
        );
      }

      // Acknowledge the alert
      const updatedAlert: Alert = {
        ...existingAlert,
        status: 'acknowledged',
        assignedTo: user.email,
      };

      alerts[alertIndex] = updatedAlert;

      console.log(`Alert '${updatedAlert.title}' acknowledged by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: updatedAlert,
        message: 'Alert acknowledged successfully',
      });
    } catch (error) {
      console.error('Alert acknowledgment error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}