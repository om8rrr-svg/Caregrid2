'use client';

import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { AlertTriangle, Clock, User, CheckCircle, Plus, Filter, X, Bell } from 'lucide-react';
import { getAlerts, createAlert, acknowledgeAlert } from '@/lib/api/ops';
import type { Alert, AlertSeverity, AlertStatus } from '@/types';
import { RoleButton } from '@/components/auth/RoleRestricted';

function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ status: string; severity: string }>({
    status: 'all',
    severity: 'all',
  });

  // Load alerts
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAlerts(
        filters.status !== 'all' || filters.severity !== 'all' 
          ? { 
              status: filters.status !== 'all' ? filters.status : undefined,
              severity: filters.severity !== 'all' ? filters.severity : undefined 
            }
          : undefined
      );
      
      if (response.success) {
        setAlerts(response.data || []);
      } else {
        setError(response.error || 'Failed to load alerts');
      }
    } catch (err) {
      setError('Failed to load alerts');
      console.error('Error loading alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle acknowledge alert
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const response = await acknowledgeAlert(alertId);
      if (response.success) {
        await loadAlerts(); // Reload alerts
      } else {
        setError(response.error || 'Failed to acknowledge alert');
      }
    } catch (err) {
      setError('Failed to acknowledge alert');
      console.error('Error acknowledging alert:', err);
    }
  };

  // Load alerts on mount and when filters change
  useEffect(() => {
    loadAlerts();
  }, [filters]);

  // Severity color helper
  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Status color helper
  const getStatusColor = (status: AlertStatus) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'acknowledged':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'suppressed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Alert Management"
          description="Monitor and manage system alerts and notifications"
          action={
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                icon={Filter}
              >
                Filters
              </Button>
              <RoleButton
                requiredRoles={['admin']}
                tooltipMessage="Only administrators can create alerts"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create Alert</span>
              </RoleButton>
            </div>
          }
        />

        {/* Error message */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center space-x-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        {showFilters && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Filters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowFilters(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading state */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading alerts...</p>
            </CardContent>
          </Card>
        )}

        {/* Alerts List */}
        {!loading && alerts.length > 0 && (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Bell className="w-5 h-5" />
                          <span>{alert.title}</span>
                        </CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(alert.status)}`}>
                          {alert.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{alert.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>#{alert.id}</p>
                      <p>{new Date(alert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                    {alert.assignedTo && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">Assigned to:</span>
                        <span className="font-medium">{alert.assignedTo}</span>
                      </div>
                    )}
                    {alert.tags && alert.tags.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {alert.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {alert.status === 'resolved' && alert.resolvedAt && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Resolved on {new Date(alert.resolvedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Alert Actions */}
                  {alert.status === 'open' && (
                    <div className="mt-4 flex items-center space-x-2">
                      <RoleButton
                        requiredRoles={['admin', 'manager']}
                        onClick={() => handleAcknowledgeAlert(alert.id)}
                        tooltipMessage="Manager+ role required to acknowledge alerts"
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                      >
                        Acknowledge
                      </RoleButton>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No alerts found */}
        {!loading && alerts.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
              <p className="text-gray-600 mb-4">
                {filters.status !== 'all' || filters.severity !== 'all' 
                  ? 'No alerts match the current filters.' 
                  : 'All systems are running smoothly.'
                }
              </p>
              <RoleButton
                requiredRoles={['admin']}
                tooltipMessage="Only administrators can create alerts"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>Create Alert</span>
              </RoleButton>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Protect with admin, manager, and viewer roles (same as dashboard)
export default withAuth(AlertsPage, ['admin', 'manager', 'viewer']);