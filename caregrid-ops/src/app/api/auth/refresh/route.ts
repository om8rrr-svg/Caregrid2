import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { refreshAuthToken } from '@/lib/auth/jwt';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = refreshSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const { refreshToken } = validation.data;

    // Refresh the token
    const result = await refreshAuthToken(refreshToken);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Token refresh failed',
        },
        { status: 401 }
      );
    }

    // Create response with new tokens
    const response = NextResponse.json({
      success: true,
      data: {
        token: result.token,
        refreshToken: result.refreshToken,
        user: result.user,
      },
    });

    // Set new auth cookie
    response.cookies.set('auth-token', result.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

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