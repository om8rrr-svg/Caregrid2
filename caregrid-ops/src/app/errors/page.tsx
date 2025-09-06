'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Bug, Globe, Terminal, RefreshCw, Filter, Search } from 'lucide-react';

interface ErrorReport {
  id: string;
  timestamp: string;
  type: 'javascript' | 'api' | 'console' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

interface ErrorStats {
  total: number;
  filtered: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: {
    javascript: number;
    api: number;
    console: number;
    network: number;
  };
  lastHour: number;
}

const ErrorsPage: React.FC = () => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedError, setSelectedError] = useState<ErrorReport | null>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadErrors = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('limit', '100');
      
      if (severityFilter) {
        params.append('severity', severityFilter);
      }
      
      if (typeFilter) {
        params.append('type', typeFilter);
      }
      
      const response = await fetch(`/api/errors?${params.toString()}`, {
        headers: {
          'Authorization': 'Bearer demo-token' // Replace with actual auth
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setErrors(data.errors || []);
      setStats(data.stats || null);
      setError(null);
    } catch (err) {
      console.error('Failed to load errors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load errors');
    } finally {
      setLoading(false);
    }
  }, [severityFilter, typeFilter]);

  useEffect(() => {
    loadErrors();
  }, [loadErrors]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadErrors();
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [loadErrors, autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'javascript': return <Bug className="w-4 h-4" />;
      case 'api': return <Globe className="w-4 h-4" />;
      case 'console': return <Terminal className="w-4 h-4" />;
      case 'network': return <AlertTriangle className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  const filteredErrors = errors.filter(error => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        error.message.toLowerCase().includes(query) ||
        error.url.toLowerCase().includes(query) ||
        (error.stack && error.stack.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const truncateMessage = (message: string, maxLength: number = 100) => {
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  if (loading && errors.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Loading error reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Error Monitoring</h1>
          <p className="text-gray-600 mt-1">Real-time error tracking for CareGrid application</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={loadErrors} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Error loading data: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.lastHour} in last hour</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Critical Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.bySeverity.critical}</div>
              <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">JavaScript Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.byType.javascript}</div>
              <p className="text-xs text-gray-500 mt-1">Client-side issues</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">API Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byType.api}</div>
              <p className="text-xs text-gray-500 mt-1">Server communication</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Severity</label>
              <select
                value={severityFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSeverityFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTypeFilter(e.target.value)}
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All types</option>
                <option value="javascript">JavaScript</option>
                <option value="api">API</option>
                <option value="console">Console</option>
                <option value="network">Network</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search errors..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10 flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors ({filteredErrors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredErrors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bug className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No errors found matching your criteria.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((errorReport) => (
                <div
                  key={errorReport.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedError(errorReport)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getTypeIcon(errorReport.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(errorReport.severity)}>
                            {errorReport.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">{errorReport.type}</Badge>
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(errorReport.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          {truncateMessage(errorReport.message)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {errorReport.url}
                        </p>
                        {errorReport.userId && (
                          <p className="text-xs text-blue-600 mt-1">
                            User: {errorReport.userId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Error Details</h2>
                <Button
                  onClick={() => setSelectedError(null)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Severity</label>
                    <Badge className={`${getSeverityColor(selectedError.severity)} mt-1`}>
                      {selectedError.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Type</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getTypeIcon(selectedError.type)}
                      <span className="text-sm">{selectedError.type}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Timestamp</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatTimestamp(selectedError.timestamp)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">URL</label>
                    <p className="text-sm text-gray-900 mt-1 break-all">
                      {selectedError.url}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded border">
                    {selectedError.message}
                  </p>
                </div>
                
                {selectedError.stack && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Stack Trace</label>
                    <pre className="text-xs text-gray-900 mt-1 p-3 bg-gray-50 rounded border overflow-x-auto whitespace-pre-wrap">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}
                
                {selectedError.metadata && Object.keys(selectedError.metadata).length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Metadata</label>
                    <pre className="text-xs text-gray-900 mt-1 p-3 bg-gray-50 rounded border overflow-x-auto">
                      {JSON.stringify(selectedError.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorsPage;