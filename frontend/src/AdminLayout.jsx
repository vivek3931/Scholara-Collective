import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Home,
  Shield,
  Bell
} from 'lucide-react';
import { useAuth } from './context/AuthContext/AuthContext';
import logo from '../src/assets/logo.svg'

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const wasMobileRef = useRef(window.innerWidth < 1024);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

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

  // Update theme
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Handle window resize for sidebar behavior and mobile detection
  useEffect(() => {
    const mobileBreakpoint = 1024;

    const handleResize = () => {
      const currentlyIsMobile = window.innerWidth < mobileBreakpoint;
      setIsMobile(currentlyIsMobile);

      if (currentlyIsMobile !== wasMobileRef.current) {
        setIsSidebarOpen(!currentlyIsMobile);
      }
      wasMobileRef.current = currentlyIsMobile;
    };

    setIsMobile(window.innerWidth < mobileBreakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

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
    <div className="min-h-screen bg-platinum/95 dark:bg-onyx/95 transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-md z-40 transition-opacity duration-300 ease-in-out"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 flex flex-col  top-0 h-full w-64 bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-xl border-r border-gray-200/50 dark:border-charcoal/50 z-50
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{
          willChange: 'transform',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200/50 dark:border-charcoal/50">
            
            <div className="flex flex-col ">
              {/* Adjusted logo container and image styling */}
              <div className="h-10 w-full"> 
                <img 
                  src={logo} 
                  alt="Company Logo" 
                  className="h-full object-contain max-w-full" // Added max-w to prevent excessive width
                  style={{ width: 'auto' }} // Ensure natural width
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Admin Panel</p>
            </div>
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200"
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
                  if (isMobile) setIsSidebarOpen(false);
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

      {/* Main Content Area */}
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'
        }`}
        style={{
          willChange: 'margin-left',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)', // Smoother easing
        }}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-sm border-b border-gray-200/50 dark:border-charcoal/50">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>
              <div>
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {navigationItems.find(item => isActiveRoute(item.path))?.name || 'Admin Panel'}
                </h2>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200 transform active:scale-95"
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

        {/* Page Content */}
        <main className="p-2 lg:p-5 bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx min-h-screen transition-colors duration-300">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
