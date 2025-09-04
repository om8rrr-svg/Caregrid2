'use client';

import React from 'react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import ApiMonitoringDashboard from '@/components/monitoring/ApiMonitoringDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Activity, Server, Database, Shield } from 'lucide-react';

function MonitoringPage() {
  return (
    <Layout>
      <PageHeader
        title="System Monitoring"
        description="Real-time monitoring of CareGrid production infrastructure"
        action={
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-green-500" />
            <span className="text-sm text-gray-600">Live Monitoring Active</span>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Health</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Healthy</div>
              <p className="text-xs text-muted-foreground">
                All services operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                Response time: 45ms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Secure</div>
              <p className="text-xs text-muted-foreground">
                No threats detected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">99.9%</div>
              <p className="text-xs text-muted-foreground">
                Last 30 days
              </p>
            </CardContent>
          </Card>
      </div>

      {/* Main Monitoring Dashboard */}
      <ApiMonitoringDashboard />
    </Layout>
  );
}

// Protect the monitoring page with authentication
export default withAuth(MonitoringPage);