'use client';

import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { BarChart3, TrendingUp, TrendingDown, RefreshCw, Clock, Users, Server, Database } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatNumber, formatPercentage } from '@/lib/utils';
import type { Metric, MetricSeries } from '@/types';

// Mock metrics data
const mockSystemMetrics = {
  responseTime: 145,
  throughput: 1250,
  errorRate: 0.02,
  uptime: 99.97,
  activeUsers: 342,
  totalRequests: 125000,
  cpuUsage: 45.2,
  memoryUsage: 67.8,
  diskUsage: 34.1,
  networkIO: 2.4,
};

const mockMetricSeries: MetricSeries[] = [
  {
    name: 'Response Time',
    unit: 'ms',
    data: [
      { timestamp: new Date('2024-01-15T10:00:00Z'), value: 120 },
      { timestamp: new Date('2024-01-15T10:15:00Z'), value: 135 },
      { timestamp: new Date('2024-01-15T10:30:00Z'), value: 145 },
      { timestamp: new Date('2024-01-15T10:45:00Z'), value: 140 },
      { timestamp: new Date('2024-01-15T11:00:00Z'), value: 150 },
    ],
  },
  {
    name: 'Throughput',
    unit: 'req/min',
    data: [
      { timestamp: new Date('2024-01-15T10:00:00Z'), value: 1100 },
      { timestamp: new Date('2024-01-15T10:15:00Z'), value: 1200 },
      { timestamp: new Date('2024-01-15T10:30:00Z'), value: 1250 },
      { timestamp: new Date('2024-01-15T10:45:00Z'), value: 1180 },
      { timestamp: new Date('2024-01-15T11:00:00Z'), value: 1300 },
    ],
  },
];

const mockBusinessMetrics = {
  totalBookings: 1247,
  completedBookings: 1189,
  cancelledBookings: 58,
  revenue: 45670,
  averageBookingValue: 38.4,
  conversionRate: 12.3,
};

function MetricsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeRange, setTimeRange] = useState('1h');

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

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="System Metrics"
          description="Monitor system performance and business metrics"
          action={
            <div className="flex items-center space-x-3">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1h">Last Hour</option>
                <option value="6h">Last 6 Hours</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
              </select>
              <Button
                onClick={handleRefresh}
                loading={isRefreshing}
                icon={RefreshCw}
                variant="outline"
              >
                Refresh
              </Button>
            </div>
          }
        />

        {/* System Performance Metrics */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Response Time"
              value={`${mockSystemMetrics.responseTime}ms`}
              change={{ value: 4.7, type: 'increase' }}
              icon={Clock}
            />
            <StatCard
              title="Throughput"
              value={`${formatNumber(mockSystemMetrics.throughput)}/min`}
              change={{ value: 12.3, type: 'increase' }}
              icon={TrendingUp}
            />
            <StatCard
              title="Error Rate"
              value={`${formatPercentage(mockSystemMetrics.errorRate)}%`}
              change={{ value: 0.1, type: 'decrease' }}
              icon={TrendingDown}
            />
            <StatCard
              title="Uptime"
              value={`${formatPercentage(mockSystemMetrics.uptime)}%`}
              change={{ value: 0.02, type: 'increase' }}
              icon={Server}
            />
          </div>
        </div>

        {/* Resource Utilization */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resource Utilization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">CPU Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{mockSystemMetrics.cpuUsage}%</span>
                  <div className="w-16 h-16">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-blue-600"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${mockSystemMetrics.cpuUsage}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{mockSystemMetrics.memoryUsage}%</span>
                  <div className="w-16 h-16">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-green-600"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${mockSystemMetrics.memoryUsage}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Disk Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{mockSystemMetrics.diskUsage}%</span>
                  <div className="w-16 h-16">
                    <div className="relative w-16 h-16">
                      <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-yellow-600"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${mockSystemMetrics.diskUsage}, 100`}
                          strokeLinecap="round"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-gray-600">Network I/O</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{mockSystemMetrics.networkIO} GB/s</div>
                  <div className="text-sm text-gray-600">Average throughput</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Business Metrics */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Business Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Total Bookings"
              value={formatNumber(mockBusinessMetrics.totalBookings)}
              change={{ value: 8.2, type: 'increase' }}
              icon={BarChart3}
            />
            <StatCard
              title="Completion Rate"
              value={`${formatPercentage(mockBusinessMetrics.completedBookings / mockBusinessMetrics.totalBookings)}%`}
              change={{ value: 2.1, type: 'increase' }}
              icon={TrendingUp}
            />
            <StatCard
              title="Revenue"
              value={`£${formatNumber(mockBusinessMetrics.revenue)}`}
              change={{ value: 15.3, type: 'increase' }}
              icon={TrendingUp}
            />
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-center text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>
    </Layout>
  );
}

// Protect with admin and manager roles
export default withAuth(MetricsPage, ['admin', 'manager']);