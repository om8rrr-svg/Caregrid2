'use client';

import { Layout, PageHeader } from '@/components/layout/Layout';
import FeatureFlagsManager from '@/components/FeatureFlags/FeatureFlagsManager';
import { withAuth } from '@/contexts/AuthContext';
import { Flag } from 'lucide-react';

function FeatureFlagsPage() {
  return (
    <Layout>
      <PageHeader
        title="Feature Flags & A/B Testing"
        description="Manage feature rollouts and run experiments"
        breadcrumbs={[
          { name: 'Dashboard', href: '/dashboard' },
          { name: 'Feature Flags' }
        ]}
      />
      <div className="space-y-6">
        <FeatureFlagsManager />
      </div>
    </Layout>
  );
}

// Protect the feature flags page with authentication
export default withAuth(FeatureFlagsPage, ['admin', 'manager']);