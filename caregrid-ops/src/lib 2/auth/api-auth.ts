import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, type CustomJWTPayload } from './jwt';
import type { UserRole } from '@/types';

/**
 * Validates JWT token from cookie or Authorization header for API routes
 */
export async function validateApiAuth(request: NextRequest): Promise<{
  valid: boolean;
  payload?: CustomJWTPayload;
  error?: string;
}> {
  try {
    // Get token from cookie or Authorization header
    const cookieToken = request.cookies.get('auth-token')?.value;
    const headerToken = extractTokenFromHeader(request.headers.get('Authorization'));
    const token = cookieToken || headerToken;

    if (!token) {
      return {
        valid: false,
        error: 'No authentication token provided',
      };
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      return {
        valid: false,
        error: 'Invalid or expired token',
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Checks if user has required role for the operation
 */
export function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  return requiredRoles.includes(userRole);
}

/**
 * Middleware function to protect API routes with role-based access control
 */
export async function withRoleAuth(
  request: NextRequest,
  requiredRoles: UserRole[]
): Promise<{
  authorized: boolean;
  response?: NextResponse;
  user?: CustomJWTPayload;
}> {
  // Validate authentication
  const authResult = await validateApiAuth(request);
  
  if (!authResult.valid || !authResult.payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: authResult.error || 'Authentication failed',
        },
        { status: 401 }
      ),
    };
  }

  // Check role authorization
  if (!hasRequiredRole(authResult.payload.role, requiredRoles)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${authResult.payload.role}`,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: authResult.payload,
  };
}

/**
 * Higher-order function to create role-protected API route handlers
 */
export function createProtectedRoute(
  requiredRoles: UserRole[],
  handler: (request: NextRequest, user: CustomJWTPayload) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await withRoleAuth(request, requiredRoles);
    
    if (!authResult.authorized || !authResult.user) {
      return authResult.response!;
    }

    try {
      return await handler(request, authResult.user);
    } catch (error) {
      console.error('Protected route error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
        },
        { status: 500 }
      );
    }
  };
}