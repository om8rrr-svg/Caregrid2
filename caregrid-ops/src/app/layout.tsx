import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
export const metadata: Metadata = {
  title: 'CareGrid Ops - Operations Dashboard',
  description: 'CareGrid Operations and Control Plane Dashboard',
  keywords: ['caregrid', 'operations', 'dashboard', 'monitoring', 'health'],
  authors: [{ name: 'CareGrid Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Prevent indexing of ops dashboard
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased font-sans">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
