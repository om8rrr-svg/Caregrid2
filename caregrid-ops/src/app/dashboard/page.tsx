'use client';

import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { withAuth } from '@/contexts/AuthContext';
import { runHealth } from '@/lib/api/ops';

function DashboardPage() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function onRunHealth() {
    setLoading(true);
    try { setHealth(await runHealth()); }
    finally { setLoading(false); }
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={onRunHealth} 
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Health'}
          </button>
        </div>
        
        {health && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Health Check Results</h2>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(health, null, 2)}
            </pre>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Dashboard</h2>
          <p className="text-gray-600">
            Use the "Run Health" button above to check the system health status.
          </p>
        </div>
      </div>
    </Layout>
  );
}

// Protect the dashboard page with authentication
export default withAuth(DashboardPage);