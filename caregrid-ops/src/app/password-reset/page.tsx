'use client';

import React, { useState } from 'react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, Key, Users, Building, CheckCircle, AlertCircle, Search } from 'lucide-react';

interface PasswordResetRequest {
  id: string;
  email: string;
  userType: 'customer' | 'business';
  requestedAt: Date;
  status: 'pending' | 'sent' | 'completed' | 'expired';
  completedAt?: Date;
}

// Mock password reset requests
const mockResetRequests: PasswordResetRequest[] = [
  {
    id: '1',
    email: 'patient@example.com',
    userType: 'customer',
    requestedAt: new Date('2024-01-15T10:30:00Z'),
    status: 'sent',
  },
  {
    id: '2',
    email: 'clinic@healthcenter.com',
    userType: 'business',
    requestedAt: new Date('2024-01-15T09:15:00Z'),
    status: 'completed',
    completedAt: new Date('2024-01-15T09:45:00Z'),
  },
  {
    id: '3',
    email: 'user@caregrid.com',
    userType: 'customer',
    requestedAt: new Date('2024-01-14T16:20:00Z'),
    status: 'expired',
  },
];

function PasswordResetPage() {
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>(mockResetRequests);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'customer' | 'business'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'sent' | 'completed' | 'expired'>('all');
  const [showManualReset, setShowManualReset] = useState(false);
  const [manualResetEmail, setManualResetEmail] = useState('');
  const [manualResetType, setManualResetType] = useState<'customer' | 'business'>('customer');

  const filteredRequests = resetRequests.filter(request => {
    const matchesSearch = request.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || request.userType === selectedType;
    const matchesStatus = selectedStatus === 'all' || request.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleManualReset = () => {
    const newRequest: PasswordResetRequest = {
      id: Date.now().toString(),
      email: manualResetEmail,
      userType: manualResetType,
      requestedAt: new Date(),
      status: 'sent',
    };
    setResetRequests([newRequest, ...resetRequests]);
    setShowManualReset(false);
    setManualResetEmail('');
  };

  const handleResendReset = (requestId: string) => {
    setResetRequests(resetRequests.map(request => 
      request.id === requestId 
        ? { ...request, status: 'sent' as const, requestedAt: new Date() }
        : request
    ));
  };

  const handleMarkCompleted = (requestId: string) => {
    setResetRequests(resetRequests.map(request => 
      request.id === requestId 
        ? { ...request, status: 'completed' as const, completedAt: new Date() }
        : request
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'business' ? Building : Users;
  };

  const stats = {
    total: resetRequests.length,
    pending: resetRequests.filter(r => r.status === 'pending').length,
    sent: resetRequests.filter(r => r.status === 'sent').length,
    completed: resetRequests.filter(r => r.status === 'completed').length,
    expired: resetRequests.filter(r => r.status === 'expired').length,
  };

  return (
    <Layout>
      <PageHeader
        title="Password Reset Management"
        description="Manage password reset requests for customers and business users"
        action={
          <Button onClick={() => setShowManualReset(true)}>
            <Key className="h-4 w-4 mr-2" />
            Manual Reset
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
            <div className="text-sm text-gray-600">Sent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <div className="text-sm text-gray-600">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="customer">Customers</option>
          <option value="business">Business</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="sent">Sent</option>
          <option value="completed">Completed</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Reset Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Password Reset Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Requested</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => {
                  const TypeIcon = getTypeIcon(request.userType);
                  return (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{request.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <TypeIcon className="w-4 h-4 text-gray-400" />
                          <span className="capitalize">{request.userType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {request.requestedAt.toLocaleString()}
                        {request.completedAt && (
                          <div className="text-xs text-green-600">
                            Completed: {request.completedAt.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {(request.status === 'pending' || request.status === 'expired') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendReset(request.id)}
                            >
                              Send Reset
                            </Button>
                          )}
                          {request.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkCompleted(request.id)}
                            >
                              Mark Complete
                            </Button>
                          )}
                          {request.status === 'sent' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendReset(request.id)}
                            >
                              Resend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No password reset requests found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Manual Reset Modal */}
      {showManualReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Key className="w-5 h-5 mr-2" />
              Manual Password Reset
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={manualResetEmail}
                  onChange={(e) => setManualResetEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter user email address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  User Type
                </label>
                <select
                  value={manualResetType}
                  onChange={(e) => setManualResetType(e.target.value as 'customer' | 'business')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="customer">Customer</option>
                  <option value="business">Business</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    This will send a password reset email to the specified address. 
                    Make sure the email address is correct before proceeding.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowManualReset(false);
                  setManualResetEmail('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleManualReset}
                disabled={!manualResetEmail}
                className="flex-1"
              >
                Send Reset Email
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default withAuth(PasswordResetPage, ['admin', 'manager']);