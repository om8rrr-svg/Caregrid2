// Core Types for CareGrid Ops

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: Date;
  lastLogin?: Date;
}

export type UserRole = 'admin' | 'manager' | 'viewer';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Health Check Types
export interface HealthCheck {
  id: string;
  service: string;
  status: HealthStatus;
  responseTime: number;
  timestamp: Date;
  details?: Record<string, any>;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface SystemHealth {
  overall: HealthStatus;
  services: HealthCheck[];
  uptime: number;
  lastUpdated: Date;
}

// Alert Types
export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  tags: string[];
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';

// Incident Types
export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: IncidentStatus;
  createdAt: Date;
  resolvedAt?: Date;
  assignedTo?: string;
  affectedServices: string[];
  timeline: IncidentUpdate[];
}

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

export interface IncidentUpdate {
  id: string;
  message: string;
  timestamp: Date;
  author: string;
}

// Metrics Types
export interface Metric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface MetricSeries {
  name: string;
  data: { timestamp: Date; value: number }[];
  unit: string;
}

// Feature Flag Types
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Dashboard Types
export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'status' | 'list';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
}