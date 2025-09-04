import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

// Button Variants
const buttonVariants = {
  variant: {
    default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
  },
  size: {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 py-1 text-xs',
    lg: 'h-12 px-6 py-3 text-base',
    xl: 'h-14 px-8 py-4 text-lg',
    icon: 'h-10 w-10 p-0',
  },
};

// Button Props Interface
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants.variant;
  size?: keyof typeof buttonVariants.size;
  loading?: boolean;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  asChild?: boolean;
}

// Button Component
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      icon: Icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Variant styles
          buttonVariants.variant[variant],
          
          // Size styles
          buttonVariants.size[size],
          
          // Full width
          fullWidth && 'w-full',
          
          // Loading state
          loading && 'cursor-not-allowed',
          
          className
        )}
        disabled={isDisabled}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg
            className={cn(
              'animate-spin h-4 w-4',
              children && 'mr-2'
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={cn('h-4 w-4', children && 'mr-2')} />
        )}
        
        {children}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={cn('h-4 w-4', children && 'ml-2')} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export function ButtonGroup({ children, className, orientation = 'horizontal' }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-md',
        '[&>button:last-child]:rounded-r-md',
        orientation === 'vertical' && [
          '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none',
          '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none',
        ],
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'vertical' && '[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Icon Button Component
interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  'aria-label': string;
}

export function IconButton({ icon: Icon, size = 'icon', ...props }: IconButtonProps) {
  return (
    <Button size={size} {...props}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}