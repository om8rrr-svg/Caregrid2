'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  RefreshCw, 
  Settings, 
  TrendingUp,
  XCircle,
  Zap
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { CircuitBreakerStats } from '@/lib/api/circuit-breaker';
import { QueueStats } from '@/lib/api/request-queue';
import { HealthCheck } from '@/types';

interface SystemHealth {
  timestamp: string;
  overall: {
    status: string;
    healthyServices: string[];
    unhealthyServices: string[];
  };
  circuitBreakers: Record<string, CircuitBreakerStats>;
  requestQueues: {
    stats: Record<string, QueueStats>;
    health: {
      status: string;
      queues: Record<string, { status: string; issues: string[] }>;
    };
  };
  healthMonitor: Map<string, HealthCheck>;
}

export default function ApiMonitoringDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [activeTab, setActiveTab] = useState('circuit-breakers');

  // Fetch system health data
  const fetchSystemHealth = async () => {
    try {
      const health = await apiClient.getSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Failed to fetch system health:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchSystemHealth();
  };

  // Force health check
  const handleForceHealthCheck = async () => {
    try {
      await apiClient.forceHealthCheck();
      await fetchSystemHealth();
    } catch (error) {
      console.error('Failed to force health check:', error);
    }
  };

  // Reset circuit breakers
  const handleResetCircuitBreakers = async () => {
    try {
      apiClient.resetCircuitBreakers();
      await fetchSystemHealth();
    } catch (error) {
      console.error('Failed to reset circuit breakers:', error);
    }
  };

  // Clear request queues
  const handleClearQueues = async () => {
    try {
      apiClient.clearRequestQueues();
      await fetchSystemHealth();
    } catch (error) {
      console.error('Failed to clear request queues:', error);
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'closed':
        return 'text-green-600';
      case 'degraded':
      case 'half_open':
        return 'text-yellow-600';
      case 'unhealthy':
      case 'open':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded':
      case 'half_open':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy':
      case 'open':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading system health...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Monitoring Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of API health, circuit breakers, and request queues
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh: {autoRefresh ? 'On' : 'Off'}
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      {systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon(systemHealth.overall.status)}
              <span className="ml-2">System Overview</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ml-auto ${
                systemHealth.overall.status === 'healthy' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {systemHealth.overall.status.toUpperCase()}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemHealth.overall.healthyServices.length}
                </div>
                <div className="text-sm text-muted-foreground">Healthy Services</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {systemHealth.overall.unhealthyServices.length}
                </div>
                <div className="text-sm text-muted-foreground">Unhealthy Services</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {new Date(systemHealth.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
              </div>
            </div>
            
            {systemHealth.overall.unhealthyServices.length > 0 && (
              <div className="mt-4 p-4 border border-yellow-200 bg-yellow-50 rounded-lg flex items-center">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                <span className="text-yellow-800">
                  Unhealthy services: {systemHealth.overall.unhealthyServices.join(', ')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Detailed Monitoring */}
      {systemHealth && (
        <div className="space-y-4">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {['circuit-breakers', 'request-queues', 'health-monitor', 'actions'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>

          {/* Circuit Breakers Tab */}
          {activeTab === 'circuit-breakers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(systemHealth.circuitBreakers).map(([service, stats]) => (
                <Card key={service}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      {getStatusIcon(stats.state)}
                      <span className="ml-2">{service}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ml-auto ${
                         stats.state === 'CLOSED' 
                           ? 'bg-green-100 text-green-800' 
                           : 'bg-red-100 text-red-800'
                       }`}>
                        {stats.state}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Success Rate:</span>
                        <span className="font-medium">
                          {((stats.totalSuccesses / (stats.totalRequests || 1)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Total Requests:</span>
                        <span className="font-medium">{stats.totalRequests}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Failures:</span>
                        <span className="font-medium text-red-600">{stats.totalFailures}</span>
                      </div>
                      
                      <div className="h-2 w-full bg-gray-200 rounded-full">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(stats.totalSuccesses / (stats.totalRequests || 1)) * 100}%` }}
                        ></div>
                      </div>
                      
                      {stats.lastFailureTime && (
                        <div className="text-xs text-muted-foreground">
                          Last failure: {new Date(stats.lastFailureTime).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Request Queues Tab */}
          {activeTab === 'request-queues' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Queue Health Overview
                    <span className={`px-2 py-1 rounded text-xs font-medium ml-auto ${
                      systemHealth.requestQueues.health.status === 'healthy' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {systemHealth.requestQueues.health.status.toUpperCase()}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(systemHealth.requestQueues.stats).map(([queue, stats]) => (
                      <div key={queue} className="text-center p-4 border rounded-lg">
                        <div className="text-lg font-bold">{queue}</div>
                        <div className="space-y-1 mt-2">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Queue Size: </span>
                            <span className="font-medium">{stats.queueSize}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Active: </span>
                            <span className="font-medium">{stats.activeRequests}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Completed: </span>
                            <span className="font-medium text-green-600">{stats.completedRequests}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Failed: </span>
                            <span className="font-medium text-red-600">{stats.failedRequests}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Avg Wait: </span>
                            <span className="font-medium">{Math.round(stats.averageWaitTime)}ms</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Health Monitor Tab */}
          {activeTab === 'health-monitor' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(systemHealth.healthMonitor.entries()).map(([service, health]) => (
                <Card key={service}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      {getStatusIcon(health.status)}
                      <span className="ml-2">{health.service}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ml-auto ${
                        health.status === 'healthy' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {health.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Response Time:</span>
                        <span className="font-medium">{health.responseTime}ms</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Last Check:</span>
                        <span className="font-medium">
                          {new Date(health.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {health.details && Object.keys(health.details).length > 0 && (
                        <div className="mt-2 p-2 bg-muted rounded text-xs">
                          <pre>{JSON.stringify(health.details, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    System Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    onClick={handleForceHealthCheck}
                    className="w-full"
                    variant="outline"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Force Health Check
                  </Button>
                  
                  <Button 
                    onClick={handleResetCircuitBreakers}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset Circuit Breakers
                  </Button>
                  
                  <Button 
                    onClick={handleClearQueues}
                    className="w-full"
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Clear Request Queues
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Refresh Interval (seconds)</label>
                    <select 
                      value={refreshInterval / 1000}
                      onChange={(e) => setRefreshInterval(Number(e.target.value) * 1000)}
                      className="w-full mt-1 p-2 border rounded"
                    >
                      <option value={10}>10 seconds</option>
                      <option value={30}>30 seconds</option>
                      <option value={60}>1 minute</option>
                      <option value={300}>5 minutes</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-refresh"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <label htmlFor="auto-refresh" className="text-sm font-medium">
                      Enable Auto-refresh
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}