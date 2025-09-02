import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Home, X } from 'lucide-react';
import logo from '../../assets/logo.svg'

const navigationItems = [
  {
    name: 'Dashboard',
    path: '/admin',
    icon: LayoutDashboard,
    description: 'Overview and analytics'
  },
  {
    name: 'Users',
    path: '/admin/users',
    icon: Users,
    description: 'Manage user accounts'
  },
  {
    name: 'Resources',
    path: '/admin/resources',
    icon: FileText,
    description: 'Manage uploaded content'
  },
  {
    name: 'Settings',
    path: '/admin/settings',
    icon: Settings,
    description: 'System configuration'
  }
];

const AdminSidebar = ({ isSidebarOpen, toggleSidebar, handleLogout, location, mobileBreakpoint }) => {
  const navigate = useNavigate();
  const isMobile = window.innerWidth < mobileBreakpoint;

  const handleBackToMain = () => {
    navigate('/');
  };

  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ease-in-out"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 flex flex-col top-0 h-full w-64 bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-xl border-r border-gray-200/50 dark:border-charcoal/50 z-50
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-charcoal/50">
          <div className="flex flex-col">
            <div className="h-10 w-full"> 
              <img src={logo} alt="Company Logo" className="h-full object-contain max-w-full" style={{ width: 'auto' }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Panel</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) toggleSidebar();
                }}
                className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 group relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-400 to-yellow-500"></span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-charcoal/50 space-y-2">
          <button
            onClick={handleBackToMain}
            className="w-full flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-50/80 dark:hover:bg-gray-700/50 rounded-lg transition-colors duration-200"
          >
            <Home className="w-5 h-5 mr-3" />
            <span>Back to Main Site</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;