'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, StatCard, StatusCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { formatNumber, formatPercentage, getStatusColor, cn } from '@/lib/utils';
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

// Dashboard Component
export function Dashboard() {
  const { state } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts'>('overview');
  const { isMobile, isTablet } = useResponsive();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const overallHealth = mockServiceHealth.every(service => service.status === 'healthy') 
    ? 'healthy' 
    : mockServiceHealth.some(service => service.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Monitor system health, performance metrics, and real-time alerts"
        actions={
          <div className="flex items-center space-x-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              <span>Refresh</span>
            </Button>
          </div>
        }
      />

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'metrics', label: 'Metrics', icon: BarChart3 },
            { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm',
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* System Overview */}
          <DashboardGrid>
            <GridItem {...WidgetSizes.small}>
              <StatCard
                title="System Uptime"
                value={`${mockSystemMetrics.uptime}%`}
                icon={<CheckCircle className="h-6 w-6 text-green-500" />}
                trend={{ value: 0.02, isPositive: true }}
              />
            </GridItem>
            <GridItem {...WidgetSizes.small}>
              <StatCard
                title="Response Time"
                value={`${mockSystemMetrics.responseTime}ms`}
                icon={<Clock className="h-6 w-6 text-blue-500" />}
                trend={{ value: 12, isPositive: false }}
              />
            </GridItem>
            <GridItem {...WidgetSizes.small}>
              <StatCard
                title="Throughput"
                value={formatNumber(mockSystemMetrics.throughput)}
                subtitle="requests/min"
                icon={<TrendingUp className="h-6 w-6 text-purple-500" />}
                trend={{ value: 8.5, isPositive: true }}
              />
            </GridItem>
            <GridItem {...WidgetSizes.small}>
              <StatCard
                title="Error Rate"
                value={`${mockSystemMetrics.errorRate}%`}
                icon={<AlertTriangle className="h-6 w-6 text-red-500" />}
                trend={{ value: 0.01, isPositive: false }}
              />
            </GridItem>
          </DashboardGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Health */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Service Health</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    overallHealth === 'healthy' ? 'bg-green-500' :
                    overallHealth === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{overallHealth}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockServiceHealth.map((service, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        service.status === 'healthy' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' :
                        service.status === 'unhealthy' ? 'bg-red-500' : 'bg-gray-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">
                          {service.responseTime}ms • {formatPercentage(service.uptime)}% uptime
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-medium capitalize ${
                        service.status === 'healthy' ? 'text-green-600' :
                        service.status === 'degraded' ? 'text-yellow-600' :
                        service.status === 'unhealthy' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Alerts */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Recent Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockRecentAlerts.map((alert) => (
                  <div key={alert.id} className="border-l-4 border-l-orange-400 pl-3 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.service} • {alert.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        alert.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : alert.severity === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : alert.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {alert.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" size="sm" fullWidth>
                  View All Alerts
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>



          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Server className="w-6 h-6" />
                  <span>Health Check</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Database className="w-6 h-6" />
                  <span>Database Status</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <BarChart3 className="w-6 h-6" />
                  <span>View Metrics</span>
                </Button>
                <Button variant="outline" className="h-20 flex-col space-y-2">
                  <Settings className="w-6 h-6" />
                  <span>System Config</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <MetricsDashboard />
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <RealTimeAlerts />
      )}

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-500">
        Last updated: {lastUpdated.toLocaleTimeString()} • Auto-refresh: 30s
      </div>
    </div>
  );
}

// Widget Components for Dashboard
export function MetricsWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">CPU Usage</span>
            <span className="font-medium">67%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '67%' }} />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Memory Usage</span>
            <span className="font-medium">84%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full" style={{ width: '84%' }} />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Disk Usage</span>
            <span className="font-medium">45%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }} />
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
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Active Users</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">
            {formatNumber(mockSystemMetrics.activeUsers)}
          </div>
          <p className="text-sm text-gray-600 mt-1">Currently online</p>
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            <div>
              <span className="font-medium">Peak today:</span>
              <span className="ml-1 text-gray-600">487</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}