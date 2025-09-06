import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { FeatureFlag } from '@/types';

// Mock feature flags storage (shared with main route)
// In production, this would be stored in a database
let featureFlags: FeatureFlag[] = [
  {
    id: '1',
    name: 'advanced-monitoring',
    description: 'Enable advanced monitoring features',
    enabled: true,
    rolloutPercentage: 100,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'synthetic-testing',
    description: 'Enable synthetic transaction testing',
    enabled: false,
    rolloutPercentage: 0,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

// PUT /api/ops/feature-flags/[id] - Update feature flag (Admin only)
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
            error: 'Feature flag ID is required',
          },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, description, enabled, rolloutPercentage, conditions } = body;

      // Find existing feature flag
      const flagIndex = featureFlags.findIndex(flag => flag.id === id);
      if (flagIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Feature flag not found',
          },
          { status: 404 }
        );
      }

      // Update feature flag
      const existingFlag = featureFlags[flagIndex];
      const updatedFlag: FeatureFlag = {
        ...existingFlag,
        name: name || existingFlag.name,
        description: description || existingFlag.description,
        enabled: enabled !== undefined ? Boolean(enabled) : existingFlag.enabled,
        rolloutPercentage: rolloutPercentage !== undefined ? Number(rolloutPercentage) : existingFlag.rolloutPercentage,
        conditions: conditions !== undefined ? conditions : existingFlag.conditions,
        updatedAt: new Date(),
      };

      featureFlags[flagIndex] = updatedFlag;

      console.log(`Feature flag '${updatedFlag.name}' updated by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: updatedFlag,
        message: 'Feature flag updated successfully',
      });
    } catch (error) {
      console.error('Feature flag update error:', error);
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

// DELETE /api/ops/feature-flags/[id] - Delete feature flag (Admin only)
export const DELETE = createProtectedRoute(
  ['admin'],
  async (request: NextRequest, user) => {
    try {
      const url = new URL(request.url);
      const id = url.pathname.split('/').pop();
      
      if (!id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Feature flag ID is required',
          },
          { status: 400 }
        );
      }

      // Find and remove feature flag
      const flagIndex = featureFlags.findIndex(flag => flag.id === id);
      if (flagIndex === -1) {
        return NextResponse.json(
          {
            success: false,
            error: 'Feature flag not found',
          },
          { status: 404 }
        );
      }

      const deletedFlag = featureFlags[flagIndex];
      featureFlags.splice(flagIndex, 1);

      console.log(`Feature flag '${deletedFlag.name}' deleted by ${user.email}`);

      return NextResponse.json({
        success: true,
        message: 'Feature flag deleted successfully',
      });
    } catch (error) {
      console.error('Feature flag deletion error:', error);
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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}