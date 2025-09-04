'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { apiClient } from '@/lib/api/client';
import { getFromStorage, removeFromStorage } from '@/lib/utils';
import { API_CONFIG } from '@/lib/api/config';
import type { User, AuthState, UserRole } from '@/types';

// Auth Actions
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_TOKEN'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string | null };

// Extended Auth State
interface ExtendedAuthState extends AuthState {
  error: string | null;
}

// Auth Context Type
interface AuthContextType {
  state: ExtendedAuthState;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  clearError: () => void;
}

// Initial State
const initialState: ExtendedAuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth Reducer
function authReducer(state: ExtendedAuthState, action: AuthAction): ExtendedAuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'SET_TOKEN':
      return {
        ...state,
        token: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Initialize authentication state
  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const token = getFromStorage(API_CONFIG.TOKEN_STORAGE_KEY, null);
      
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      dispatch({ type: 'SET_TOKEN', payload: token });
      
      // Set cookie for middleware
      setAuthCookie(token);
      
      // Verify token and get user data
      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data });
      } else {
        // Token is invalid, clear it
        removeFromStorage(API_CONFIG.TOKEN_STORAGE_KEY);
        removeFromStorage(API_CONFIG.REFRESH_TOKEN_STORAGE_KEY);
        clearAuthCookie();
        dispatch({ type: 'LOGOUT' });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize authentication' });
    }
  };

  // Set auth cookie for middleware
  const setAuthCookie = (token: string) => {
    if (typeof document !== 'undefined') {
      // Set cookie with secure options
      const isSecure = window.location.protocol === 'https:';
      document.cookie = `auth-token=${token}; path=/; ${isSecure ? 'secure; ' : ''}samesite=strict; max-age=${7 * 24 * 60 * 60}`; // 7 days
    }
  };

  // Clear auth cookie
  const clearAuthCookie = () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const response = await apiClient.login(email, password);
      
      if (response.success && response.data) {
        const token = response.data.token;
        dispatch({ type: 'SET_TOKEN', payload: token });
        dispatch({ type: 'SET_USER', payload: response.data.user });
        
        // Set cookie for middleware
        setAuthCookie(token);
        
        return { success: true };
      } else {
        const errorMessage = response.error || 'Login failed';
        dispatch({ type: 'SET_ERROR', payload: errorMessage });
        return { success: false, error: errorMessage };
      }
    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth cookie
      clearAuthCookie();
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await apiClient.getCurrentUser();
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return state.user?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  // Clear error
  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    refreshUser,
    hasRole,
    hasAnyRole,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC for role-based access control
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function AuthenticatedComponent(props: P) {
    const { state, hasAnyRole } = useAuth();
    
    if (state.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }
    
    if (!state.isAuthenticated) {
      // Redirect to login or show unauthorized message
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }
    
    if (requiredRoles && !hasAnyRole(requiredRoles)) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
    
    return <Component {...props} />;
  };
}

// Role-based component wrapper
interface RoleGuardProps {
  children: ReactNode;
  roles: UserRole[];
  fallback?: ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { hasAnyRole } = useAuth();
  
  if (!hasAnyRole(roles)) {
    return fallback || (
      <div className="text-center py-8">
        <p className="text-gray-600">You don't have permission to view this content.</p>
      </div>
    );
  }
  
  return <>{children}</>;
}