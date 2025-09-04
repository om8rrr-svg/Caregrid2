'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GridItemProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  rowSpan?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  autoRows?: string;
}

export function GridItem({ children, className, colSpan, rowSpan }: GridItemProps) {
  const getColSpanClasses = () => {
    if (!colSpan) return '';
    
    const classes = [];
    if (colSpan.sm) classes.push(`sm:col-span-${colSpan.sm}`);
    if (colSpan.md) classes.push(`md:col-span-${colSpan.md}`);
    if (colSpan.lg) classes.push(`lg:col-span-${colSpan.lg}`);
    if (colSpan.xl) classes.push(`xl:col-span-${colSpan.xl}`);
    
    return classes.join(' ');
  };

  const getRowSpanClasses = () => {
    if (!rowSpan) return '';
    
    const classes = [];
    if (rowSpan.sm) classes.push(`sm:row-span-${rowSpan.sm}`);
    if (rowSpan.md) classes.push(`md:row-span-${rowSpan.md}`);
    if (rowSpan.lg) classes.push(`lg:row-span-${rowSpan.lg}`);
    if (rowSpan.xl) classes.push(`xl:row-span-${rowSpan.xl}`);
    
    return classes.join(' ');
  };

  return (
    <div className={cn(
      'min-h-0', // Prevent grid items from growing beyond their content
      getColSpanClasses(),
      getRowSpanClasses(),
      className
    )}>
      {children}
    </div>
  );
}

export function ResponsiveGrid({ 
  children, 
  className, 
  columns = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 6,
  autoRows = 'auto'
}: ResponsiveGridProps) {
  const getGridClasses = () => {
    const classes = ['grid'];
    
    // Add column classes
    if (columns.sm) classes.push(`grid-cols-${columns.sm}`);
    if (columns.md) classes.push(`md:grid-cols-${columns.md}`);
    if (columns.lg) classes.push(`lg:grid-cols-${columns.lg}`);
    if (columns.xl) classes.push(`xl:grid-cols-${columns.xl}`);
    
    // Add gap class
    classes.push(`gap-${gap}`);
    
    // Add auto-rows class
    if (autoRows !== 'auto') {
      classes.push(`auto-rows-${autoRows}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  );
}

// Predefined layout components for common dashboard patterns
export function DashboardGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      columns={{ sm: 1, md: 2, lg: 3, xl: 4 }}
      gap={6}
      className={cn('w-full', className)}
    >
      {children}
    </ResponsiveGrid>
  );
}

export function MetricsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      columns={{ sm: 1, md: 2, lg: 4, xl: 6 }}
      gap={4}
      className={cn('w-full', className)}
    >
      {children}
    </ResponsiveGrid>
  );
}

export function ChartsGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ResponsiveGrid
      columns={{ sm: 1, md: 1, lg: 2, xl: 2 }}
      gap={6}
      autoRows="min-content"
      className={cn('w-full', className)}
    >
      {children}
    </ResponsiveGrid>
  );
}

// Widget size presets
export const WidgetSizes = {
  small: {
    colSpan: { sm: 1, md: 1, lg: 1, xl: 1 },
    rowSpan: { sm: 1, md: 1, lg: 1, xl: 1 }
  },
  medium: {
    colSpan: { sm: 1, md: 2, lg: 2, xl: 2 },
    rowSpan: { sm: 1, md: 1, lg: 1, xl: 1 }
  },
  large: {
    colSpan: { sm: 1, md: 2, lg: 3, xl: 3 },
    rowSpan: { sm: 1, md: 1, lg: 1, xl: 1 }
  },
  wide: {
    colSpan: { sm: 1, md: 2, lg: 4, xl: 4 },
    rowSpan: { sm: 1, md: 1, lg: 1, xl: 1 }
  },
  tall: {
    colSpan: { sm: 1, md: 1, lg: 1, xl: 1 },
    rowSpan: { sm: 1, md: 2, lg: 2, xl: 2 }
  },
  hero: {
    colSpan: { sm: 1, md: 2, lg: 3, xl: 4 },
    rowSpan: { sm: 1, md: 2, lg: 2, xl: 2 }
  }
};

// Responsive breakpoint utilities
export const Breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// Hook for responsive behavior
export function useResponsive() {
  const [breakpoint, setBreakpoint] = React.useState<string>('xl');
  
  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 640) setBreakpoint('xs');
      else if (width < 768) setBreakpoint('sm');
      else if (width < 1024) setBreakpoint('md');
      else if (width < 1280) setBreakpoint('lg');
      else setBreakpoint('xl');
    };
    
    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);
  
  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl',
    isSmall: breakpoint === 'xs' || breakpoint === 'sm',
    isMedium: breakpoint === 'md' || breakpoint === 'lg',
    isLarge: breakpoint === 'xl'
  };
}

// Auto-layout component that adjusts based on content
export function AutoGrid({ 
  children, 
  className,
  minItemWidth = '300px',
  gap = 6 
}: { 
  children: React.ReactNode;
  className?: string;
  minItemWidth?: string;
  gap?: number;
}) {
  return (
    <div 
      className={cn(
        'grid auto-rows-auto',
        `gap-${gap}`,
        className
      )}
      style={{
        gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`
      }}
    >
      {children}
    </div>
  );
}