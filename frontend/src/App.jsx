import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import SearchSection from './components/SearchSection/SearchSection';
import Footer from './components/Footer/Footer';
import { useTheme } from './context/ThemeProvider/ThemeProvider';
import Loader from './components/Loader/Loader';
import { useModal } from './context/ModalContext/ModalContext';
import { useRouteCache } from './hooks/useRouteCache/useRouteCache';
import { useAuth } from './context/AuthContext/AuthContext';

// Use React.lazy() to load non-critical components asynchronously
const ResourcesSection = lazy(() => import('./components/ResourcesSection/ResourcesSection'));
const StatsSection = lazy(() => import('./components/StatsSection/StatsSection'));

// SMART LOADING STRATEGY
const useSmartLoading = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isCriticalDataLoading, setIsCriticalDataLoading] = useState(false);

  

  const shouldShowLoading = isFirstVisit || isCriticalDataLoading;

  return { shouldShowLoading, setIsCriticalDataLoading };
};

const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { showModal } = useModal();
  const { user, isAuthenticated, isInitialized: isAuthInitialized } = useAuth();
  const { shouldShowLoading, setIsCriticalDataLoading } = useSmartLoading();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  const fetchAppConfig = useCallback(async ({ signal }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
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

  

  const {
    data: appConfig,
    isLoading: isAppConfigLoading,
    error: appConfigError,
    isStale: isAppConfigStale,
    refetch: refetchAppConfig,
    clearCache: clearAppConfigCache
  } = useRouteCache(
    'app-config',
    fetchAppConfig,
    {
      filters: {
        theme: isDarkMode ? 'dark' : 'light',
        route: 'home'
      },
      enabled: true,
      staleWhileRevalidate: true,
      refetchOnMount: false,
      refetchInterval: 30 * 60 * 1000,
    }
  );

  const defaultAppConfig = {
    navigation: { showSearch: true, showStats: true, maxItems: 10 },
    appSettings: { theme: 'auto', language: 'en', itemsPerPage: 20 },
    userPreferences: { defaultView: 'grid', autoSave: true },
    featureFlags: { newDesign: true, advancedFilters: true },
    theme: {},
    metadata: { version: '1.0.0', lastUpdated: new Date().toISOString() }
  };

  const effectiveAppConfig = appConfig || defaultAppConfig;

  const fetchNavigation = useCallback(async ({ signal }) => {
    return new Promise((resolve) => {
      setTimeout(() => {
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

  const {
    data: navigationData,
    isLoading: isNavigationLoading,
    refetch: refetchNavigation
  } = useRouteCache(
    'navigation',
    fetchNavigation,
    {
      enabled: true,
      staleWhileRevalidate: true,
      refetchInterval: 60 * 60 * 1000,
    }
  );

  const defaultNavigation = {
    mainMenu: [
      { id: 'home', label: 'Home', path: '/', icon: 'home' },
      { id: 'resources', label: 'Resources', path: '/resources', icon: 'book' },
    ],
    userMenu: [],
    footerLinks: []
  };

  const effectiveNavigation = navigationData || defaultNavigation;

  const updateSearchState = useCallback((newState) => {
    if (newState.searchQuery !== undefined) setSearchQuery(newState.searchQuery);
    if (newState.filterType !== undefined) setFilterType(newState.filterType);
    if (newState.filterCourse !== undefined) setFilterCourse(newState.filterCourse);
    if (newState.filterSubject !== undefined) setFilterSubject(newState.filterSubject);
    if (newState.sortBy !== undefined) setSortBy(newState.sortBy);
  }, []);

  const resetFilters = useCallback(() => {
    updateSearchState({
      searchQuery: '',
      filterType: 'All',
      filterCourse: 'All',
      filterSubject: 'All',
      sortBy: 'recent'
    });
    showModal({
      type: 'success',
      title: 'Filters Reset',
      message: 'All search filters have been cleared.',
      confirmText: 'OK',
    });
  }, [showModal, updateSearchState]);

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

  const showAppLoader = shouldShowLoading && !isAuthInitialized;

  if (showAppLoader) {
    return <Loader message="Initializing App..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen from-pearl via-ivory to-cream custom-scrollbar bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-800 dark:text-gray-200 font-poppins transition-colors duration-300 overscroll-none`}
      style={effectiveAppConfig?.theme || {}}
    >
      <Navbar
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        navigationData={effectiveNavigation}
        userSession={{ user, isAuthenticated }}
        isNavigationLoading={isNavigationLoading}
        isUserSessionLoading={!isAuthInitialized}
        onRefreshApp={refreshAppData}
        onClearCache={clearAppCache}
      />

      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12 pb-12"
      >
        <Hero appConfig={effectiveAppConfig} />

        <motion.section variants={sectionVariants}>
          <SearchSection
            searchQuery={searchQuery}
            setSearchQuery={(value) => updateSearchState({ searchQuery: value })}
            filterType={filterType}
            setFilterType={(value) => updateSearchState({ filterType: value })}
            filterCourse={filterCourse}
            setFilterCourse={(value) => updateSearchState({ filterCourse: value })}
            filterSubject={filterSubject}
            setFilterSubject={(value) => updateSearchState({ filterSubject: value })}
            resetFilters={resetFilters}
            appConfig={effectiveAppConfig}
          />
        </motion.section>

        <motion.section variants={sectionVariants}>
          {/* Use Suspense with a fallback loader for the lazy-loaded component */}
          <Suspense fallback={<Loader message="Loading Resources..." />}>
            <ResourcesSection
              searchQuery={searchQuery}
              filterType={filterType}
              filterCourse={filterCourse}
              filterSubject={filterSubject}
              sortBy={sortBy}
              setSortBy={(value) => updateSearchState({ sortBy: value })}
              isFullPage={false}
              showSearchControls={false}
              appConfig={effectiveAppConfig}
              userSession={{ user, isAuthenticated }}
            />
          </Suspense>
        </motion.section>

        <motion.section variants={sectionVariants}>
          {/* Use Suspense with a fallback loader for the lazy-loaded component */}
          <Suspense fallback={<Loader message="Loading Stats..." />}>
            <StatsSection appConfig={effectiveAppConfig} />
          </Suspense>
        </motion.section>
      </motion.div>

      <Footer appConfig={effectiveAppConfig} />

      {isAppConfigStale && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded shadow">
          App configuration is updating...
        </div>
      )}
    </motion.div>
  );
}

export default App;