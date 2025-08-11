// ResourcesSection.jsx - Fixed version with working suggestions
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ResourceCard from "../ResourceCard/ResourceCard";
import {
  faSearch,
  faSpinner,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  Search,
  Filter,
  BookOpen,
  FileText,
  FileQuestion,
  FileCheck2,
  GraduationCap,
  ChevronDown,
  RefreshCcw,
  X,
  Clock,
  Calculator,
  Atom,
  Bookmark,
  FlaskConical,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useModal } from "../../context/ModalContext/ModalContext";

// Create a simple cache outside component to persist across re-renders
const resourcesCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ResourcesSection = ({
  searchQuery: propSearchQuery,
  filterType: propFilterType,
  filterCourse: propFilterCourse,
  filterSubject: propFilterSubject,
  sortBy: propSortBy,
  setSortBy: propSetSortBy,
  isFullPage = false,
  showSearchControls = false,
  fetchSuggestions,
  recentSearches = [],
  addRecentSearch,
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localFilterType, setLocalFilterType] = useState("All");
  const [localFilterCourse, setLocalFilterCourse] = useState("All");
  const [localFilterSubject, setLocalFilterSubject] = useState("All");
  const [localSortBy, setLocalSortBy] = useState("recent");
  const [isFiltering, setIsFiltering] = useState(false);
  const [debouncedSearchQuery] = useDebounce(localSearchQuery, 500);
  const inputRef = useRef(null);

  // Add suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  // Add recent searches state - get from localStorage
  const [localRecentSearches, setLocalRecentSearches] = useState([]);

  // Add ref to track if initial load is done
  const initialLoadDone = useRef(false);
  const lastFetchParams = useRef(null);

  const {
    searchQuery = propSearchQuery || "",
    filterType = propFilterType || "All",
    filterCourse = propFilterCourse || "All",
    filterSubject = propFilterSubject || "All",
    sortBy = propSortBy || "recent",
    focusInput = false,
  } = location.state || {};

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setLocalRecentSearches(savedSearches);
  }, []);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    setLocalFilterType(filterType);
    setLocalFilterCourse(filterCourse);
    setLocalFilterSubject(filterSubject);
    setLocalSortBy(sortBy);
    if (focusInput && inputRef.current) {
      inputRef.current.focus();
      if (location.state?.autoOpenSuggestions) {
        setShowSuggestions(true);
      }
    }
  }, [
    searchQuery,
    filterType,
    filterCourse,
    filterSubject,
    sortBy,
    focusInput,
    location.state,
  ]);

  const setSortBy = propSetSortBy || setLocalSortBy;
  const { showModal } = useModal();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Create cache key for current query
  const createCacheKey = useCallback(
    (searchQuery, filterType, filterCourse, filterSubject, sortBy) => {
      return `${searchQuery}-${filterType}-${filterCourse}-${filterSubject}-${sortBy}`;
    },
    []
  );

  // Check if we should skip fetch (same params as last fetch)
  const shouldSkipFetch = useMemo(() => {
    const currentParams = {
      search: debouncedSearchQuery,
      type: localFilterType,
      course: localFilterCourse,
      subject: localFilterSubject,
      sort: localSortBy,
    };

    const paramsString = JSON.stringify(currentParams);
    const lastParamsString = JSON.stringify(lastFetchParams.current);

    return paramsString === lastParamsString && initialLoadDone.current;
  }, [
    debouncedSearchQuery,
    localFilterType,
    localFilterCourse,
    localFilterSubject,
    localSortBy,
  ]);

  // FIXED: Real API suggestions fetching
  useEffect(() => {
    const getSuggestions = async () => {
      if (localSearchQuery.trim().length > 1) {
        const suggestionsCacheKey = `suggestions-${localSearchQuery}`;
        const cached = resourcesCache.get(suggestionsCacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setSuggestions(cached.data);
          return;
        }

        setIsLoadingSuggestions(true);
        try {
          // Use the real API endpoint for suggestions
          const response = await fetch(`${API_URL}/resources/suggestions?search=${encodeURIComponent(localSearchQuery)}`);
          
          if (!response.ok) {
            throw new Error('Failed to fetch suggestions');
          }
          
          const data = await response.json();
          setSuggestions(data || []);
          
          // Cache suggestions
          resourcesCache.set(suggestionsCacheKey, {
            data: data || [],
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error("Error fetching suggestions:", err);
          // Don't show mock suggestions on API error, just show empty
          setSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
      }
    };

    getSuggestions();
  }, [localSearchQuery, API_URL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Optimized fetch function with caching
  const fetchResources = useCallback(
    async (isRefresh = false) => {
      // Skip if same parameters and not a refresh
      if (shouldSkipFetch && !isRefresh) {
        return;
      }

      const cacheKey = createCacheKey(
        debouncedSearchQuery,
        localFilterType,
        localFilterCourse,
        localFilterSubject,
        localSortBy
      );

      // Check cache first (unless it's a refresh)
      if (!isRefresh) {
        const cached = resourcesCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          setResources(cached.data);
          initialLoadDone.current = true;
          return;
        }
      }

      // Update last fetch params
      lastFetchParams.current = {
        search: debouncedSearchQuery,
        type: localFilterType,
        course: localFilterCourse,
        subject: localFilterSubject,
        sort: localSortBy,
      };

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (debouncedSearchQuery)
          queryParams.append("search", debouncedSearchQuery);
        if (localFilterType && localFilterType !== "All")
          queryParams.append("type", localFilterType);
        if (localFilterCourse && localFilterCourse !== "All")
          queryParams.append("course", localFilterCourse);
        if (localFilterSubject && localFilterSubject !== "All")
          queryParams.append("subject", localFilterSubject);
        if (localSortBy === "popular")
          queryParams.append("sortBy", "downloads");
        if (localSortBy === "rating")
          queryParams.append("sortBy", "averageRating");
        if (localSortBy === "recent") queryParams.append("sortBy", "createdAt");

        const url = `${API_URL}/resources?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        let resourcesData = [];

        if (Array.isArray(data)) {
          resourcesData = data;
        } else if (data && Array.isArray(data.resources)) {
          resourcesData = data.resources;
        } else {
          console.error("API response format is not as expected:", data);
          resourcesData = [];
        }

        setResources(resourcesData);

        // Cache the results
        resourcesCache.set(cacheKey, {
          data: resourcesData,
          timestamp: Date.now(),
        });

        initialLoadDone.current = true;
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again.");
        setResources([]);
      } finally {
        setLoading(false);
      }
    },
    [
      debouncedSearchQuery,
      localFilterType,
      localFilterCourse,
      localFilterSubject,
      localSortBy,
      API_URL,
      createCacheKey,
      shouldSkipFetch,
    ]
  );

  // Initial load effect
  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchResources();
    }
  }, []);

  // Subsequent updates effect
  useEffect(() => {
    if (initialLoadDone.current) {
      fetchResources();
    }
  }, [
    debouncedSearchQuery,
    localFilterType,
    localFilterCourse,
    localFilterSubject,
    localSortBy,
  ]);

  const typeOptions = [
    { value: "All", label: "All Types", icon: BookOpen },
    { value: "Notes", label: "Notes", icon: FileText },
    { value: "Question Paper", label: "Question Papers", icon: FileQuestion },
    { value: "Model Answer", label: "Model Answers", icon: FileCheck2 },
    { value: "Revision Sheet", label: "Revision Sheets", icon: FileText },
  ];

  const courseOptions = [
    { value: "All", label: "All Courses", icon: GraduationCap },
    { value: "B.Sc.", label: "B.Sc.", icon: GraduationCap },
    { value: "B.Tech", label: "B.Tech", icon: GraduationCap },
    { value: "B.A.", label: "B.A.", icon: GraduationCap },
    { value: "M.Sc.", label: "M.Sc.", icon: GraduationCap },
  ];

  const subjectOptions = [
    { value: "All", label: "All Subjects", icon: BookOpen },
    { value: "Mathematics", label: "Math", icon: Calculator },
    { value: "Physics", label: "Physics", icon: Atom },
    { value: "Chemistry", label: "Chemistry", icon: FlaskConical },
    { value: "English", label: "English", icon: Bookmark },
  ];

  const handleFilterSelect = (setter) => (value) => {
    setIsFiltering(true);
    setter(value);
    setTimeout(() => setIsFiltering(false), 300);
  };

  const handleReset = useCallback(() => {
    setLocalSearchQuery("");
    setLocalFilterType("All");
    setLocalFilterCourse("All");
    setLocalFilterSubject("All");
    setLocalSortBy("recent");

    // Clear cache for reset
    resourcesCache.clear();
    initialLoadDone.current = false;

    showModal({
      type: "success",
      title: "Filters Reset",
      message: "All search filters have been cleared.",
      confirmText: "OK",
    });
  }, [showModal]);

  const handleRefresh = useCallback(() => {
    fetchResources(true);
  }, [fetchResources]);

  const handleSearchSubmit = () => {
    const trimmedQuery = localSearchQuery.trim();
    if (trimmedQuery) {
      // Add to recent searches
      const updatedSearches = [
        trimmedQuery,
        ...localRecentSearches.filter((item) => item !== trimmedQuery).slice(0, 4),
      ];
      setLocalRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      
      // Call addRecentSearch if provided
      if (addRecentSearch) {
        addRecentSearch(trimmedQuery);
      }
      
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setLocalSearchQuery("");
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setLocalSearchQuery(suggestion);
    setShowSuggestions(false);
    
    // Add to recent searches
    const updatedSearches = [
      suggestion,
      ...localRecentSearches.filter((item) => item !== suggestion).slice(0, 4),
    ];
    setLocalRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    
    if (addRecentSearch) {
      addRecentSearch(suggestion);
    }
    inputRef.current?.focus();
  };

  const handleInputInteraction = () => {
    setShowSuggestions(true);
  };

  const displayedResources = useMemo(() => resources, [resources]);

  // Show loading only on initial load or when explicitly refreshing
  const showLoadingState =
    loading && (!initialLoadDone.current || resources.length === 0);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`px-4 py-8 max-w-full mx-auto min-h-screen transition-all duration-300 ${
        isFullPage
          ? "bg-gray-100 dark:bg-gradient-to-br pt-16 dark:from-onyx dark:via-charcoal dark:to-onyx"
          : "bg-transparent"
      }`}
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className={`fixed ${
          isFullPage ? "visible" : "hidden"
        } top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-onyx shadow-glow-sm hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-md border border-gray-200 dark:border-charcoal`}
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
        <span>Back</span>
      </motion.button>

      {showSearchControls && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-charcoal/95 rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-[1150px] mx-auto mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-poppins">
            <motion.div
              animate={{
                rotate: [0, 5, -5, 0],
                transition: { duration: 1.5, repeat: Infinity },
              }}
            >
              <Search
                size={24}
                className="text-amber-600 dark:text-amber-200"
              />
            </motion.div>
            <span className="dark:text-white text-black">
              Find Academic Resources
            </span>
          </h2>
          <form
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
            ref={dropdownRef}
          >
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search
                  className="text-amber-600 dark:text-amber-200"
                  size={20}
                />
              </div>
              <motion.div
                whileFocus={{
                  boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.5)",
                  scale: 1.01,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className="pl-10 pr-10 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx bg-white dark:bg-onyx/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-all duration-200 shadow-glow-sm"
                  placeholder="Search by title, subject..."
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleInputInteraction}
                  onClick={handleInputInteraction}
                />
              </motion.div>
              {localSearchQuery && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={() => {
                    setLocalSearchQuery("");
                    setShowSuggestions(false);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <X
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-amber-200"
                    size={20}
                  />
                </motion.button>
              )}

              {/* FIXED: Suggestions dropdown with proper blur handling */}
              <AnimatePresence>
                {showSuggestions && (suggestions.length > 0 || localRecentSearches.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 10 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                    className="absolute z-50 mt-1 w-full bg-white dark:bg-onyx/95 rounded-lg shadow-xl border border-gray-200 dark:border-charcoal max-h-60 overflow-auto"
                  >
                    {isLoadingSuggestions ? (
                      <div className="px-4 py-2 flex items-center justify-center gap-2">
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="text-amber-600 dark:text-amber-200"
                        />
                        <span className="text-sm dark:text-gray-200">
                          Loading suggestions...
                        </span>
                      </div>
                    ) : (
                      <>
                        {suggestions.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-charcoal">
                              Suggestions
                            </div>
                            {suggestions.map((item) => (
                              <motion.div
                                key={item._id}
                                whileHover={{
                                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                                }}
                                className="px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                                onMouseDown={() =>
                                  handleSuggestionClick(item.title)
                                }
                              >
                                <Search
                                  size={16}
                                  className="text-amber-600 dark:text-amber-200"
                                />
                                <span className="dark:text-gray-200">
                                  {item.title}
                                </span>
                              </motion.div>
                            ))}
                          </>
                        )}

                        {localRecentSearches.length > 0 && (
                          <>
                            <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-charcoal">
                              Recent Searches
                            </div>
                            {localRecentSearches.map((search, index) => (
                              <motion.div
                                key={index}
                                whileHover={{
                                  backgroundColor: "rgba(245, 158, 11, 0.1)",
                                }}
                                className="px-4 py-2 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                                onMouseDown={() =>
                                  handleSuggestionClick(search)
                                }
                              >
                                <Clock
                                  size={16}
                                  className="text-amber-600 dark:text-amber-200"
                                />
                                <span className="dark:text-gray-200">
                                  {search}
                                </span>
                              </motion.div>
                            ))}
                          </>
                        )}

                        {!isLoadingSuggestions &&
                          suggestions.length === 0 &&
                          localRecentSearches.length === 0 && (
                            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {localSearchQuery.trim().length > 0
                                ? "No suggestions found"
                                : "Type to search for resources"}
                            </div>
                          )}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Dropdown
              label="Filter by type"
              icon={Filter}
              options={typeOptions}
              selectedValue={localFilterType}
              onSelect={handleFilterSelect(setLocalFilterType)}
              loading={isFiltering}
            />
            <Dropdown
              label="Filter by course"
              icon={GraduationCap}
              options={courseOptions}
              selectedValue={localFilterCourse}
              onSelect={handleFilterSelect(setLocalFilterCourse)}
              loading={isFiltering}
            />
            <Dropdown
              label="Filter by subject"
              icon={Bookmark}
              options={subjectOptions}
              selectedValue={localFilterSubject}
              onSelect={handleFilterSelect(setLocalFilterSubject)}
              loading={isFiltering}
            />
          </form>

          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-amber-950/40 transition-colors duration-200"
              >
                <RefreshCcw
                  size={16}
                  className="text-amber-600 dark:text-amber-200"
                />
                Reset Filters
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-amber-950/40 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw
                  size={16}
                  className={`text-amber-600 dark:text-amber-200 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 max-w-6xl mx-auto"
      >
        <h2 className="text-2xl font-semibold dark:text-white font-poppins">
          Popular Resources{" "}
          {loading && initialLoadDone.current && (
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="ml-2 text-amber-600 dark:text-amber-200"
              size="sm"
            />
          )}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-platinum font-poppins">
            Sort by:
          </span>
          <div className="relative">
            <motion.select
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              className="p-2 pr-8 border rounded-lg bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-onyx/80 dark:text-platinum dark:border-onyx font-poppins focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-amber-200 shadow-glow-sm"
              value={localSortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </motion.select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-amber-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {showLoadingState && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-12 flex flex-col items-center justify-center text-gray-600 dark:text-platinum font-poppins"
        >
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 1.5,
                ease: "linear",
              },
            }}
          >
            <FontAwesomeIcon
              icon={faSpinner}
              size="2x"
              className="mb-4 text-amber-600 dark:text-amber-200"
            />
          </motion.div>
          <motion.p
            animate={{
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
            }}
          >
            Loading resources...
          </motion.p>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-12 text-red-600 dark:text-amber-300 font-poppins"
        >
          Error: {error}
        </motion.div>
      )}

      {!showLoadingState && !error && displayedResources.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center py-12"
        >
          <div className="max-w-md mx-auto">
            <motion.div
              animate={{
                y: [0, -5, 0],
                transition: { repeat: Infinity, duration: 2 },
              }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-charcoal flex items-center justify-center shadow-glow-sm"
            >
              <FontAwesomeIcon
                icon={faSearch}
                className="text-2xl text-amber-600 dark:text-amber-200"
              />
            </motion.div>
            <h3 className="text-xl font-medium bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent font-poppins mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 dark:text-platinum font-poppins">
              Try adjusting your search terms or filters.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        className="max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto gap-8"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              when: "beforeChildren",
              staggerChildren: 0.1,
              staggerDirection: 1,
            },
          },
        }}
      >
        {displayedResources.map((resource) => (
          <motion.div
            key={resource._id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: {
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 300,
                  damping: 20,
                },
              },
            }}
          >
            <ResourceCard resource={resource} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
};

const Dropdown = ({
  label,
  icon: Icon,
  options,
  selectedValue,
  onSelect,
  className,
  loading,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(
    (option) => option.value === selectedValue
  ) || { label: "All", icon: BookOpen };

  const toggleDropdown = () => !loading && setIsOpen(!isOpen);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        className={`px-4 py-3 w-full rounded-xl border transition-all duration-200 flex items-center justify-between shadow-glow-sm
          ${
            loading
              ? "cursor-not-allowed opacity-70"
              : "cursor-pointer hover:border-amber-400 dark:hover:border-amber-200"
          }
          border-gray-300 dark:border-onyx bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200`}
        onClick={toggleDropdown}
        disabled={loading}
      >
        <span className="flex items-center gap-2">
          {loading ? (
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              className="text-amber-600 dark:text-amber-200"
            />
          ) : (
            Icon && (
              <Icon className="text-amber-600 dark:text-amber-200" size={20} />
            )
          )}
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`text-amber-600 dark:text-amber-200 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          size={20}
        />
      </motion.button>
      {isOpen && (
        <motion.ul
          initial={{ opacity: 0, y: -5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
          className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-onyx/90 rounded-xl shadow-xl border border-gray-200 dark:border-onyx z-50 max-h-60 overflow-auto"
        >
          {options.map((option) => (
            <motion.li
              key={option.value}
              whileHover={{
                backgroundColor:
                  option.value === selectedValue
                    ? "rgba(253, 230, 138, 0.5)"
                    : "rgba(249, 250, 251, 0.5)",
                dark: {
                  backgroundColor:
                    option.value === selectedValue
                      ? "rgba(120, 53, 15, 0.7)"
                      : "rgba(68, 64, 60, 0.4)",
                },
              }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors font-poppins
                ${
                  option.value === selectedValue
                    ? "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200"
                    : "hover:bg-gray-50 dark:hover:bg-amber-950/40 text-gray-700 dark:text-gray-200"
                }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && (
                <option.icon
                  size={16}
                  className="min-w-4 text-amber-600 dark:text-amber-200"
                />
              )}
              {option.label}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

export default ResourcesSection;