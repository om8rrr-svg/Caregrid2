import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { Alert } from '@/types';

// Mock alerts storage (in production, this would be stored in a database)
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

// GET /api/ops/alerts - List alerts (Viewer+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager', 'viewer'],
  async (request: NextRequest) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');

    let filteredAlerts = alerts;

    // Apply filters
    if (status) {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
    });
  }
);

// POST /api/ops/alerts - Create alert (Admin only)
export const POST = createProtectedRoute(
  ['admin'],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { title, description, severity, tags = [] } = body;

      // Validate input
      if (!title || typeof title !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'title field is required and must be a string',
          },
          { status: 400 }
        );
      }

      if (!description || typeof description !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'description field is required and must be a string',
          },
          { status: 400 }
        );
      }

      if (!['critical', 'high', 'medium', 'low'].includes(severity)) {
        return NextResponse.json(
          {
            success: false,
            error: 'severity must be one of: critical, high, medium, low',
          },
          { status: 400 }
        );
      }

      // Create new alert
      const newAlert: Alert = {
        id: Date.now().toString(),
        title,
        description,
        severity,
        status: 'open',
        createdAt: new Date(),
        tags: Array.isArray(tags) ? tags : [],
      };

      alerts.push(newAlert);

      console.log(`Alert '${title}' created by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: newAlert,
        message: 'Alert created successfully',
      }, { status: 201 });
    } catch (error) {
      console.error('Alert creation error:', error);
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