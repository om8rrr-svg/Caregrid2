'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace('/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [state.isAuthenticated, router]);

  // Loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center animate-pulse">
            <Activity className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">CareGrid Ops</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
