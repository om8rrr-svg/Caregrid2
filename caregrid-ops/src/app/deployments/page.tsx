'use client';

import React from 'react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import DeploymentMonitoringDashboard from '@/components/deployments/DeploymentMonitoringDashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Rocket, GitBranch, CheckCircle, XCircle, Clock } from 'lucide-react';

function DeploymentsPage() {
  return (
    <Layout>
      <PageHeader
        title="Deployment Monitoring"
        description="Real-time monitoring of Vercel and Render deployments"
        action={
          <div className="flex items-center space-x-2">
            <Rocket className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Live Deployment Tracking</span>
          </div>
        }
      />

      {/* Quick Deployment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vercel Status</CardTitle>
            <Rocket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">
              3 projects deployed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Render Status</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Running</div>
            <p className="text-xs text-muted-foreground">
              Backend services up
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">12</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">2</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Deploy Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">2.3m</div>
            <p className="text-xs text-muted-foreground">
              Last 10 deployments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Deployment Dashboard */}
      <DeploymentMonitoringDashboard />
    </Layout>
  );
}

// Protect the deployment page with authentication
export default withAuth(DeploymentsPage);