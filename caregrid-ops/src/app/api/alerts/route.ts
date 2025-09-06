import { NextRequest, NextResponse } from 'next/server';
import { createProtectedRoute } from '@/lib/auth/api-auth';

interface Alert {
  id: string;
  type: 'deployment' | 'configuration' | 'health';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  source: string;
  metadata?: Record<string, any>;
}

// In a real implementation, this would be stored in a database
let alerts: Alert[] = [];

// Check for deployment failures
async function checkDeploymentAlerts(): Promise<Alert[]> {
  try {
    const response = await fetch('/api/deployments');
    if (!response.ok) return [];
    
    const data = await response.json();
    const failedDeployments = data.deployments?.filter((d: any) => d.status === 'failed') || [];
    
    return failedDeployments.map((deployment: any) => ({
      id: `deployment-${deployment.id}`,
      type: 'deployment' as const,
      severity: 'high' as const,
      title: `Deployment Failed: ${deployment.project}`,
      message: `Deployment ${deployment.id} failed on ${deployment.platform}. Duration: ${deployment.duration}`,
      timestamp: new Date(deployment.timestamp),
      resolved: false,
      source: deployment.platform,
      metadata: {
        deploymentId: deployment.id,
        project: deployment.project,
        platform: deployment.platform,
        branch: deployment.branch,
      },
    }));
  } catch (error) {
    console.error('Failed to check deployment alerts:', error);
    return [];
  }
}

// Check for configuration issues
async function checkConfigurationAlerts(): Promise<Alert[]> {
  try {
    const response = await fetch('/api/deployments/config');
    if (!response.ok) return [];
    
    const data = await response.json();
    const criticalIssues = data.issues?.filter((i: any) => i.severity === 'critical') || [];
    const highIssues = data.issues?.filter((i: any) => i.severity === 'high') || [];
    
    const allIssues = [...criticalIssues, ...highIssues];
    
    return allIssues.map((issue: any) => ({
      id: `config-${issue.type}-${issue.file}`,
      type: 'configuration' as const,
      severity: issue.severity === 'critical' ? 'critical' as const : 'high' as const,
      title: `Configuration Issue: ${issue.type}`,
      message: issue.message,
      timestamp: new Date(),
      resolved: false,
      source: issue.file,
      metadata: {
        file: issue.file,
        type: issue.type,
        project: issue.project,
      },
    }));
  } catch (error) {
    console.error('Failed to check configuration alerts:', error);
    return [];
  }
}

// Check for health issues
async function checkHealthAlerts(): Promise<Alert[]> {
  try {
    const response = await fetch('/api/ops/health');
    if (!response.ok) return [];
    
    const data = await response.json();
    const unhealthyServices = data.services?.filter((s: any) => s.status === 'unhealthy') || [];
    const degradedServices = data.services?.filter((s: any) => s.status === 'degraded') || [];
    
    const healthAlerts: Alert[] = [];
    
    unhealthyServices.forEach((service: any) => {
      // Check for data completeness issues specifically
      if (service.service === 'database' && service.details?.error?.includes('incomplete data')) {
        healthAlerts.push({
          id: `data-completeness-${service.id}`,
          type: 'health' as const,
          severity: 'critical' as const,
          title: `Data Completeness Issue: ${service.service}`,
          message: `Database is returning incomplete data. ${service.details.error}. This indicates a potential API or database connectivity issue.`,
          timestamp: new Date(service.timestamp),
          resolved: false,
          source: service.service,
          metadata: {
            serviceId: service.id,
            responseTime: service.responseTime,
            endpoint: service.details?.endpoint,
            clinicCount: service.details?.clinicCount,
            issueType: 'data_completeness',
          },
        });
      } else {
        healthAlerts.push({
          id: `health-${service.id}`,
          type: 'health' as const,
          severity: 'critical' as const,
          title: `Service Unhealthy: ${service.service}`,
          message: `${service.service} is unhealthy. Response time: ${service.responseTime}ms. Error: ${service.details?.error || 'Unknown'}`,
          timestamp: new Date(service.timestamp),
          resolved: false,
          source: service.service,
          metadata: {
            serviceId: service.id,
            responseTime: service.responseTime,
            endpoint: service.details?.endpoint,
          },
        });
      }
    });
    
    degradedServices.forEach((service: any) => {
      healthAlerts.push({
        id: `health-degraded-${service.id}`,
        type: 'health' as const,
        severity: 'medium' as const,
        title: `Service Degraded: ${service.service}`,
        message: `${service.service} is experiencing degraded performance. Response time: ${service.responseTime}ms`,
        timestamp: new Date(service.timestamp),
        resolved: false,
        source: service.service,
        metadata: {
          serviceId: service.id,
          responseTime: service.responseTime,
          endpoint: service.details?.endpoint,
        },
      });
    });
    
    return healthAlerts;
  } catch (error) {
    console.error('Failed to check health alerts:', error);
    return [];
  }
}

// Aggregate all alerts
async function aggregateAlerts(): Promise<Alert[]> {
  const [deploymentAlerts, configAlerts, healthAlerts] = await Promise.all([
    checkDeploymentAlerts(),
    checkConfigurationAlerts(),
    checkHealthAlerts(),
  ]);
  
  const allAlerts = [...deploymentAlerts, ...configAlerts, ...healthAlerts];
  
  // Remove duplicates and sort by severity and timestamp
  const uniqueAlerts = allAlerts.filter((alert, index, self) => 
    index === self.findIndex(a => a.id === alert.id)
  );
  
  return uniqueAlerts.sort((a, b) => {
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}

export const GET = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const type = searchParams.get('type');
      const severity = searchParams.get('severity');
      const resolved = searchParams.get('resolved');
      
      let filteredAlerts = await aggregateAlerts();
      
      // Apply filters
      if (type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
      }
      
      if (severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
      }
      
      if (resolved !== null) {
        const isResolved = resolved === 'true';
        filteredAlerts = filteredAlerts.filter(alert => alert.resolved === isResolved);
      }
      
      return NextResponse.json({
        alerts: filteredAlerts,
        summary: {
          total: filteredAlerts.length,
          critical: filteredAlerts.filter(a => a.severity === 'critical').length,
          high: filteredAlerts.filter(a => a.severity === 'high').length,
          medium: filteredAlerts.filter(a => a.severity === 'medium').length,
          low: filteredAlerts.filter(a => a.severity === 'low').length,
          unresolved: filteredAlerts.filter(a => !a.resolved).length,
        },
      });
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch alerts' },
        { status: 500 }
      );
    }
  }
);

// Mark alert as resolved
export const PATCH = createProtectedRoute(
  ['admin', 'manager'],
  async (request: NextRequest) => {
    try {
      const { alertId, resolved } = await request.json();
      
      if (!alertId || typeof resolved !== 'boolean') {
        return NextResponse.json(
          { error: 'Invalid request body' },
          { status: 400 }
        );
      }
      
      // In a real implementation, this would update the database
      const alertIndex = alerts.findIndex(alert => alert.id === alertId);
      if (alertIndex !== -1) {
        alerts[alertIndex].resolved = resolved;
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Failed to update alert:', error);
      return NextResponse.json(
        { error: 'Failed to update alert' },
        { status: 500 }
      );
    }
  }
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}