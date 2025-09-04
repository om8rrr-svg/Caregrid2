'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ChartProps {
  className?: string;
  children: React.ReactNode;
}

export function Chart({ className, children }: ChartProps) {
  return (
    <div className={cn('w-full h-full', className)}>
      {children}
    </div>
  );
}

// Line Chart Component
interface LineChartProps {
  data: Array<{ label: string; value: number }>;
  height?: number;
  color?: string;
  className?: string;
}

export function LineChart({ data, height = 200, color = '#3b82f6', className }: LineChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500', className)} style={{ height }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className={cn('relative', className)} style={{ height }}>
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2"
          points={points}
          vectorEffect="non-scaling-stroke"
        />
        {data.map((point, index) => {
          const x = (index / (data.length - 1)) * 100;
          const y = 100 - ((point.value - minValue) / range) * 100;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill={color}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>
      
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-8">
        <span>{maxValue.toFixed(0)}</span>
        <span>{((maxValue + minValue) / 2).toFixed(0)}</span>
        <span>{minValue.toFixed(0)}</span>
      </div>
      
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500 mt-2">
        {data.map((point, index) => (
          <span key={index} className={index === 0 ? 'text-left' : index === data.length - 1 ? 'text-right' : 'text-center'}>
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// Bar Chart Component
interface BarChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 200, className }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500', className)} style={{ height }}>
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value));

  return (
    <div className={cn('flex items-end justify-between space-x-2', className)} style={{ height }}>
      {data.map((item, index) => {
        const barHeight = (item.value / maxValue) * (height - 40); // Leave space for labels
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="text-xs text-gray-600 mb-1">{item.value}</div>
            <div
              className={cn('w-full rounded-t', item.color || 'bg-blue-500')}
              style={{ height: `${barHeight}px` }}
            />
            <div className="text-xs text-gray-500 mt-2 text-center">{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// Donut Chart Component
interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size?: number;
  className?: string;
  centerContent?: React.ReactNode;
}

export function DonutChart({ data, size = 200, className, centerContent }: DonutChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-500', className)} style={{ width: size, height: size }}>
        No data available
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = 80;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;

  let cumulativePercentage = 0;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -((cumulativePercentage / 100) * circumference);
          
          cumulativePercentage += percentage;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={normalizedRadius}
              fill="transparent"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      
      {/* Center content */}
      {centerContent && (
        <div className="absolute inset-0 flex items-center justify-center">
          {centerContent}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute -bottom-6 left-0 w-full">
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {data.map((item, index) => (
            <div key={index} className="flex items-center space-x-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Progress Ring Component
interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  className,
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      
      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}