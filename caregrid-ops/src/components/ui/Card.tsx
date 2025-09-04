import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Card Root Component
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-lg border bg-white text-gray-950',
          {
            'border-gray-200 shadow-sm': variant === 'default',
            'border-gray-300': variant === 'outlined',
            'border-gray-200 shadow-lg': variant === 'elevated',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, icon: Icon, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-between space-y-1.5 p-6 pb-4', className)}
        {...props}
      >
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <Icon className="h-4 w-4 text-blue-600" />
            </div>
          )}
          <div className="space-y-1">
            {children}
          </div>
        </div>
        {action && (
          <div className="flex items-center space-x-2">
            {action}
          </div>
        )}
      </div>
    );
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title Component
interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Component = 'h3', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight text-gray-900', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Description Component
export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-gray-600', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content Component
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

// Card Footer Component
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Stat Card Component (specialized for metrics)
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: LucideIcon;
  className?: string;
  loading?: boolean;
}

export function StatCard({ title, value, change, icon: Icon, className, loading }: StatCardProps) {
  const getChangeColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return '↗';
      case 'decrease':
        return '↘';
      case 'neutral':
        return '→';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              {Icon && <div className="h-5 w-5 bg-gray-200 rounded"></div>}
            </div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          {Icon && <Icon className="h-5 w-5 text-gray-400" />}
        </div>
        <div className="flex items-baseline space-x-3">
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
          {change && (
            <span className={cn('text-sm font-medium', getChangeColor(change.type))}>
              {getChangeIcon(change.type)} {Math.abs(change.value)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Status Card Component (specialized for health status)
interface StatusCardProps {
  title: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  description?: string;
  lastUpdated?: Date;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

export function StatusCard({
  title,
  status,
  description,
  lastUpdated,
  icon: Icon,
  className,
  onClick,
}: StatusCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unhealthy':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'unknown':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'unhealthy':
        return 'bg-red-500';
      case 'unknown':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card 
      className={cn(
        className,
        onClick && 'cursor-pointer hover:shadow-md transition-shadow'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            {Icon && <Icon className="h-5 w-5 text-gray-600" />}
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <div className={cn('h-2 w-2 rounded-full', getStatusDot(status))}></div>
            <span className={cn('px-2 py-1 text-xs font-medium rounded-full border', getStatusColor(status))}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
          </div>
        </div>
        
        {description && (
          <p className="text-sm text-gray-600 mb-2">{description}</p>
        )}
        
        {lastUpdated && (
          <p className="text-xs text-gray-500">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}