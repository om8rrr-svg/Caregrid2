'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  RefreshCw,
  ExternalLink,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Rocket,
  Server,
  Globe,
  Settings,
} from 'lucide-react';

interface DeploymentStatus {
  id: string;
  platform: 'vercel' | 'render';
  project: string;
  status: 'success' | 'failed' | 'building' | 'queued';
  branch: string;
  commit: string;
  author: string;
  timestamp: string;
  duration?: string;
  url?: string;
  logs?: string;
  environment: 'production' | 'preview' | 'development';
}

interface ConfigIssue {
  id: string;
  type: 'vercel.json' | 'package.json' | 'env' | 'domain';
  severity: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  suggestion?: string;
}

const DeploymentMonitoringDashboard: React.FC = () => {
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([]);
  const [configIssues, setConfigIssues] = useState<ConfigIssue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data removed - deployments will be fetched from real deployment service
  // In production, this would connect to services like:
  // - Vercel API for frontend deployments
  // - Render API for backend deployments
  // - GitHub Actions API for CI/CD status
  // - Kubernetes API for container deployments

  useEffect(() => {
    // Initialize with real data
    fetchDeploymentStatus();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchDeploymentStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDeploymentStatus = async () => {
    setIsLoading(true);
    try {
      // Fetch deployment status from API
      const [deploymentsResponse, configResponse] = await Promise.all([
        fetch('/api/deployments'),
        fetch('/api/deployments/config'),
      ]);
      
      if (deploymentsResponse.ok) {
        const deploymentsData = await deploymentsResponse.json();
        setDeployments(deploymentsData.deployments || []);
      } else {
        console.error('Failed to fetch deployments');
        setDeployments([]);
      }
      
      if (configResponse.ok) {
        const configData = await configResponse.json();
        setConfigIssues(configData.issues || []);
      } else {
        console.error('Failed to fetch config issues');
        setConfigIssues([]);
      }
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch deployment status:', error);
      // Show empty states on error
      setDeployments([]);
      setConfigIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'building':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'queued':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      building: 'bg-blue-100 text-blue-800',
      queued: 'bg-yellow-100 text-yellow-800',
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Deployment Status</h2>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <Button
          onClick={fetchDeploymentStatus}
          disabled={isLoading}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Rocket className="h-5 w-5" />
            <span>Recent Deployments</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.length > 0 ? (
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <div
                  key={deployment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {deployment.platform === 'vercel' ? (
                        <Globe className="h-5 w-5 text-black" />
                      ) : (
                        <Server className="h-5 w-5 text-purple-600" />
                      )}
                      <span className="font-medium">{deployment.project}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(deployment.status)}
                      <Badge className={getStatusBadge(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <GitBranch className="h-4 w-4" />
                      <span>{deployment.branch}</span>
                      <span>•</span>
                      <span>{deployment.commit}</span>
                      <span>•</span>
                      <span>{deployment.author}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm">
                      <div className="text-gray-600">{deployment.timestamp}</div>
                      {deployment.duration && (
                        <div className="text-gray-500">{deployment.duration}</div>
                      )}
                    </div>
                    
                    {deployment.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(deployment.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Rocket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deployments found</h3>
              <p className="text-gray-500">
                Connect your deployment service to monitor deployments here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configuration Issues</span>
            {configIssues.length > 0 && (
              <Badge variant="outline" className="ml-2">
                {configIssues.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {configIssues.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No configuration issues detected</p>
            </div>
          ) : (
            <div className="space-y-4">
              {configIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(issue.severity)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium">{issue.type}</span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          issue.severity === 'error'
                            ? 'border-red-200 text-red-700'
                            : issue.severity === 'warning'
                            ? 'border-yellow-200 text-yellow-700'
                            : 'border-blue-200 text-blue-700'
                        }`}
                      >
                        {issue.severity}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{issue.message}</p>
                    
                    {issue.file && (
                      <p className="text-xs text-gray-500 mb-2">
                        File: {issue.file}
                      </p>
                    )}
                    
                    {issue.suggestion && (
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        💡 {issue.suggestion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentMonitoringDashboard;