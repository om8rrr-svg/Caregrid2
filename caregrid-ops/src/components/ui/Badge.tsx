import React from 'react';
import { cn } from '@/lib/utils';

// Badge Variants
const badgeVariants = {
  variant: {
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    secondary: 'bg-gray-100 text-gray-900 border-gray-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    outline: 'border border-gray-300 bg-white text-gray-700',
  },
  size: {
    default: 'px-2.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  },
};

// Badge Props Interface
export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants.variant;
  size?: keyof typeof badgeVariants.size;
}

// Badge Component
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          badgeVariants.variant[variant],
          badgeVariants.size[size],
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// Badge Group Component
interface BadgeGroupProps {
  children: React.ReactNode;
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
}

export function BadgeGroup({ children, className, spacing = 'normal' }: BadgeGroupProps) {
  const spacingClasses = {
    tight: 'space-x-1',
    normal: 'space-x-2',
    loose: 'space-x-3',
  };

  return (
    <div className={cn('flex flex-wrap items-center', spacingClasses[spacing], className)}>
      {children}
    </div>
  );
}

// Status Badge Component
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'pending' | 'error' | 'success' | 'warning';
}

export function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  const statusVariants = {
    online: 'success',
    offline: 'destructive',
    pending: 'warning',
    error: 'destructive',
    success: 'success',
    warning: 'warning',
  } as const;

  return (
    <Badge
      variant={statusVariants[status]}
      className={cn('capitalize', className)}
      {...props}
    >
      {status}
    </Badge>
  );
}