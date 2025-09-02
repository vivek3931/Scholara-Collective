import React from 'react';
import { Menu, X, Sun, Moon, Bell } from 'lucide-react';

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/admin',
  },
  {
    name: 'Users',
    path: '/admin/users',
  },
  {
    name: 'Resources',
    path: '/admin/resources',
  },
  {
    name: 'Settings',
    path: '/admin/settings',
  }
];

const AdminHeader = ({ isSidebarOpen, toggleSidebar, toggleDarkMode, isDarkMode, user, location }) => {
  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };
  
  const currentPageName = navigationItems.find(item => isActiveRoute(item.path))?.name || 'Admin Panel';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-charcoal/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {currentPageName}
            </h2>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200" aria-label="Notifications">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200 transform active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200/50 dark:border-charcoal/50">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {user?.username || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;