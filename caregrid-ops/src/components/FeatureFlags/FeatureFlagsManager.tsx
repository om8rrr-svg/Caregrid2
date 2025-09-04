'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Flag, Settings, TrendingUp, Plus, Eye } from 'lucide-react';

interface FeatureFlag {
  id: number;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetAudience: Record<string, any>;
  conditions: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface Experiment {
  id: number;
  name: string;
  description: string;
  featureFlagId?: number;
  variants: Array<{ name: string; weight: number }>;
  trafficAllocation: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  successMetrics: string[];
  createdAt: string;
  updatedAt: string;
}

interface Analytics {
  flagUsage: Record<string, number>;
  experimentResults: Record<string, { exposures: number; conversions: number }>;
  conversionEvents: Record<string, { count: number; totalValue: number }>;
}

// Simple API client for demo purposes
const apiClient = {
  get: async (url: string) => {
    // Mock API responses for demo
    if (url.includes('/flags')) {
      return {
        data: {
          data: [
            {
              id: 1,
              name: 'new_dashboard_ui',
              description: 'New dashboard user interface with improved UX',
              enabled: false,
              rolloutPercentage: 0,
              targetAudience: {},
              conditions: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 2,
              name: 'enhanced_monitoring',
              description: 'Enhanced monitoring capabilities with real-time alerts',
              enabled: true,
              rolloutPercentage: 25,
              targetAudience: { role: 'admin' },
              conditions: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ] as FeatureFlag[]
        }
      };
    }
    if (url.includes('/experiments')) {
      return {
        data: {
          data: [
            {
              id: 1,
              name: 'dashboard_layout_test',
              description: 'Test different dashboard layouts for user engagement',
              featureFlagId: 1,
              variants: [{ name: 'control', weight: 50 }, { name: 'variant_a', weight: 50 }],
              trafficAllocation: 100,
              status: 'active' as const,
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              successMetrics: ['page_views', 'time_on_page'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ] as Experiment[]
        }
      };
    }
    if (url.includes('/analytics')) {
      return {
        data: {
          data: {
            flagUsage: {
              'new_dashboard_ui:enabled': 150,
              'enhanced_monitoring:enabled': 300
            },
            experimentResults: {
              'dashboard_layout_test:control': { exposures: 1000, conversions: 50 },
              'dashboard_layout_test:variant_a': { exposures: 1000, conversions: 75 }
            },
            conversionEvents: {
              'page_view': { count: 5000, totalValue: 5000 },
              'button_click': { count: 1200, totalValue: 1200 }
            }
          } as Analytics
        }
      };
    }
    return { data: { data: [] } };
  },
  put: async (url: string, data: any) => ({ data: { success: true } }),
  post: async (url: string, data: any) => ({ data: { success: true } })
};

const FeatureFlagsManager: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'flags' | 'experiments' | 'analytics'>('flags');
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [flagsResponse, experimentsResponse, analyticsResponse] = await Promise.all([
        apiClient.get('/api/feature-flags/admin/flags'),
        apiClient.get('/api/feature-flags/admin/experiments'),
        apiClient.get('/api/feature-flags/admin/analytics')
      ]);

      setFlags(flagsResponse.data.data as FeatureFlag[]);
      setExperiments(experimentsResponse.data.data as Experiment[]);
      setAnalytics(analyticsResponse.data.data as Analytics);
    } catch (error) {
      console.error('Error loading feature flags data:', error);
      setMessage({ type: 'error', text: 'Failed to load feature flags data' });
    } finally {
      setLoading(false);
    }
  };

  const updateFlag = async (name: string, updates: Partial<FeatureFlag>) => {
    try {
      await apiClient.put(`/api/feature-flags/admin/flags/${name}`, updates);
      await loadData();
      setMessage({ type: 'success', text: 'Feature flag updated successfully' });
    } catch (error) {
      console.error('Error updating flag:', error);
      setMessage({ type: 'error', text: 'Failed to update feature flag' });
    }
  };

  const updateExperimentStatus = async (name: string, status: string) => {
    try {
      await apiClient.put(`/api/feature-flags/admin/experiments/${name}/status`, { status });
      await loadData();
      setMessage({ type: 'success', text: 'Experiment status updated successfully' });
    } catch (error) {
      console.error('Error updating experiment status:', error);
      setMessage({ type: 'error', text: 'Failed to update experiment status' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'paused': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      case 'archived': return 'bg-gray-500';
      default: return 'bg-gray-400';
    }
  };

  const calculateConversionRate = (experimentName: string, variant: string) => {
    const key = `${experimentName}:${variant}`;
    const result = analytics?.experimentResults[key];
    if (!result || result.exposures === 0) return 0;
    return ((result.conversions / result.exposures) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Flags & A/B Testing</h1>
          <p className="text-gray-600">
            Manage feature rollouts and run experiments
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setMessage({ type: 'success', text: 'Create flag feature coming soon!' })}>
            <Plus className="h-4 w-4 mr-2" />
            New Flag
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setMessage({ type: 'success', text: 'Create experiment feature coming soon!' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Experiment
          </Button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
          <button 
            onClick={() => setMessage(null)}
            className="ml-4 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'flags', label: 'Feature Flags', icon: Flag },
            { key: 'experiments', label: 'A/B Experiments', icon: TrendingUp },
            { key: 'analytics', label: 'Analytics', icon: Eye }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Feature Flags Tab */}
      {activeTab === 'flags' && (
        <div className="space-y-4">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <Flag className="h-4 w-4" />
                  <CardTitle className="text-base">{flag.name}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    flag.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={flag.enabled}
                      onChange={(e) => updateFlag(flag.name, { enabled: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFlag(flag)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{flag.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span>Rollout: {flag.rolloutPercentage}%</span>
                  <span className="text-gray-500">
                    Updated {new Date(flag.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {flag.rolloutPercentage > 0 && flag.rolloutPercentage < 100 && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${flag.rolloutPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Experiments Tab */}
      {activeTab === 'experiments' && (
        <div className="space-y-4">
          {experiments.map((experiment) => (
            <Card key={experiment.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <CardTitle className="text-base">{experiment.name}</CardTitle>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${
                    getStatusColor(experiment.status)
                  }`}>
                    {experiment.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={experiment.status}
                    onChange={(e) => updateExperimentStatus(experiment.name, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">{experiment.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Variants:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {experiment.variants.map((variant, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {variant.name} ({variant.weight}%)
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium">Traffic:</span> {experiment.trafficAllocation}%
                    <br />
                    <span className="font-medium">Metrics:</span> {experiment.successMetrics.join(', ')}
                  </div>
                </div>
                {experiment.startDate && experiment.endDate && (
                  <div className="mt-2 text-sm text-gray-500">
                    {new Date(experiment.startDate).toLocaleDateString()} - {new Date(experiment.endDate).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Flag Usage</CardTitle>
              <CardDescription>Feature flag activation statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.flagUsage).map(([key, count]) => {
                  const [flagName, status] = key.split(':');
                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-sm">
                        {flagName} ({status})
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Experiment Results</CardTitle>
              <CardDescription>A/B test performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analytics.experimentResults).map(([key, result]) => {
                  const [experimentName, variant] = key.split(':');
                  const conversionRate = calculateConversionRate(experimentName, variant);
                  return (
                    <div key={key} className="border rounded-lg p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{experimentName} - {variant}</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {conversionRate}% conversion
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>Exposures: {result.exposures}</div>
                        <div>Conversions: {result.conversions}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Conversion Events</CardTitle>
              <CardDescription>User action tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(analytics.conversionEvents).map(([eventName, event]) => (
                  <div key={eventName} className="flex justify-between items-center">
                    <span className="text-sm">{eventName}</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">{event.count} events</span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">Value: {event.totalValue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Flag Details Modal */}
      {selectedFlag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Configure {selectedFlag.name}</h2>
                <Button variant="outline" onClick={() => setSelectedFlag(null)}>×</Button>
              </div>
              <p className="text-gray-600 mb-4">{selectedFlag.description}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rollout Percentage: {selectedFlag.rolloutPercentage}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedFlag.rolloutPercentage}
                    onChange={(e) => {
                      const newFlag = { ...selectedFlag, rolloutPercentage: parseInt(e.target.value) };
                      setSelectedFlag(newFlag);
                    }}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience (JSON)</label>
                  <textarea
                    value={JSON.stringify(selectedFlag.targetAudience, null, 2)}
                    onChange={(e) => {
                      try {
                        const targetAudience = JSON.parse(e.target.value);
                        setSelectedFlag({ ...selectedFlag, targetAudience });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Conditions (JSON)</label>
                  <textarea
                    value={JSON.stringify(selectedFlag.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        const conditions = JSON.parse(e.target.value);
                        setSelectedFlag({ ...selectedFlag, conditions });
                      } catch (error) {
                        // Invalid JSON, ignore
                      }
                    }}
                    rows={4}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setSelectedFlag(null)}>Cancel</Button>
                <Button onClick={() => {
                  updateFlag(selectedFlag.name, {
                    rolloutPercentage: selectedFlag.rolloutPercentage,
                    targetAudience: selectedFlag.targetAudience,
                    conditions: selectedFlag.conditions
                  });
                  setSelectedFlag(null);
                }}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsManager;