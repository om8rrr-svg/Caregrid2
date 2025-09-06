'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, StatCard, StatusCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, formatPercentage, getStatusColor, cn } from '@/lib/utils';
import { toggleMaintenance, getMaintenanceStatus, runSynthetic } from '@/lib/api/ops';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Server,
  Database,
  Globe,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  BarChart3,
  PieChart,
  LineChart,
  Zap,
} from 'lucide-react';
import type { Alert, AlertSeverity } from '@/types';
import { MetricsDashboard } from './MetricsDashboard';
import { RealTimeAlerts } from './RealTimeAlerts';
import { DashboardGrid, GridItem, WidgetSizes, useResponsive } from './ResponsiveGrid';
import { RoleRestricted, RoleButton } from '@/components/auth/RoleRestricted';

// Health status type
type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

// Mock data interfaces
interface SystemMetrics {
  uptime: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
  totalRequests: number;
}

interface ServiceHealth {
  name: string;
  status: HealthStatus;
  responseTime: number;
  uptime: number;
}

interface RecentAlert {
  id: string;
  title: string;
  severity: AlertSeverity;
  timestamp: Date;
  service: string;
}

// Mock data
const mockSystemMetrics: SystemMetrics = {
  uptime: 99.97,
  responseTime: 245,
  throughput: 1247,
  errorRate: 0.03,
  activeUsers: 342,
  totalRequests: 45678,
};

const mockServiceHealth: ServiceHealth[] = [
  { name: 'API Gateway', status: 'healthy', responseTime: 120, uptime: 99.99 },
  { name: 'Database', status: 'healthy', responseTime: 45, uptime: 99.95 },
  { name: 'Auth Service', status: 'healthy', responseTime: 89, uptime: 99.98 },
  { name: 'File Storage', status: 'degraded', responseTime: 340, uptime: 98.76 },
  { name: 'Email Service', status: 'healthy', responseTime: 156, uptime: 99.87 },
  { name: 'Analytics', status: 'healthy', responseTime: 203, uptime: 99.92 },
];

const mockRecentAlerts: RecentAlert[] = [
  {
    id: '1',
    title: 'High response time detected',
    severity: 'medium',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    service: 'File Storage',
  },
  {
    id: '2',
    title: 'Database connection pool exhausted',
    severity: 'high',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    service: 'Database',
  },
  {
    id: '3',
    title: 'Unusual traffic spike detected',
    severity: 'low',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    service: 'API Gateway',
  },
];

// Main Dashboard Component
export function Dashboard() {
  const { state } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const { isMobile, isTablet } = useResponsive();

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    // Check maintenance status on mount
    const checkMaintenance = async () => {
      try {
        const status = await getMaintenanceStatus();
        setIsMaintenanceMode(status.enabled);
      } catch (error) {
        console.error('Failed to check maintenance status:', error);
      }
    };

    checkMaintenance();
    return () => clearInterval(interval);
  }, []);

  const handleMaintenanceToggle = async () => {
    try {
      const newStatus = await toggleMaintenance(!isMaintenanceMode);
      setIsMaintenanceMode(newStatus.enabled);
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    }
  };

  const handleRunSynthetic = async () => {
    setIsRunningTest(true);
    try {
      await runSynthetic();
    } catch (error) {
      console.error('Failed to run synthetic test:', error);
    } finally {
      setIsRunningTest(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor system health, performance metrics, and operational status"
        action={
          <div className="flex gap-2">
            <RoleRestricted requiredRoles={['admin', 'manager']}>
              <RoleButton
                onClick={handleRunSynthetic}
                disabled={isRunningTest}
                className="btn btn-outline btn-sm"
                requiredRoles={['admin', 'manager']}
              >
                <Zap className="h-4 w-4 mr-2" />
                {isRunningTest ? 'Running...' : 'Run Test'}
              </RoleButton>
            </RoleRestricted>
            <RoleRestricted requiredRoles={['admin']}>
              <RoleButton
                onClick={handleMaintenanceToggle}
                className={`btn btn-sm ${isMaintenanceMode ? 'btn-destructive' : 'btn-outline'}`}
                requiredRoles={['admin']}
              >
                <Settings className="h-4 w-4 mr-2" />
                {isMaintenanceMode ? 'Exit Maintenance' : 'Maintenance Mode'}
              </RoleButton>
            </RoleRestricted>
            <Button
              onClick={() => setLastUpdated(new Date())}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      {isMaintenanceMode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              System is currently in maintenance mode
            </span>
          </div>
        </div>
      )}

      {/* System Overview */}
      <DashboardGrid>
        <GridItem {...WidgetSizes.small}>
          <Card>
            <CardHeader>
              <CardTitle>System Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSystemMetrics.uptime}%</div>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem {...WidgetSizes.small}>
          <Card>
            <CardHeader>
              <CardTitle>Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockSystemMetrics.responseTime}ms</div>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem {...WidgetSizes.small}>
          <Card>
            <CardHeader>
              <CardTitle>Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(mockSystemMetrics.throughput)}/min</div>
            </CardContent>
          </Card>
        </GridItem>
        <GridItem {...WidgetSizes.small}>
          <Card>
            <CardHeader>
              <CardTitle>Error Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(mockSystemMetrics.errorRate)}%</div>
            </CardContent>
          </Card>
        </GridItem>
      </DashboardGrid>

      {/* Service Health */}
      <Card>
        <CardHeader>
          <CardTitle>Service Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockServiceHealth.map((service) => (
              <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    getStatusColor(service.status)
                  )} />
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div className="text-sm text-gray-500">
                      {service.responseTime}ms • {service.uptime}% uptime
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium capitalize">
                  {service.status}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Dashboard */}
      <MetricsDashboard />

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockRecentAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    alert.severity === 'high' ? 'text-red-500' :
                    alert.severity === 'medium' ? 'text-yellow-500' :
                    'text-blue-500'
                  )} />
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-gray-500">
                      {alert.service} • {alert.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium",
                  alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                )}>
                  {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      <RealTimeAlerts />

      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh: 30s
      </div>
    </div>
  );
}

// Additional widget components
export function MetricsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">CPU Usage</div>
            <div className="text-2xl font-bold">67%</div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -2.3%
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Memory Usage</div>
            <div className="text-2xl font-bold">84%</div>
            <div className="flex items-center text-sm text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +1.2%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveUsersWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Active Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">1,247</div>
        <div className="flex items-center text-sm text-green-600 mt-1">
          <TrendingUp className="h-3 w-3 mr-1" />
          +12% from last hour
        </div>
      </CardContent>
    </Card>
  );
}