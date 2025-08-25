import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { motion } from "framer-motion";

// Contexts App.jsx (as Home Page) needs
import { useTheme } from "./context/ThemeProvider/ThemeProvider";
import { useModal } from "./context/ModalContext/ModalContext";
import { useAuth } from "./context/AuthContext/AuthContext";

// Components specific to the Home Page
import Hero from "./components/Hero/Hero";
import SearchSection from "./components/SearchSection/SearchSection";
import ScholaraFeatures from "./components/ScholaraFeatures/ScholaraFeatures";
import Loader from "./components/Loader/Loader"; // Local loader for sections
import ScholaraInfoWrapper from "./components/ScholaraInfoSection/ScholaraInfoWrapper";

// Use React.lazy() to load non-critical components asynchronously for the home page
const ResourcesSection = lazy(() =>
  import("./components/ResourcesSection/ResourcesSection")
);
const StatsSection = lazy(() =>
  import("./components/StatsSection/StatsSection")
);

// SMART LOADING STRATEGY for the home page content
const useSmartLoading = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  const [isCriticalDataLoading, setIsCriticalDataLoading] = useState(false);

  useEffect(() => {
    // A simple mechanism to set isFirstVisit to false after initial load
    // In a real app, this might be more sophisticated (e.g., using localStorage)
    if (isFirstVisit) {
      const timeoutId = setTimeout(() => setIsFirstVisit(false), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isFirstVisit]);

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
      staggerChildren: 0.1,
    },
  },
};

/**
 * App component, now serving as the Home Page content.
 * It manages its own state and data fetching for the sections it displays.
 * The global layout (Navbar, Footer, general theme) is provided by the Layout component.
 */
function App() {
  // Consume contexts needed for internal components, Layout handles global theme/auth initialization
  const { isDarkMode } = useTheme();
  const { showModal } = useModal();
  const { user, isAuthenticated } = useAuth();

  // Local state for search and filters, specific to the home page's functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [sortBy, setSortBy] = useState("recent");

  // Placeholder for appConfig relevant to home page sections
  // If specific sections (like Hero) need appConfig, they can get it from a local fetch
  // or a more specific context. Layout already provides global appConfig for theme/nav.
  const effectiveAppConfig = {
    navigation: { showSearch: true, showStats: true, maxItems: 10 },
    appSettings: { theme: "auto", language: "en", itemsPerPage: 20 },
    userPreferences: { defaultView: "grid", autoSave: true },
    featureFlags: { newDesign: true, advancedFilters: true },
    theme: {}, // Layout handles global theme application
    metadata: { version: "1.0.0", lastUpdated: new Date().toISOString() },
  };

  const updateSearchState = useCallback((newState) => {
    if (newState.searchQuery !== undefined)
      setSearchQuery(newState.searchQuery);
    if (newState.filterType !== undefined) setFilterType(newState.filterType);
    if (newState.filterCourse !== undefined)
      setFilterCourse(newState.filterCourse);
    if (newState.filterSubject !== undefined)
      setFilterSubject(newState.filterSubject);
    if (newState.sortBy !== undefined) setSortBy(newState.sortBy);
  }, []);

  const resetFilters = useCallback(() => {
    updateSearchState({
      searchQuery: "",
      filterType: "All",
      filterCourse: "All",
      filterSubject: "All",
      sortBy: "recent",
    });
    showModal({
      type: "success",
      title: "Filters Reset",
      message: "All search filters have been cleared.",
      confirmText: "OK",
    });
  }, [showModal, updateSearchState]);

  return (
    // This motion.div wraps only the content specific to the home page,
    // inheriting global styling from the Layout component.
    <motion.div
      variants={sectionVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-12"
    >
      <Hero appConfig={effectiveAppConfig} />

      <motion.section variants={sectionVariants}>
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
        <ScholaraFeatures appConfig={effectiveAppConfig} />
      </motion.section>
      <motion.section variants={sectionVariants}>
        <ScholaraInfoWrapper appConfig={effectiveAppConfig} />
      </motion.section>

      <motion.section variants={sectionVariants}>
        <Suspense fallback={<Loader message="Loading Stats..." />}>
          <StatsSection appConfig={effectiveAppConfig} />
        </Suspense>
      </motion.section>
    </motion.div>
  );
}

export default App;
