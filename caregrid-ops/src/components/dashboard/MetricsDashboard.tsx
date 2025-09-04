'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LineChart, BarChart, DonutChart, ProgressRing } from '@/components/ui/Chart';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Users,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  BarChart3,
} from 'lucide-react';
import { formatNumber, formatPercentage } from '@/lib/utils';

// Types for metrics data
interface MetricPoint {
  label: string;
  value: number;
  timestamp?: Date;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface PerformanceMetrics {
  responseTime: MetricPoint[];
  throughput: MetricPoint[];
  errorRate: MetricPoint[];
  activeUsers: MetricPoint[];
}

interface ServiceDistribution {
  label: string;
  value: number;
  color: string;
}

// Mock data generators
const generateTimeSeriesData = (points: number, baseValue: number, variance: number): MetricPoint[] => {
  const now = new Date();
  return Array.from({ length: points }, (_, i) => {
    const timestamp = new Date(now.getTime() - (points - 1 - i) * 5 * 60 * 1000); // 5-minute intervals
    const value = baseValue + (Math.random() - 0.5) * variance;
    return {
      label: timestamp.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: Math.max(0, value),
      timestamp,
    };
  });
};

const generateSystemMetrics = (): SystemMetrics => ({
  cpu: 45 + Math.random() * 30,
  memory: 60 + Math.random() * 25,
  disk: 35 + Math.random() * 20,
  network: 20 + Math.random() * 40,
});

const generateServiceDistribution = (): ServiceDistribution[] => [
  { label: 'API Gateway', value: 35, color: '#3b82f6' },
  { label: 'Database', value: 25, color: '#10b981' },
  { label: 'Auth Service', value: 20, color: '#f59e0b' },
  { label: 'File Storage', value: 15, color: '#ef4444' },
  { label: 'Analytics', value: 5, color: '#8b5cf6' },
];

export function MetricsDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>(generateSystemMetrics());
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    responseTime: generateTimeSeriesData(12, 250, 100),
    throughput: generateTimeSeriesData(12, 1200, 300),
    errorRate: generateTimeSeriesData(12, 0.5, 0.3),
    activeUsers: generateTimeSeriesData(12, 340, 80),
  });
  const [serviceDistribution] = useState<ServiceDistribution[]>(generateServiceDistribution());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemMetrics(generateSystemMetrics());
      setPerformanceMetrics(prev => ({
        responseTime: [...prev.responseTime.slice(1), {
          label: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.max(0, 250 + (Math.random() - 0.5) * 100),
          timestamp: new Date(),
        }],
        throughput: [...prev.throughput.slice(1), {
          label: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.max(0, 1200 + (Math.random() - 0.5) * 300),
          timestamp: new Date(),
        }],
        errorRate: [...prev.errorRate.slice(1), {
          label: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.max(0, 0.5 + (Math.random() - 0.5) * 0.3),
          timestamp: new Date(),
        }],
        activeUsers: [...prev.activeUsers.slice(1), {
          label: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          value: Math.max(0, 340 + (Math.random() - 0.5) * 80),
          timestamp: new Date(),
        }],
      }));
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSystemMetrics(generateSystemMetrics());
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const currentResponseTime = performanceMetrics.responseTime[performanceMetrics.responseTime.length - 1]?.value || 0;
  const currentThroughput = performanceMetrics.throughput[performanceMetrics.throughput.length - 1]?.value || 0;
  const currentErrorRate = performanceMetrics.errorRate[performanceMetrics.errorRate.length - 1]?.value || 0;
  const currentActiveUsers = performanceMetrics.activeUsers[performanceMetrics.activeUsers.length - 1]?.value || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Metrics</h2>
          <p className="text-gray-600">Real-time system performance and resource utilization</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            onClick={handleRefresh}
            loading={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Resource Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Cpu className="h-4 w-4 mr-2 text-blue-500" />
              CPU Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ProgressRing
                percentage={systemMetrics.cpu}
                size={100}
                color={systemMetrics.cpu > 80 ? '#ef4444' : systemMetrics.cpu > 60 ? '#f59e0b' : '#10b981'}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{systemMetrics.cpu.toFixed(1)}%</div>
                </div>
              </ProgressRing>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Monitor className="h-4 w-4 mr-2 text-green-500" />
              Memory Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ProgressRing
                percentage={systemMetrics.memory}
                size={100}
                color={systemMetrics.memory > 80 ? '#ef4444' : systemMetrics.memory > 60 ? '#f59e0b' : '#10b981'}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{systemMetrics.memory.toFixed(1)}%</div>
                </div>
              </ProgressRing>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <HardDrive className="h-4 w-4 mr-2 text-purple-500" />
              Disk Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ProgressRing
                percentage={systemMetrics.disk}
                size={100}
                color={systemMetrics.disk > 80 ? '#ef4444' : systemMetrics.disk > 60 ? '#f59e0b' : '#10b981'}
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{systemMetrics.disk.toFixed(1)}%</div>
                </div>
              </ProgressRing>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Wifi className="h-4 w-4 mr-2 text-orange-500" />
              Network I/O
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <ProgressRing
                percentage={systemMetrics.network}
                size={100}
                color="#f59e0b"
              >
                <div className="text-center">
                  <div className="text-lg font-bold">{systemMetrics.network.toFixed(1)}%</div>
                </div>
              </ProgressRing>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-500" />
                Response Time
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{currentResponseTime.toFixed(0)}ms</div>
                <div className="text-sm text-gray-500">Current</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={performanceMetrics.responseTime}
              height={200}
              color="#3b82f6"
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Throughput Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-500" />
                Throughput
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">{formatNumber(currentThroughput)}/min</div>
                <div className="text-sm text-gray-500">Requests</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={performanceMetrics.throughput}
              height={200}
              color="#10b981"
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Error Rate Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                Error Rate
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">{currentErrorRate.toFixed(2)}%</div>
                <div className="text-sm text-gray-500">Current</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={performanceMetrics.errorRate}
              height={200}
              color="#ef4444"
              className="mt-4"
            />
          </CardContent>
        </Card>

        {/* Active Users Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" />
                Active Users
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{formatNumber(currentActiveUsers)}</div>
                <div className="text-sm text-gray-500">Online</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              data={performanceMetrics.activeUsers}
              height={200}
              color="#8b5cf6"
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>

      {/* Service Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2 text-blue-500" />
              Service Load Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <DonutChart
              data={serviceDistribution}
              size={250}
              centerContent={
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-500">Total Load</div>
                </div>
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-green-500" />
              Service Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: 'API', value: 120, color: 'bg-blue-500' },
                { label: 'DB', value: 45, color: 'bg-green-500' },
                { label: 'Auth', value: 89, color: 'bg-yellow-500' },
                { label: 'Storage', value: 340, color: 'bg-red-500' },
                { label: 'Analytics', value: 203, color: 'bg-purple-500' },
              ]}
              height={200}
              className="mt-4"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}