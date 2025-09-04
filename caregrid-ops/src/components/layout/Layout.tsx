'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { UserRole } from '@/types';
import {
  LayoutDashboard,
  Activity,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Users,
  Flag,
  Wrench,
  Menu,
  X,
  LogOut,
  User,
  Bell,
  Search,
} from 'lucide-react';

// Navigation Items
const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and key metrics',
  },
  {
    name: 'Health Monitoring',
    href: '/health',
    icon: Activity,
    description: 'System health and uptime',
  },
  {
    name: 'Monitoring',
    href: '/monitoring',
    icon: Activity,
    description: 'API monitoring and circuit breakers',
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: AlertTriangle,
    description: 'Active alerts and notifications',
  },
  {
    name: 'Incidents',
    href: '/incidents',
    icon: FileText,
    description: 'Incident tracking and management',
  },
  {
    name: 'Metrics',
    href: '/metrics',
    icon: BarChart3,
    description: 'Performance and business metrics',
  },
  {
    name: 'Feature Flags',
    href: '/feature-flags',
    icon: Flag,
    description: 'Feature toggle management',
    roles: ['admin', 'manager'] as UserRole[],
  },
  {
    name: 'Maintenance',
    href: '/maintenance',
    icon: Wrench,
    description: 'Maintenance mode controls',
    roles: ['admin'] as UserRole[],
  },
  {
    name: 'User Management',
    href: '/users',
    icon: Users,
    description: 'Manage ops team access',
    roles: ['admin'] as UserRole[],
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Application configuration',
  },
];

// Layout Props
interface LayoutProps {
  children: React.ReactNode;
}

// Main Layout Component
export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { state, logout, hasAnyRole } = useAuth();

  // Filter navigation items based on user role
  const filteredNavigation = navigationItems.filter(item => {
    if (!item.roles) return true;
    return hasAnyRole(item.roles);
  });

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">CareGrid Ops</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group',
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'w-5 h-5 mr-3 transition-colors',
                      isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 group-hover:text-gray-600">
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {state.user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {state.user?.role || 'Role'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleLogout}
              icon={LogOut}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              {/* Search bar */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>

              {/* User menu */}
              <div className="flex items-center space-x-3">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {state.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {state.user?.role || 'Role'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  breadcrumbs?: { name: string; href?: string }[];
}

export function PageHeader({ title, description, action, breadcrumbs }: PageHeaderProps) {
  return (
    <div className="mb-8">
      {breadcrumbs && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-400">/</span>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-sm text-gray-900">{crumb.name}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-2 text-gray-600">{description}</p>
          )}
        </div>
        {action && (
          <div className="flex items-center space-x-3">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}