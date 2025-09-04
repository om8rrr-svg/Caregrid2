'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm, DemoCredentials } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const { state } = useAuth();

  useEffect(() => {
    if (state.isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [state.isAuthenticated, router]);

  if (state.isAuthenticated) {
    return null; // Prevent flash of login form
  }

  return (
    <div>
      <LoginForm />
      {process.env.NODE_ENV === 'development' && (
        <div className="max-w-md mx-auto mt-4">
          <DemoCredentials />
        </div>
      )}
    </div>
  );
}