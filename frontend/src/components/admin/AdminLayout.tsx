import React from 'react';
import { useLocation } from 'wouter';
import { Database, Users, UserPlus } from 'lucide-react';
import Header from '@/components/Header';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  currentUser?: {
    name: string;
    email: string;
    username: string;
  } | null;
  onLogout?: () => void;
  headerActions?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  title,
  description,
  currentUser,
  onLogout,
  headerActions
}) => {
  const [location, setLocation] = useLocation();

  const menuItems = [
    {
      name: 'Call Interface',
      path: '/admin/interface-tables',
      icon: Database,
      description: 'Manage interface tables'
    },
    {
      name: 'User Management',
      path: '/admin/users',
      icon: Users,
      description: 'Manage users and roles'
    },
    {
      name: 'Patient Management',
      path: '/admin/patients',
      icon: UserPlus,
      description: 'Manage patients by user'
    }
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <Header
        mode="admin"
        currentUser={currentUser}
        onLogout={onLogout || (() => {})}
        onLogoClick={() => setLocation('/')}
      />

      {/* Main Layout with Sidebar */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg flex-shrink-0">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            System Management
          </p>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className={`w-full flex items-center px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="text-sm">{item.name}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Back to Home */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setLocation('/')}
            className="w-full px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-8 py-6">
            {headerActions && (
              <div className="mb-6 flex justify-end">
                {headerActions}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AdminLayout;
