'use client';

import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { AlertTriangle, Clock, User, CheckCircle, Plus } from 'lucide-react';
import { useState } from 'react';
import type { Incident, IncidentStatus, AlertSeverity } from '@/types';

// Mock incident data
const mockIncidents: Incident[] = [
  {
    id: 'INC-001',
    title: 'Database Connection Timeout',
    description: 'Multiple users reporting slow response times and connection timeouts to the primary database.',
    severity: 'high',
    status: 'investigating',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    assignedTo: 'john.doe@caregrid.com',
    affectedServices: ['Database', 'API Gateway'],
    timeline: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T10:30:00Z'),
        message: 'Incident created - Database connection timeouts reported',
        author: 'system',
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T10:35:00Z'),
        message: 'Assigned to Database Team',
        author: 'admin@caregrid.com',
      },
    ],
  },
  {
    id: 'INC-002',
    title: 'Payment Gateway Failure',
    description: 'Payment processing is failing for all transactions.',
    severity: 'critical',
    status: 'identified',
    createdAt: new Date('2024-01-15T09:15:00Z'),
    resolvedAt: undefined,
    assignedTo: 'jane.smith@caregrid.com',
    affectedServices: ['Payment Gateway', 'Booking System'],
    timeline: [
      {
        id: '1',
        timestamp: new Date('2024-01-15T09:15:00Z'),
        message: 'Critical incident - Payment gateway down',
        author: 'system',
      },
      {
        id: '2',
        timestamp: new Date('2024-01-15T09:20:00Z'),
        message: 'Root cause identified - Third-party API issue',
        author: 'jane.smith@caregrid.com',
      },
    ],
  },
];

function IncidentsPage() {
  const [incidents] = useState<Incident[]>(mockIncidents);

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

        {incidents.length === 0 && (
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