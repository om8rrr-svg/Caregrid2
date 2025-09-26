'use client';

import React, { useState } from 'react';
import { Layout, PageHeader } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Building, Plus, Edit, Trash2, Eye, EyeOff, CheckCircle, XCircle, Clock, Search, Mail, Phone, MapPin, Users } from 'lucide-react';

interface BusinessUser {
  id: string;
  businessName: string;
  email: string;
  phone: string;
  address: string;
  registrationNumber?: string;
  contactPerson: string;
  status: 'active' | 'pending' | 'suspended' | 'inactive';
  createdAt: Date;
  lastLogin?: Date;
  subscriptionPlan: 'basic' | 'premium' | 'enterprise';
  features: string[];
  loginCredentials: {
    username: string;
    temporaryPassword?: string;
    requiresPasswordChange: boolean;
  };
}

// Mock business users data
const mockBusinessUsers: BusinessUser[] = [
  {
    id: '1',
    businessName: 'HealthCare Plus Clinic',
    email: 'admin@healthcareplus.com',
    phone: '+44 20 7946 0958',
    address: '123 Medical Street, London, SW1A 1AA',
    registrationNumber: 'HC123456',
    contactPerson: 'Dr. Sarah Johnson',
    status: 'active',
    createdAt: new Date('2024-01-10T09:00:00Z'),
    lastLogin: new Date('2024-01-15T14:30:00Z'),
    subscriptionPlan: 'premium',
    features: ['appointment_booking', 'patient_records', 'billing', 'analytics'],
    loginCredentials: {
      username: 'healthcareplus_admin',
      requiresPasswordChange: false
    }
  },
  {
    id: '2',
    businessName: 'City Medical Center',
    email: 'contact@citymedical.co.uk',
    phone: '+44 161 496 0123',
    address: '456 Health Avenue, Manchester, M1 1AA',
    registrationNumber: 'CM789012',
    contactPerson: 'James Wilson',
    status: 'pending',
    createdAt: new Date('2024-01-14T16:20:00Z'),
    subscriptionPlan: 'basic',
    features: ['appointment_booking', 'patient_records'],
    loginCredentials: {
      username: 'citymedical_admin',
      temporaryPassword: 'TempPass123!',
      requiresPasswordChange: true
    }
  },
  {
    id: '3',
    businessName: 'Wellness Clinic Group',
    email: 'info@wellnessgroup.com',
    phone: '+44 113 496 0789',
    address: '789 Wellness Road, Leeds, LS1 1AA',
    contactPerson: 'Emma Thompson',
    status: 'suspended',
    createdAt: new Date('2024-01-05T11:15:00Z'),
    lastLogin: new Date('2024-01-12T09:45:00Z'),
    subscriptionPlan: 'enterprise',
    features: ['appointment_booking', 'patient_records', 'billing', 'analytics', 'multi_location', 'api_access'],
    loginCredentials: {
      username: 'wellness_admin',
      requiresPasswordChange: false
    }
  }
];

