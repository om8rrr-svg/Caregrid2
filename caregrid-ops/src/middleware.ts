import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, type CustomJWTPayload } from '@/lib/auth/jwt';

// Define protected routes and their required roles
const PROTECTED_ROUTES = {
  '/dashboard': ['admin', 'manager', 'viewer'],
  '/alerts': ['admin', 'manager', 'viewer'],
  '/incidents': ['admin', 'manager'],
  '/metrics': ['admin', 'manager'],
  '/feature-flags': ['admin', 'manager'],
  '/settings': ['admin'],
} as const;

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/auth/login', '/'];

function hasRequiredRole(userRole: string, requiredRoles: readonly string[]): boolean {
  return requiredRoles.includes(userRole);
}

function isProtectedRoute(pathname: string): string[] | null {
  // Check exact matches first
  if (pathname in PROTECTED_ROUTES) {
    const roles = PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES];
    return [...roles]; // Convert readonly array to mutable array
  }
  
  // Check for nested routes
  for (const [route, roles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route + '/')) {
      return [...roles]; // Convert readonly array to mutable array
    }
  }
  
  return null;
}

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Static files (images, fonts, etc.)
  ) {
    return NextResponse.next();
  }

  // Get token from cookies or Authorization header
  const token = request.cookies.get('auth-token')?.value ||
    request.headers.get('Authorization')?.replace('Bearer ', '');

  // Check if route is public
  if (isPublicRoute(pathname)) {
    // If user is already authenticated and trying to access login, redirect to dashboard
    if (pathname === '/auth/login' && token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Check if route is protected
  const requiredRoles = isProtectedRoute(pathname);
  if (requiredRoles) {
    // No token provided
    if (!token) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify token
    const payload = await verifyToken(token);
    if (!payload) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }

    // Check if user has required role
    if (!hasRequiredRole(payload.role, requiredRoles)) {
      // Insufficient permissions, redirect to dashboard with error
      const dashboardUrl = new URL('/dashboard', request.url);
      dashboardUrl.searchParams.set('error', 'insufficient_permissions');
      return NextResponse.redirect(dashboardUrl);
    }

    // Add user info to headers for the page to use
    const response = NextResponse.next();
    response.headers.set('x-user-id', payload.sub);
    response.headers.set('x-user-email', payload.email);
    response.headers.set('x-user-name', payload.name);
    response.headers.set('x-user-role', payload.role);
    return response;
  }

  // For root path, redirect based on authentication status
  if (pathname === '/') {
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};