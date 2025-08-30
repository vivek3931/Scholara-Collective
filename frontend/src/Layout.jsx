import React, { useState, useEffect, useCallback , useMemo} from "react";
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import { Outlet } from "react-router-dom";
import { motion } from 'framer-motion';

// Import contexts that Layout needs for Navbar/Footer and global theme
import { useTheme } from "./context/ThemeProvider/ThemeProvider";
import { useModal } from "./context/ModalContext/ModalContext";
import {useRouteCache} from './hooks/useRouteCache/useRouteCache'
import { useAuth } from "./context/AuthContext/AuthContext";
import Loader from "./components/Loader/Loader";

/**
 * Layout component for consistent Navbar and Footer across the application.
 * It also includes the global styling and animation container.
 * This component now fetches its own appConfig and navigationData
 * needed for Navbar, Footer, and global theme application.
 */
const Layout = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { showModal } = useModal();
  const { user, isAuthenticated, isInitialized: isAuthInitialized } = useAuth();
  const [isVisitedSearchResultPage, setIsVisitedSearchResultPage] = useState(false);

  // --- Data Fetching for Layout (Navbar, Footer, Global Theme) ---

  // Callback to fetch application configuration for the layout
  const fetchAppConfig = useCallback(async ({ signal }) => {
    return new Promise((resolve) => {
      setTimeout(() => { // Simulate API call
        resolve({
          navigation: { showSearch: true, showStats: true, maxItems: 10 },
          appSettings: { theme: 'auto', language: 'en', itemsPerPage: 20 },
          userPreferences: { defaultView: 'grid', autoSave: true },
          featureFlags: { newDesign: true, advancedFilters: true },
          theme: { primaryColor: '#3b82f6', secondaryColor: '#64748b' },
          metadata: { version: '1.0.0', lastUpdated: new Date().toISOString() }
        });
      }, 100);
    });
  }, []);

  // Use Route Cache hook for app configuration
  const {
    data: appConfig,
    isLoading: isAppConfigLoading,
    error: appConfigError, // Keep for debugging if needed
    isStale: isAppConfigStale,
    refetch: refetchAppConfig,
    clearCache: clearAppConfigCache
  } = useRouteCache(
    'layout-app-config', // Unique cache key for layout's config to avoid conflicts
    fetchAppConfig,
    {
      filters: {
        theme: isDarkMode ? 'dark' : 'light',
        route: 'layout' // Specific route filter for layout
      },
      enabled: true,
      staleWhileRevalidate: true,
      refetchOnMount: false,
      refetchInterval: 30 * 60 * 1000,
    }
  );

  // Default application configuration
  const defaultAppConfig = {
    navigation: { showSearch: true, showStats: true, maxItems: 10 },
    appSettings: { theme: 'auto', language: 'en', itemsPerPage: 20 },
    userPreferences: { defaultView: 'grid', autoSave: true },
    featureFlags: { newDesign: true, advancedFilters: true },
    theme: {},
    metadata: { version: '1.0.0', lastUpdated: new Date().toISOString() }
  };
  const effectiveAppConfig = appConfig || defaultAppConfig;

  // Callback to fetch navigation data for the layout
  const fetchNavigation = useCallback(async ({ signal }) => {
    return new Promise((resolve) => {
      setTimeout(() => { // Simulate API call
        resolve({
          mainMenu: [
            { id: 'home', label: 'Home', path: '/', icon: 'home' },
            { id: 'resources', label: 'Resources', path: '/resources', icon: 'book' },
            { id: 'about', label: 'About', path: '/about', icon: 'info' },
          ],
          userMenu: [
            { id: 'profile', label: 'Profile', path: '/profile', icon: 'user' },
            { id: 'settings', label: 'Settings', path: '/settings', icon: 'settings' },
          ],
          footerLinks: [
            { id: 'privacy', label: 'Privacy', path: '/privacy' },
            { id: 'terms', label: 'Terms', path: '/terms' },
          ]
        });
      }, 50);
    });
  }, []);

  

  // Use Route Cache hook for navigation data
  const {
    data: navigationData,
    isLoading: isNavigationLoading,
    refetch: refetchNavigation
  } = useRouteCache(
    'layout-navigation', // Unique cache key for layout's navigation
    fetchNavigation,
    {
      enabled: true,
      staleWhileRevalidate: true,
      refetchInterval: 60 * 60 * 1000,
    }
  );

  // Default navigation data
  const defaultNavigation = {
    mainMenu: [
      { id: 'home', label: 'Home', path: '/', icon: 'home' },
      { id: 'resources', label: 'Resources', path: '/resources', icon: 'book' },
    ],
    userMenu: [],
    footerLinks: []
  };
  const effectiveNavigation = navigationData || defaultNavigation;
  // --- End Data Fetching for Layout ---

  // Functions for Navbar/Footer actions
  const refreshAppData = useCallback(() => {
    refetchAppConfig();
    refetchNavigation();
    showModal({
      type: 'info',
      title: 'App Data Refreshed',
      message: 'Application configuration and navigation data have been refreshed.',
      confirmText: 'OK',
    });
  }, [refetchAppConfig, refetchNavigation, showModal]);

  const clearAppCache = useCallback(() => {
    clearAppConfigCache();
    showModal({
      type: 'info',
      title: 'App Cache Cleared',
      message: 'Application cache has been cleared.',
      confirmText: 'OK',
    });
  }, [clearAppConfigCache, showModal]);

   

  // Global loader for the entire layout if critical data is still loading
  const showLayoutLoader = isAppConfigLoading || isNavigationLoading || !isAuthInitialized;
  if (showLayoutLoader) {
    return <Loader message="Initializing Application Layout..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen from-pearl via-ivory to-cream custom-scrollbar bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-800 dark:text-gray-200 font-poppins transition-colors duration-300 overscroll-none`}
      style={effectiveAppConfig?.theme || {}}
    >
      {/* Navbar component, receiving all necessary props from Layout's state */}
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        navigationData={effectiveNavigation}
        userSession={{ user, isAuthenticated }}
        isNavigationLoading={isNavigationLoading}
        isUserSessionLoading={!isAuthInitialized}
        onRefreshApp={refreshAppData}
        onClearCache={clearAppCache}
        isVisitedSearchResultPage={isVisitedSearchResultPage} 
        setIsVisitedSearchResultPage={setIsVisitedSearchResultPage}
      />
      <main className={`flex-grow ${isVisitedSearchResultPage ? 'pt-[10px]' : 'pt-[72px]' } transition-all duration-300`}>
        <Outlet />
      </main>
      <Footer appConfig={effectiveAppConfig} />

      {isAppConfigStale && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded shadow">
          App configuration is updating...
        </div>
      )}
    </motion.div>
  );
};

export default Layout;
