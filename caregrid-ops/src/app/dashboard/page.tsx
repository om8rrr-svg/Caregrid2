'use client';

import { Layout } from '@/components/layout/Layout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { withAuth } from '@/contexts/AuthContext';

function DashboardPage() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

// Protect the dashboard page with authentication
export default withAuth(DashboardPage);