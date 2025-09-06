import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';

interface RoleRestrictedProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
  disabled?: boolean;
}

/**
 * Component that conditionally renders children based on user role
 * Can also disable elements and show tooltips for insufficient permissions
 */
export function RoleRestricted({
  children,
  requiredRoles,
  fallback,
  showTooltip = true,
  tooltipMessage,
  disabled = false,
}: RoleRestrictedProps) {
  const { hasAnyRole, state } = useAuth();
  
  const hasPermission = hasAnyRole(requiredRoles);
  const defaultTooltipMessage = tooltipMessage || `Requires ${requiredRoles.join(' or ')} role`;

  // If user doesn't have permission and we want to hide the element completely
  if (!hasPermission && !disabled && !fallback) {
    return null;
  }

  // If user doesn't have permission but we want to show a fallback
  if (!hasPermission && fallback) {
    return <>{fallback}</>;
  }

  // If user doesn't have permission but we want to disable the element
  if (!hasPermission && disabled) {
    return (
      <div className="relative inline-block">
        <div 
          className="opacity-50 cursor-not-allowed"
          title={showTooltip ? defaultTooltipMessage : undefined}
        >
          {React.cloneElement(children as React.ReactElement, {
            onClick: undefined,
            onMouseDown: undefined,
            onKeyDown: undefined,
          } as any)}
        </div>
        {showTooltip && (
          <div className="sr-only">{defaultTooltipMessage}</div>
        )}
      </div>
    );
  }

  // User has permission, render normally
  return <>{children}</>;
}

/**
 * Higher-order component for wrapping buttons with role restrictions
 */
interface RoleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requiredRoles: UserRole[];
  children: React.ReactNode;
  showTooltip?: boolean;
  tooltipMessage?: string;
}

export function RoleButton({
  requiredRoles,
  children,
  showTooltip = true,
  tooltipMessage,
  className = '',
  ...buttonProps
}: RoleButtonProps) {
  const { hasAnyRole } = useAuth();
  const hasPermission = hasAnyRole(requiredRoles);
  
  const defaultTooltipMessage = tooltipMessage || `Requires ${requiredRoles.join(' or ')} role`;

  return (
    <button
      {...buttonProps}
      disabled={!hasPermission || buttonProps.disabled}
      title={!hasPermission && showTooltip ? defaultTooltipMessage : buttonProps.title}
      className={`${className} ${!hasPermission ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={hasPermission ? buttonProps.onClick : undefined}
    >
      {children}
    </button>
  );
}

/**
 * Component to show role information for debugging
 */
export function RoleDebugInfo() {
  const { state } = useAuth();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-50">
      <div>Role: {state.user?.role || 'None'}</div>
      <div>User: {state.user?.email || 'Not logged in'}</div>
    </div>
  );
}