function BusinessManagementPage() {
  const [businesses, setBusinesses] = useState<BusinessUser[]>(mockBusinessUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'pending' | 'suspended' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState<string | null>(null);
  const [newBusiness, setNewBusiness] = useState({
    businessName: '',
    email: '',
    phone: '',
    address: '',
    registrationNumber: '',
    contactPerson: '',
    subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise'
  });

  const filteredBusinesses = businesses.filter(business => {
    const matchesSearch = 
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      business.contactPerson.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || business.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBusiness = () => {
    const username = newBusiness.businessName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_admin';
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
    
    const business: BusinessUser = {
      id: Date.now().toString(),
      ...newBusiness,
      status: 'pending',
      createdAt: new Date(),
      features: getFeaturesByPlan(newBusiness.subscriptionPlan),
      loginCredentials: {
        username,
        temporaryPassword: tempPassword,
        requiresPasswordChange: true
      }
    };
    
    setBusinesses([business, ...businesses]);
    setShowCreateModal(false);
    setNewBusiness({
      businessName: '',
      email: '',
      phone: '',
      address: '',
      registrationNumber: '',
      contactPerson: '',
      subscriptionPlan: 'basic'
    });
  };

  const getFeaturesByPlan = (plan: string): string[] => {
    switch (plan) {
      case 'basic': return ['appointment_booking', 'patient_records'];
      case 'premium': return ['appointment_booking', 'patient_records', 'billing', 'analytics'];
      case 'enterprise': return ['appointment_booking', 'patient_records', 'billing', 'analytics', 'multi_location', 'api_access'];
      default: return [];
    }
  };

  const handleStatusChange = (businessId: string, newStatus: BusinessUser['status']) => {
    setBusinesses(businesses.map(business => 
      business.id === businessId 
        ? { ...business, status: newStatus }
        : business
    ));
  };

  const handleGenerateNewPassword = (businessId: string) => {
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
    setBusinesses(businesses.map(business => 
      business.id === businessId 
        ? { 
            ...business, 
            loginCredentials: {
              ...business.loginCredentials,
              temporaryPassword: tempPassword,
              requiresPasswordChange: true
            }
          }
        : business
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    total: businesses.length,
    active: businesses.filter(b => b.status === 'active').length,
    pending: businesses.filter(b => b.status === 'pending').length,
    suspended: businesses.filter(b => b.status === 'suspended').length,
  };

  return (
    <Layout>
      <PageHeader
        title="Business Management"
        description="Manage business accounts, create live logins, and monitor business users"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Business
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Businesses</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
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
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            <div className="text-sm text-gray-600">Suspended</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search businesses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value as any)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Business Table */}
      <Card>
        <CardHeader>
          <CardTitle>Business Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Business</th>
                  <th className="text-left py-3 px-4">Contact</th>
                  <th className="text-left py-3 px-4">Plan</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Last Login</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBusinesses.map((business) => (
                  <tr key={business.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-medium">{business.businessName}</div>
                          <div className="text-sm text-gray-600">{business.registrationNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Users className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{business.contactPerson}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{business.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-gray-600">{business.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPlanBadge(business.subscriptionPlan)}`}>
                        {business.subscriptionPlan}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(business.status)}`}>
                        {business.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {business.lastLogin ? business.lastLogin.toLocaleString() : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCredentialsModal(business.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {business.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(business.id, 'active')}
                          >
                            Activate
                          </Button>
                        )}
                        {business.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(business.id, 'suspended')}
                          >
                            Suspend
                          </Button>
                        )}
                        {business.status === 'suspended' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(business.id, 'active')}
                          >
                            Reactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBusinesses.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No businesses found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Business Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Create New Business Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={newBusiness.businessName}
                  onChange={(e) => setNewBusiness({...newBusiness, businessName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person *
                </label>
                <input
                  type="text"
                  value={newBusiness.contactPerson}
                  onChange={(e) => setNewBusiness({...newBusiness, contactPerson: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newBusiness.email}
                  onChange={(e) => setNewBusiness({...newBusiness, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={newBusiness.phone}
                  onChange={(e) => setNewBusiness({...newBusiness, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Address *
                </label>
                <input
                  type="text"
                  value={newBusiness.address}
                  onChange={(e) => setNewBusiness({...newBusiness, address: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={newBusiness.registrationNumber}
                  onChange={(e) => setNewBusiness({...newBusiness, registrationNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan *
                </label>
                <select
                  value={newBusiness.subscriptionPlan}
                  onChange={(e) => setNewBusiness({...newBusiness, subscriptionPlan: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basic">Basic</option>
                  <option value="premium">Premium</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateBusiness}
                disabled={!newBusiness.businessName || !newBusiness.email || !newBusiness.contactPerson}
                className="flex-1"
              >
                Create Business Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Login Credentials Modal */}
      {showCredentialsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            {(() => {
              const business = businesses.find(b => b.id === showCredentialsModal);
              if (!business) return null;
              
              return (
                <>
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Eye className="w-5 h-5 mr-2" />
                    Login Credentials
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Name
                      </label>
                      <div className="text-sm font-medium">{business.businessName}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <div className="bg-gray-50 p-2 rounded border font-mono text-sm">
                        {business.loginCredentials.username}
                      </div>
                    </div>
                    {business.loginCredentials.temporaryPassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Temporary Password
                        </label>
                        <div className="bg-yellow-50 p-2 rounded border font-mono text-sm">
                          {business.loginCredentials.temporaryPassword}
                        </div>
                        <div className="text-xs text-yellow-600 mt-1">
                          User must change password on first login
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Login URL
                      </label>
                      <div className="bg-blue-50 p-2 rounded border font-mono text-sm">
                        https://caregrid.co.uk/business/login
                      </div>
                    </div>
                    {business.loginCredentials.requiresPasswordChange && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm text-orange-700 font-medium">
                            Password change required on first login
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => handleGenerateNewPassword(business.id)}
                      className="flex-1"
                    >
                      Generate New Password
                    </Button>
                    <Button
                      onClick={() => setShowCredentialsModal(null)}
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </Layout>
  );
}

export default withAuth(BusinessManagementPage, ['admin', 'manager']);