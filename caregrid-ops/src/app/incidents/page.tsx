'use client';

import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { AlertTriangle, Clock, User, CheckCircle, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Incident, IncidentStatus, AlertSeverity } from '@/types';

// Mock data removed - incidents will be fetched from real API
// const mockIncidents = [];

function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from an API
      // const response = await fetch('/api/incidents');
      // const data = await response.json();
      // setIncidents(data);
      
      // For now, we'll show empty state
      setIncidents([]);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getStatusColor = (status: IncidentStatus) => {
    switch (status) {
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'identified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'monitoring':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Incident Management"
          description="Track and manage system incidents and outages"
          action={
            <Button icon={Plus}>
              Create Incident
            </Button>
          }
        />

        {/* Incidents List */}
        {isLoading ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">Loading incidents...</div>
            </CardContent>
          </Card>
        ) : incidents.length > 0 ? (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Card key={incident.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">{incident.title}</CardTitle>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(incident.severity)}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{incident.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      <p>#{incident.id}</p>
                      <p>{incident.createdAt.toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Assigned to:</span>
                      <span className="font-medium">{incident.assignedTo}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium">{incident.createdAt.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Services:</span>
                      <span className="font-medium">{incident.affectedServices.join(', ')}</span>
                    </div>
                  </div>
                  
                  {incident.status === 'resolved' && incident.resolvedAt && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">Resolved on {incident.resolvedAt.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents found</h3>
              <p className="text-gray-600 mb-4">All systems are running smoothly.</p>
              <Button icon={Plus}>
                Create Incident
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

// Protect with admin and manager roles
export default withAuth(IncidentsPage, ['admin', 'manager']);