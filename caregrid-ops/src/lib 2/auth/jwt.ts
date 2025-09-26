import { SignJWT, jwtVerify, type JWTPayload as JoseJWTPayload } from 'jose';
import type { User, UserRole } from '@/types';

// JWT secret key (in production, this should be from environment variables)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-here-change-in-production'
);

// JWT configuration
const JWT_CONFIG = {
  issuer: 'caregrid-ops',
  audience: 'caregrid-ops-users',
  expiresIn: '7d', // 7 days
  algorithm: 'HS256' as const,
};

// Custom JWT Payload interface
export interface CustomJWTPayload extends JoseJWTPayload {
  sub: string; // user ID
  email: string;
  name: string;
  role: UserRole;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (7 * 24 * 60 * 60); // 7 days from now

    const token = await new SignJWT({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    })
      .setProtectedHeader({ alg: JWT_CONFIG.algorithm })
      .setIssuedAt(now)
      .setExpirationTime(exp)
      .setIssuer(JWT_CONFIG.issuer)
      .setAudience(JWT_CONFIG.audience)
      .sign(JWT_SECRET);

    return token;
  } catch (error) {
    console.error('Error generating JWT token:', error);
    throw new Error('Failed to generate authentication token');
  }
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });

    return payload as CustomJWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(payload: CustomJWTPayload): boolean {
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

/**
 * Get user info from JWT payload
 */
export function getUserFromPayload(payload: CustomJWTPayload): User {
  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    createdAt: new Date(), // Set current date as fallback
  };
}

/**
 * Mock function to simulate user authentication
 * In a real application, this would validate against a database
 */
export async function authenticateUser(email: string, password: string): Promise<User | null> {
  // Demo users for testing
  const demoUsers: Record<string, { password: string; user: User }> = {
    'admin@caregrid.com': {
      password: 'admin123',
      user: {
          id: '1',
          email: 'admin@caregrid.com',
          name: 'Admin User',
          role: 'admin',
          createdAt: new Date('2024-01-01'),
        },
    },
    'manager@caregrid.com': {
      password: 'manager123',
      user: {
          id: '2',
          email: 'manager@caregrid.com',
          name: 'Manager User',
          role: 'manager',
          createdAt: new Date('2024-01-01'),
        },
    },
    'viewer@caregrid.com': {
      password: 'viewer123',
      user: {
          id: '3',
          email: 'viewer@caregrid.com',
          name: 'Viewer User',
          role: 'viewer',
          createdAt: new Date('2024-01-01'),
        },
    },
  };

  const userRecord = demoUsers[email.toLowerCase()];
  if (!userRecord || userRecord.password !== password) {
    return null;
  }

  return userRecord.user;
}

/**
 * Refresh token functionality
 * In a real application, this would use refresh tokens
 */
export async function refreshAuthToken(currentToken: string): Promise<{
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
}> {
  try {
    const payload = await verifyToken(currentToken);
    if (!payload) {
      return {
        success: false,
        error: 'Invalid token',
      };
    }

    // Check if token is close to expiry (within 1 day)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - now;
    const oneDayInSeconds = 24 * 60 * 60;

    const user = getUserFromPayload(payload);
    let newToken: string;

    if (timeUntilExpiry > oneDayInSeconds) {
      // Token is still valid for more than a day, no need to refresh
      newToken = currentToken;
    } else {
      // Generate new token with same user data
      newToken = await generateToken(user);
    }

    return {
      success: true,
      token: newToken,
      refreshToken: newToken, // In a real app, this would be a separate refresh token
      user,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return {
      success: false,
      error: 'Token refresh failed',
    };
  }
}