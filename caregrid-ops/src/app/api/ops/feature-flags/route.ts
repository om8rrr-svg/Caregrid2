import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';
import type { FeatureFlag } from '@/types';

// Mock feature flags storage (in production, this would be stored in a database)
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

// GET /api/ops/feature-flags - List feature flags (Manager+ can read)
export const GET = createProtectedRoute(
  ['admin', 'manager', 'viewer'],
  async (request: NextRequest) => {
    return NextResponse.json({
      success: true,
      data: featureFlags,
    });
  }
);

// POST /api/ops/feature-flags - Create feature flag (Admin only)
export const POST = createProtectedRoute(
  ['admin'],
  async (request: NextRequest, user) => {
    try {
      const body = await request.json();
      const { name, description, enabled = false, rolloutPercentage = 0, conditions } = body;

      // Validate input
      if (!name || typeof name !== 'string') {
        return NextResponse.json(
          {
            success: false,
            error: 'name field is required and must be a string',
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

      // Check if feature flag already exists
      if (featureFlags.some(flag => flag.name === name)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Feature flag with this name already exists',
          },
          { status: 409 }
        );
      }

      // Create new feature flag
      const newFlag: FeatureFlag = {
        id: Date.now().toString(),
        name,
        description,
        enabled: Boolean(enabled),
        rolloutPercentage: Number(rolloutPercentage) || 0,
        conditions: conditions || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      featureFlags.push(newFlag);

      console.log(`Feature flag '${name}' created by ${user.email}`);

      return NextResponse.json({
        success: true,
        data: newFlag,
        message: 'Feature flag created successfully',
      }, { status: 201 });
    } catch (error) {
      console.error('Feature flag creation error:', error);
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