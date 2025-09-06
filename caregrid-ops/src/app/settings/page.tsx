'use client';

import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/Layout';
import { Settings, Save, RefreshCw, Shield, Bell, Database, Globe, Users, Key } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleRestricted, RoleButton } from '@/components/auth/RoleRestricted';

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  settings: SettingItem[];
}

interface SettingItem {
  key: string;
  label: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  value: any;
  options?: { label: string; value: any }[];
  required?: boolean;
  requiredRoles?: string[]; // Add role requirements
}

function SettingsPage() {
  const { state } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsSection[]>([
    {
      id: 'general',
      title: 'General Settings',
      description: 'Basic application configuration',
      icon: Settings,
      settings: [
        {
          key: 'app_name',
          label: 'Application Name',
          description: 'Display name for the operations dashboard',
          type: 'text',
          value: 'CareGrid Ops',
          required: true,
        },
        {
          key: 'refresh_interval',
          label: 'Auto Refresh Interval',
          description: 'How often to refresh dashboard data (seconds)',
          type: 'number',
          value: 30,
          required: true,
        },
        {
          key: 'maintenance_mode',
          label: 'Maintenance Mode',
          description: 'Enable maintenance mode to restrict access',
          type: 'boolean',
          value: false,
          requiredRoles: ['admin'],
        },
      ],
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Authentication and authorization configuration',
      icon: Shield,
      settings: [
        {
          key: 'session_timeout',
          label: 'Session Timeout',
          description: 'Automatic logout after inactivity (minutes)',
          type: 'number',
          value: 60,
          required: true,
        },
        {
          key: 'password_policy',
          label: 'Password Policy',
          description: 'Minimum password requirements',
          type: 'select',
          value: 'medium',
          options: [
            { label: 'Basic (6+ characters)', value: 'basic' },
            { label: 'Medium (8+ chars, mixed case)', value: 'medium' },
            { label: 'Strong (12+ chars, symbols)', value: 'strong' },
          ],
        },
        {
          key: 'two_factor_required',
          label: 'Require Two-Factor Authentication',
          description: 'Force all users to enable 2FA',
          type: 'boolean',
          value: false,
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Alert and notification configuration',
      icon: Bell,
      settings: [
        {
          key: 'email_notifications',
          label: 'Email Notifications',
          description: 'Send alerts via email',
          type: 'boolean',
          value: true,
        },
        {
          key: 'sms_notifications',
          label: 'SMS Notifications',
          description: 'Send critical alerts via SMS',
          type: 'boolean',
          value: false,
        },
        {
          key: 'notification_threshold',
          label: 'Alert Threshold',
          description: 'Minimum severity level for notifications',
          type: 'select',
          value: 'medium',
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Medium', value: 'medium' },
            { label: 'High', value: 'high' },
            { label: 'Critical Only', value: 'critical' },
          ],
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring Settings',
      description: 'Health check and monitoring configuration',
      icon: Database,
      settings: [
        {
          key: 'health_check_interval',
          label: 'Health Check Interval',
          description: 'How often to check service health (seconds)',
          type: 'number',
          value: 30,
          required: true,
        },
        {
          key: 'metrics_retention',
          label: 'Metrics Retention',
          description: 'How long to keep historical metrics (days)',
          type: 'number',
          value: 30,
          required: true,
        },
        {
          key: 'synthetic_tests',
          label: 'Enable Synthetic Tests',
          description: 'Run automated end-to-end tests',
          type: 'boolean',
          value: true,
        },
      ],
    },
    {
      id: 'api',
      title: 'API Settings',
      description: 'External API and integration configuration',
      icon: Globe,
      settings: [
        {
          key: 'api_timeout',
          label: 'API Timeout',
          description: 'Request timeout for external APIs (seconds)',
          type: 'number',
          value: 10,
          required: true,
        },
        {
          key: 'rate_limiting',
          label: 'Enable Rate Limiting',
          description: 'Limit API requests per user',
          type: 'boolean',
          value: true,
        },
        {
          key: 'api_version',
          label: 'API Version',
          description: 'CareGrid API version to use',
          type: 'select',
          value: 'v1',
          options: [
            { label: 'Version 1', value: 'v1' },
            { label: 'Version 2 (Beta)', value: 'v2' },
          ],
        },
      ],
    },
  ]);

  const handleSettingChange = (sectionId: string, settingKey: string, value: any) => {
    setSettings(prev => prev.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting => 
            setting.key === settingKey ? { ...setting, value } : setting
          ),
        };
      }
      return section;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call to save settings
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    // Show success message (in a real app, you'd use a toast notification)
    alert('Settings saved successfully!');
  };

  const renderSettingInput = (section: SettingsSection, setting: SettingItem) => {
    const value = setting.value;
    const onChange = (newValue: any) => handleSettingChange(section.id, setting.key, newValue);

    switch (setting.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={setting.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={setting.required}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
            />
            <div className={`relative w-11 h-6 rounded-full transition-colors ${
              value ? 'bg-blue-600' : 'bg-gray-300'
            }`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                value ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </div>
            <span className="ml-3 text-sm text-gray-700">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {setting.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Configure application settings and preferences"
          action={
            <RoleButton
              requiredRoles={['admin']}
              onClick={handleSave}
              disabled={isSaving}
              tooltipMessage="Only administrators can save settings"
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </RoleButton>
          }
        />

        {/* User Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-400" />
              <div>
                <CardTitle>Current User</CardTitle>
                <p className="text-sm text-gray-600">Logged in as {state.user?.name} ({state.user?.role})</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Settings Sections */}
        {settings.map((section) => {
          const IconComponent = section.icon;
          return (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <IconComponent className="w-5 h-5 text-gray-400" />
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {section.settings.map((setting) => (
                    <div key={setting.key} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {setting.label}
                          {setting.required && <span className="text-red-500 ml-1">*</span>}
                          {setting.requiredRoles && (
                            <span className="text-xs text-orange-600 ml-2">
                              (Admin only)
                            </span>
                          )}
                        </label>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <div>
                        {setting.requiredRoles ? (
                          <RoleRestricted 
                            requiredRoles={setting.requiredRoles as any}
                            disabled
                            showTooltip
                            tooltipMessage={`Requires ${setting.requiredRoles.join(' or ')} role`}
                          >
                            {renderSettingInput(section, setting)}
                          </RoleRestricted>
                        ) : (
                          renderSettingInput(section, setting)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* API Keys Section (Admin Only) */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-gray-400" />
              <div>
                <CardTitle>API Keys</CardTitle>
                <p className="text-sm text-gray-600">Manage API keys for external integrations</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Security Notice</span>
                </div>
                <p className="text-sm text-yellow-700 mt-1">
                  API keys provide full access to CareGrid services. Keep them secure and rotate regularly.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CareGrid Production API Key
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value="••••••••••••••••••••••••••••••••"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button variant="outline" size="sm">
                      Rotate
                    </Button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ops API Key
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="password"
                      value="••••••••••••••••••••••••••••••••"
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                    />
                    <Button variant="outline" size="sm">
                      Rotate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

// Protect with admin role only
export default withAuth(SettingsPage, ['admin']);