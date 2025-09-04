'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  X,
  Bell,
  BellOff,
  Filter,
  ExternalLink,
  AlertCircle,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Alert, AlertSeverity, AlertStatus } from '@/types';

interface RealTimeAlert extends Alert {
  isNew?: boolean;
  autoResolveIn?: number;
}

interface AlertFilters {
  severity: AlertSeverity | 'all';
  status: AlertStatus | 'all';
  service: string | 'all';
}

// Mock alert generator
const generateRandomAlert = (): RealTimeAlert => {
  const severities: AlertSeverity[] = ['critical', 'high', 'medium', 'low'];
  const services = ['API Gateway', 'Database', 'Auth Service', 'File Storage', 'Email Service', 'Analytics'];
  const alertTypes = [
    'High response time detected',
    'Memory usage threshold exceeded',
    'Database connection timeout',
    'Unusual traffic spike',
    'Service health check failed',
    'Disk space running low',
    'SSL certificate expiring soon',
    'Rate limit threshold reached',
  ];

  const severity = severities[Math.floor(Math.random() * severities.length)];
  const service = services[Math.floor(Math.random() * services.length)];
  const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];

  return {
    id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    title: alertType,
    description: `${alertType} in ${service}. Immediate attention may be required.`,
    severity,
    status: 'open',
    createdAt: new Date(),
    tags: [service.toLowerCase().replace(' ', '-'), severity],
    isNew: true,
    autoResolveIn: severity === 'low' ? 300 : undefined, // Auto-resolve low severity alerts in 5 minutes
  };
};

const initialAlerts: RealTimeAlert[] = [
  {
    id: 'alert-1',
    title: 'Database connection pool exhausted',
    description: 'Primary database connection pool has reached maximum capacity. New connections are being queued.',
    severity: 'critical',
    status: 'open',
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    tags: ['database', 'critical'],
  },
  {
    id: 'alert-2',
    title: 'High response time detected',
    description: 'API Gateway response time has exceeded 2000ms threshold for the past 5 minutes.',
    severity: 'high',
    status: 'acknowledged',
    createdAt: new Date(Date.now() - 25 * 60 * 1000),
    assignedTo: 'ops-team@caregrid.com',
    tags: ['api-gateway', 'performance'],
  },
  {
    id: 'alert-3',
    title: 'SSL certificate expiring soon',
    description: 'SSL certificate for api.caregrid.com will expire in 7 days.',
    severity: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ['security', 'ssl'],
  },
];

export function RealTimeAlerts() {
  const [alerts, setAlerts] = useState<RealTimeAlert[]>(initialAlerts);
  const [filters, setFilters] = useState<AlertFilters>({
    severity: 'all',
    status: 'all',
    service: 'all',
  });
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Simulate real-time alerts
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly generate new alerts (20% chance every 30 seconds)
      if (Math.random() < 0.2) {
        const newAlert = generateRandomAlert();
        setAlerts(prev => [newAlert, ...prev].slice(0, 50)); // Keep only latest 50 alerts
        
        // Show browser notification if enabled
        if (isNotificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(`CareGrid Ops: ${newAlert.severity.toUpperCase()} Alert`, {
            body: newAlert.title,
            icon: '/favicon.ico',
            tag: newAlert.id,
          });
        }
      }

      // Auto-resolve alerts that have autoResolveIn timer
      setAlerts(prev => prev.map(alert => {
        if (alert.autoResolveIn && alert.status === 'open') {
          const timeElapsed = (Date.now() - alert.createdAt.getTime()) / 1000;
          if (timeElapsed >= alert.autoResolveIn) {
            return { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() };
          }
        }
        return alert;
      }));

      // Remove 'new' flag from alerts after 10 seconds
      setAlerts(prev => prev.map(alert => {
        if (alert.isNew) {
          const timeElapsed = Date.now() - alert.createdAt.getTime();
          if (timeElapsed > 10000) {
            return { ...alert, isNew: false };
          }
        }
        return alert;
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, [isNotificationsEnabled]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) return false;
    if (filters.status !== 'all' && alert.status !== filters.status) return false;
    if (filters.service !== 'all') {
      const hasService = alert.tags.some(tag => tag.includes(filters.service.toLowerCase().replace(' ', '-')));
      if (!hasService) return false;
    }
    return true;
  });

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'acknowledged' as AlertStatus }
        : alert
    ));
  };

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, status: 'resolved' as AlertStatus, resolvedAt: new Date() }
        : alert
    ));
  };

  const getSeverityIcon = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'high':
        return 'border-orange-500 bg-orange-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'suppressed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const openAlerts = alerts.filter(alert => alert.status === 'open').length;
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'open').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Real-Time Alerts</span>
              {openAlerts > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {openAlerts}
                </span>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
              >
                {isNotificationsEnabled ? (
                  <Bell className="h-4 w-4 mr-2" />
                ) : (
                  <BellOff className="h-4 w-4 mr-2" />
                )}
                {isNotificationsEnabled ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {/* Alert Summary */}
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{criticalAlerts}</div>
              <div className="text-sm text-red-700">Critical</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">
                {alerts.filter(a => a.severity === 'high' && a.status === 'open').length}
              </div>
              <div className="text-sm text-orange-700">High</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600">
                {alerts.filter(a => a.severity === 'medium' && a.status === 'open').length}
              </div>
              <div className="text-sm text-yellow-700">Medium</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">
                {alerts.filter(a => a.severity === 'low' && a.status === 'open').length}
              </div>
              <div className="text-sm text-blue-700">Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as AlertSeverity | 'all' }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as AlertStatus | 'all' }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="acknowledged">Acknowledged</option>
                  <option value="resolved">Resolved</option>
                  <option value="suppressed">Suppressed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select
                  value={filters.service}
                  onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Services</option>
                  <option value="api-gateway">API Gateway</option>
                  <option value="database">Database</option>
                  <option value="auth-service">Auth Service</option>
                  <option value="file-storage">File Storage</option>
                  <option value="email-service">Email Service</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts ({filteredAlerts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No alerts match your current filters</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    'p-4 border-l-4 rounded-lg transition-all duration-200',
                    getSeverityColor(alert.severity),
                    alert.isNew && 'animate-pulse'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSeverityIcon(alert.severity)}
                        <h4 className="font-medium text-gray-900">{alert.title}</h4>
                        {alert.isNew && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{alert.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {alert.createdAt.toLocaleString()}
                        </span>
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(alert.status))}>
                          {alert.status.toUpperCase()}
                        </span>
                        {alert.assignedTo && (
                          <span>Assigned to: {alert.assignedTo}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {alert.status === 'open' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleResolveAlert(alert.id)}
                          >
                            Resolve
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDismissAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}