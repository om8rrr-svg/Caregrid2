import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getUserFromPayload, extractTokenFromHeader } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('auth-token')?.value;
    const headerToken = extractTokenFromHeader(request.headers.get('Authorization'));
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'No authentication token provided',
        },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        { status: 401 }
      );
    }

    // Get user from payload
    const user = getUserFromPayload(payload);

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Profile error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}