import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Sun, Moon, Bell, Check, AlertCircle, UserPlus, Flag, Eye, EyeOff } from 'lucide-react';

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

// Notification Item Component
const NotificationItem = ({ notification, onMarkAsRead, onClose }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-user':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'resource-flagged':
        return <Flag className="w-4 h-4 text-red-500" />;
      case 'system-alert':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Bell className="w-4 h-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleMarkAsRead = (e) => {
    e.stopPropagation();
    onMarkAsRead(notification.id);
  };

  return (
    <div 
      className={`p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
        !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-800 dark:text-white">
              {notification.title}
            </p>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTimeAgo(notification.timestamp)}
              </span>
              {!notification.read && (
                <button
                  onClick={handleMarkAsRead}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3 text-green-500" />
                </button>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {notification.message}
          </p>
          {!notification.read && (
            <div className="w-2 h-2 bg-blue-500 rounded-full absolute left-1 top-4"></div>
          )}
        </div>
      </div>
    </div>
  );
};

// Notifications Dropdown Component
const NotificationsDropdown = ({ isOpen, onClose, notifications, onMarkAsRead, onMarkAllAsRead, isLoading }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 bg-white dark:bg-onyx rounded-lg shadow-xl border border-gray-200 dark:border-charcoal z-50"
    >
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            Notifications
          </h3>
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
          </div>
        ) : (
          <div className="relative">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onClose={onClose}
              />
            ))}
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-700 text-center">
          <button 
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
            onClick={() => {
              onClose();
              // Navigate to full notifications page if you have one
              // window.location.href = '/admin/notifications';
            }}
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

const AdminHeader = ({ 
  isSidebarOpen, 
  toggleSidebar, 
  toggleDarkMode, 
  isDarkMode, 
  user, 
  location 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to fetch notifications from backend
  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch('/api/admin/notifications?limit=10', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        // Count unread notifications
        const unread = data.notifications?.filter(n => !n.read).length || 0;
        setUnreadCount(unread);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      if (!token) {
        console.warn('No authentication token found');
        return;
      }

      const response = await fetch(`/api/admin/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          // Update local state
          setNotifications(prev => 
            prev.map(n => 
              n.id === notificationId ? { ...n, read: true } : n
            )
          );
          setUnreadCount(prev => Math.max(0, prev - 1));
        } else {
          console.error('Expected JSON but received:', contentType);
        }
      } else {
        console.error('Failed to mark notification as read. Status:', response.status);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Mark all as read in parallel
      await Promise.all(
        unreadNotifications.map(notification => 
          markAsRead(notification.id)
        )
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up polling to fetch notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle notifications dropdown toggle
  const toggleNotifications = () => {
    setIsNotificationsOpen(!isNotificationsOpen);
    if (!isNotificationsOpen) {
      fetchNotifications(); // Refresh notifications when opening
    }
  };

  const isActiveRoute = (path) => {
    if (path === '/admin') {
      return location?.pathname === '/admin';
    }
    return location?.pathname?.startsWith(path);
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
          {/* Notifications Button */}
          <div className="relative">
            <button 
              onClick={toggleNotifications}
              className="relative p-2 rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/50 transition-colors duration-200 transform active:scale-95"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationsDropdown
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              isLoading={isLoading}
            />
          </div>

          {/* Dark Mode Toggle */}
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

          {/* User Profile */}
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