import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import UniversalResourceCard from "../UniversalResourceCard/UniversalResourceCard";
import {
  faSearch,
  faSpinner,
  faArrowLeft,
  faMinimize,
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
  MoveRight,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useModal } from "../../context/ModalContext/ModalContext";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";

// Enhanced Cache Manager
class ResourcesCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheKeys = this.loadCacheKeys();
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    this.STALE_TIME = 30 * 1000; // 30 seconds - data is stale after this
    this.MAX_CACHE_SIZE = 100; // Maximum number of cached items
    this.backgroundFetches = new Map(); // Track ongoing background fetches
  }

  loadCacheKeys() {
    try {
      const keys = localStorage.getItem('resources_cache_keys');
      return keys ? JSON.parse(keys) : [];
    } catch {
      return [];
    }
  }

  saveCacheKeys() {
    try {
      localStorage.setItem('resources_cache_keys', JSON.stringify(this.cacheKeys));
    } catch (error) {
      console.warn('Failed to save cache keys:', error);
    }
  }

  generateCacheKey(params) {
    const { searchQuery, filterType, filterCourse, filterSubject, sortBy } = params;
    return `${searchQuery || ''}-${filterType || 'All'}-${filterCourse || 'All'}-${filterSubject || 'All'}-${sortBy || 'recent'}`;
  }

  isValidCache(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < this.CACHE_DURATION;
  }

  isStaleCache(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return true;
    return Date.now() - cacheEntry.timestamp > this.STALE_TIME;
  }

  get(params) {
    const key = this.generateCacheKey(params);
    
    // Try memory cache first
    let cacheEntry = this.memoryCache.get(key);
    
    // If not in memory, try localStorage
    if (!cacheEntry) {
      try {
        const stored = localStorage.getItem(`resources_cache_${key}`);
        if (stored) {
          cacheEntry = JSON.parse(stored);
          // Re-populate memory cache
          this.memoryCache.set(key, cacheEntry);
        }
      } catch (error) {
        console.warn('Failed to read from localStorage cache:', error);
      }
    }

    if (this.isValidCache(cacheEntry)) {
      return {
        data: cacheEntry.data,
        isStale: this.isStaleCache(cacheEntry),
        timestamp: cacheEntry.timestamp,
        fromCache: true
      };
    }

    // Clean up expired entry
    this.delete(key);
    return null;
  }

  set(params, data) {
    const key = this.generateCacheKey(params);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      params: { ...params }
    };

    // Store in memory cache
    this.memoryCache.set(key, cacheEntry);

    // Store in localStorage with error handling
    try {
      localStorage.setItem(`resources_cache_${key}`, JSON.stringify(cacheEntry));
      
      // Update cache keys tracking
      if (!this.cacheKeys.includes(key)) {
        this.cacheKeys.push(key);
        
        // Implement LRU eviction if cache is too large
        if (this.cacheKeys.length > this.MAX_CACHE_SIZE) {
          const oldestKey = this.cacheKeys.shift();
          this.delete(oldestKey);
        }
        
        this.saveCacheKeys();
      }
    } catch (error) {
      console.warn('Failed to save to localStorage cache:', error);
      // Continue with memory-only caching
    }
  }

  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`resources_cache_${key}`);
      this.cacheKeys = this.cacheKeys.filter(k => k !== key);
      this.saveCacheKeys();
    } catch (error) {
      console.warn('Failed to delete from localStorage cache:', error);
    }
  }

  clear() {
    this.memoryCache.clear();
    try {
      this.cacheKeys.forEach(key => {
        localStorage.removeItem(`resources_cache_${key}`);
      });
      localStorage.removeItem('resources_cache_keys');
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
    this.cacheKeys = [];
    this.backgroundFetches.clear();
  }

  // Prefetch data for common filter combinations
  prefetch(commonParams, fetchFunction) {
    commonParams.forEach(params => {
      const key = this.generateCacheKey(params);
      if (!this.get(params) && !this.backgroundFetches.has(key)) {
        this.backgroundFetches.set(key, true);
        fetchFunction(params).then(data => {
          this.set(params, data);
        }).catch(error => {
          console.warn('Prefetch failed:', error);
        }).finally(() => {
          this.backgroundFetches.delete(key);
        });
      }
    });
  }

  getStats() {
    const memorySize = this.memoryCache.size;
    const localStorageSize = this.cacheKeys.length;
    const validEntries = this.cacheKeys.filter(key => {
      try {
        const stored = localStorage.getItem(`resources_cache_${key}`);
        if (stored) {
          const entry = JSON.parse(stored);
          return this.isValidCache(entry);
        }
      } catch {
        return false;
      }
      return false;
    }).length;

    return {
      memorySize,
      localStorageSize,
      validEntries,
      expiredEntries: localStorageSize - validEntries,
      backgroundFetches: this.backgroundFetches.size
    };
  }
}
// Create singleton cache instance
const cacheManager = new ResourcesCacheManager();

// SearchSection Component (keeping existing implementation with refresh prop)
const SearchSection = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterCourse,
  setFilterCourse,
  filterSubject,
  setFilterSubject,
  handleRefresh,
  cacheStats, // New prop to show cache info
  resource, onSave,
}) => {
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { showModal } = useModal();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(savedSearches);
  }, []);

  useEffect(() => {
    const getSuggestions = async () => {
      if (debouncedSearchQuery.trim().length > 1) {
        setIsLoadingSuggestions(true);
        try {
          const response = await fetch(
            `${API_URL}/resources/suggestions?search=${encodeURIComponent(
              debouncedSearchQuery
            )}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch suggestions");
          }

          const data = await response.json();
          setSuggestions(data || []);
        } catch (err) {
          console.error("Error fetching suggestions:", err);
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
  }, [debouncedSearchQuery, API_URL]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const updatedSearches = [
        searchQuery.trim(),
        ...recentSearches.filter((item) => item !== searchQuery.trim()).slice(0, 4),
      ];
      setRecentSearches(updatedSearches);
      localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
      navigate("/resources", {
        state: {
          searchQuery,
          filterType,
          filterCourse,
          filterSubject,
          focusInput: true,
        },
      });
    }
    setShowSuggestions(false);
  };
  
  
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === "Escape") {
      setSearchQuery("");
      setShowSuggestions(false);
      inputRef.current.blur();
    }
  };

  const handleFullViewClick = (e) => {
    e.preventDefault();
    setShowSuggestions(true);
    navigate("/resources", {
      state: {
        searchQuery,
        filterType,
        filterCourse,
        filterSubject,
        focusInput: true,
      },
    });
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    const updatedSearches = [
      suggestion,
      ...recentSearches.filter((item) => item !== suggestion).slice(0, 4),
    ];
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    inputRef.current.focus();
    navigate("/resources", {
      state: {
        searchQuery: suggestion,
        filterType,
        filterCourse,
        filterSubject,
        focusInput: true,
      },
    });
  };

  const handleClearCache = () => {
    cacheManager.clear();
    handleRefresh(true); // Force refresh after clearing cache
    showModal({
      type: 'success',
      title: 'Cache Cleared',
      message: 'All cached data has been cleared and fresh data is being loaded.',
      confirmText: 'OK',
    });
  };

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

  const hasActiveFilters =
    filterType !== "All" || filterCourse !== "All" || filterSubject !== "All";

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="px-4 py-4 w-full flex justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-charcoal/95 rounded-2xl shadow-lg p-4 w-full max-w-[1150px]"
      >
        {/* Header with cache info */}
        <div className="flex justify-between items-center mb-4">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg font-bold flex items-center gap-2 font-poppins"
          >
            <Search
              size={20}
              className="text-amber-600 dark:text-amber-200"
            />
            <span>Search</span>
            {cacheStats && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                {cacheStats.validEntries} cached
              </span>
            )}
          </motion.h2>
          <div className="flex items-center gap-2">
            
            {cacheStats && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClearCache}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Clear Cache"
              >
                Clear Cache
              </motion.button>
            )}
          </div>
        </div>

        <form className="space-y-4">
          {/* Search Input */}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </motion.div>
            {searchQuery && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-amber-200"
                  size={20}
                />
              </motion.button>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                }}
                className="absolute z-[9999] mt-1 w-full bg-white dark:bg-onyx rounded-lg shadow-xl border border-gray-200 dark:border-onyx max-h-60 overflow-auto scroll-container"
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
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                          Suggestions
                        </div>
                        {suggestions.map((item) => (
                          <motion.div
                            key={item._id}
                            whileHover={{
                              backgroundColor: "rgba(249, 250, 251, 0.5)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
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

                    {recentSearches.length > 0 && (
                      <>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                          Recent Searches
                        </div>
                        {recentSearches.map((search, index) => (
                          <motion.div
                            key={index}
                            whileHover={{
                              backgroundColor: "rgba(249, 250, 251, 0.5)",
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                            onMouseDown={() => handleSuggestionClick(search)}
                          >
                            <Clock
                              size={16}
                              className="text-amber-600 dark:text-amber-200"
                            />
                            <span className="dark:text-gray-200">{search}</span>
                          </motion.div>
                        ))}
                      </>
                    )}

                    {!isLoadingSuggestions &&
                      suggestions.length === 0 &&
                      recentSearches.length === 0 && (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          {searchQuery.trim().length > 0
                            ? "No suggestions found"
                            : "Type to search for resources"}
                        </div>
                      )}
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Filter Toggle and Refresh Button */}
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 ${
                hasActiveFilters
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-200"
                  : "border-gray-300 dark:border-onyx bg-white dark:bg-onyx/90 text-gray-700 dark:text-gray-200"
              }`}
            >
              <Settings
                size={16}
                className={
                  hasActiveFilters
                    ? "text-amber-600 dark:text-amber-200"
                    : "text-gray-500 dark:text-gray-400"
                }
              />
              <span className="text-sm">Filters</span>
              {hasActiveFilters && (
                <span className="bg-amber-600 dark:bg-amber-200 text-white dark:text-amber-900 text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {[filterType !== "All", filterCourse !== "All", filterSubject !== "All"].filter(Boolean).length}
                </span>
              )}
              <ChevronDown
                className={`transition-transform duration-200 ${
                  showFilters ? "rotate-180" : ""
                } ${
                  hasActiveFilters
                    ? "text-amber-600 dark:text-amber-200"
                    : "text-gray-500 dark:text-gray-400"
                }`}
                size={16}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={() => handleRefresh()}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white dark:bg-onyx/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-amber-950/40 transition-colors duration-200"
            >
              <RefreshCcw
                size={16}
                className="text-amber-600 dark:text-amber-200"
              />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pt-2 lg:flex lg:flex-row lg:space-x-4 lg:space-y-0 space-y-3 block"
            >
              <div className="lg:flex-1">
                <Dropdown
                  label="Filter by type"
                  icon={Filter}
                  options={typeOptions}
                  selectedValue={filterType}
                  onSelect={handleFilterSelect(setFilterType)}
                  loading={isFiltering}
                />
              </div>
              <div className="lg:flex-1">
                <Dropdown
                  label="Filter by course"
                  icon={GraduationCap}
                  options={courseOptions}
                  selectedValue={filterCourse}
                  onSelect={handleFilterSelect(setFilterCourse)}
                  loading={isFiltering}
                />
              </div>
              <div className="lg:flex-1">
                <Dropdown
                  label="Filter by subject"
                  icon={Bookmark}
                  options={subjectOptions}
                  selectedValue={filterSubject}
                  onSelect={handleFilterSelect(setFilterSelect)}
                  loading={isFiltering}
                />
              </div>
            </motion.div>
          )}
        </form>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 flex items-center gap-2 flex-wrap max-w-full overflow-x-auto pb-2 scroll-container"
          >
            <span className="text-sm text-gray-500 dark:text-amber-200 min-w-max">
              Recent:
            </span>
            <div className="flex gap-2">
              {recentSearches.slice(0, window.innerWidth < 768 ? 3 : recentSearches.length).map((search, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSuggestionClick(search)}
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-amber-950/40 hover:bg-gray-200 dark:hover:bg-amber-950/60 rounded-full flex items-center gap-1 whitespace-nowrap"
                >
                  {search.length > 15 && window.innerWidth < 768
                    ? `${search.substring(0, 15)}...`
                    : search}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.section>
  );
};

// Dropdown Component (keeping existing implementation)
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

  const selectedOption =
    options.find((option) => option.value === selectedValue) || {
      label: "All",
      icon: BookOpen,
    };

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
          focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 scroll-container`}
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
          <span className="truncate">{selectedOption.label}</span>
        </span>
        <ChevronDown
          className={`text-amber-600 dark:text-amber-200 transition-transform duration-200 flex-shrink-0 ${
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
          className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-onyx/90 rounded-xl shadow-xl border border-gray-200 dark:border-onyx z-[9999] max-h-60 overflow-auto scroll-container"
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
                  className="min-w-4 text-amber-600 dark:text-amber-200 flex-shrink-0"
                />
              )}
              <span className="truncate">{option.label}</span>
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

// Enhanced ResourcesSection Component
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
   onSave , onFlag
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStaleData, setIsStaleData] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localFilterType, setLocalFilterType] = useState("All");
  const [localFilterCourse, setLocalFilterCourse] = useState("All");
  const [localFilterSubject, setLocalFilterSubject] = useState("All");
  const [localSortBy, setLocalSortBy] = useState("recent");
  const initialLoadDone = useRef(false);
  const lastFetchParams = useRef(null);
  const backgroundFetchRef = useRef(null);
  const [cacheStats, setCacheStats] = useState(null);
  const {isAuthenticated , token} = useAuth();
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  
  // New state to control exit animation
  const [isExiting, setIsExiting] = useState(false);
  
  const {
    searchQuery = propSearchQuery || "",
    filterType = propFilterType || "All",
    filterCourse = propFilterCourse || "All",
    filterSubject = propFilterSubject || "All",
    sortBy = propSortBy || "recent",
    focusInput = false,
  } = location.state || {};

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
    setLocalFilterType(filterType);
    setLocalFilterCourse(filterCourse);
    setLocalFilterSubject(filterSubject);
    setLocalSortBy(sortBy);
    if (focusInput) {
      // Focus handling would be in SearchSection
    }
  }, [searchQuery, filterType, filterCourse, filterSubject, sortBy, focusInput]);
  
  const handleSave = async () => {
      if (!isAuthenticated) {
        showModal({
          type: "warning",
          title: "Authentication Required",
          message:
            "You need to be logged in to save resources to your library. Please log in or create an account.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }
      setSaving(true);
      try {
        const response = await fetch(
          `${API_URL}/resources/${resources._id}/save`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
  
        const data = await response.json();
        if (response.ok) {
          showModal({
            type: "success",
            title: "Resource Saved!",
            message:
              "This resource has been successfully added to your library!",
            confirmText: "Great!",
          });
          onSave?.(resources._id);
        } else {
          showModal({
            type: "error",
            title: "Failed to Save",
            message: `Could not save resource: ${data.msg || "Unknown error"}`,
            confirmText: "OK",
          });
        }
      } catch (error) {
        console.error("Save error:", error);
        showModal({
          type: "error",
          title: "Save Error",
          message:
            "An unexpected error occurred while saving the resource. Please try again.",
          confirmText: "OK",
        });
      } finally {
        setSaving(false);
      }
    };
  
    const handleFlag = async () => {
      if (!isAuthenticated) {
        showModal({
          type: "warning",
          title: "Authentication Required",
          message:
            "You need to be logged in to flag resources. Please log in or create an account.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }
  
      showModal({
        type: "info",
        title: "Confirm Flagging",
        message:
          "Are you sure you want to flag this resource for review? This action cannot be undone.",
        confirmText: "Flag",
        onConfirm: async () => {
          setFlagging(true);
          try {
            const response = await fetch(
              `${API_URL}/resources/${resources._id}/flag`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ reason: "Reported by user" }),
              }
            );
  
            const data = await response.json();
            if (response.ok) {
              showModal({
                type: "success",
                title: "Resource Flagged",
                message:
                  "This resource has been flagged for review. Thank you for helping us maintain content quality!",
                confirmText: "Got It",
              });
              onFlag?.(resources._id);
            } else {
              showModal({
                type: "error",
                title: "Failed to Flag",
                message: `Could not flag resource: ${
                  data.msg || "Unknown error"
                }`,
                confirmText: "OK",
              });
            }
          } catch (error) {
            console.error("Flag error:", error);
            showModal({
              type: "error",
              title: "Flagging Error",
              message:
                "An unexpected error occurred while flagging the resource. Please try again.",
              confirmText: "OK",
            });
          } finally {
            setFlagging(false);
          }
        },
        cancelText: "Cancel",
        isDismissible: true,
      });
    };
  const setSortBy = propSetSortBy || setLocalSortBy;
  const { showModal } = useModal();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Update cache stats
  useEffect(() => {
    const updateCacheStats = () => {
      setCacheStats(cacheManager.getStats());
    };
    
    updateCacheStats();
    const interval = setInterval(updateCacheStats, 5000); // Update every 5 seconds
    
    return () => clearInterval(interval);
  }, []);

  const createFetchParams = useCallback(
    (searchQuery, filterType, filterCourse, filterSubject, sortBy) => {
      return {
        searchQuery: searchQuery || "",
        filterType: filterType || "All",
        filterCourse: filterCourse || "All",
        filterSubject: filterSubject || "All",
        sortBy: sortBy || "recent",
      };
    },
    []
  );

  const shouldSkipFetch = useMemo(() => {
    const currentParams = createFetchParams(
      localSearchQuery,
      localFilterType,
      localFilterCourse,
      localFilterSubject,
      localSortBy
    );

    const paramsString = JSON.stringify(currentParams);
    const lastParamsString = JSON.stringify(lastFetchParams.current);

    return paramsString === lastParamsString && initialLoadDone.current;
  }, [localSearchQuery, localFilterType, localFilterCourse, localFilterSubject, localSortBy, createFetchParams]);

  const fetchFromAPI = useCallback(async (params) => {
    const queryParams = new URLSearchParams();
    if (params.searchQuery) queryParams.append("search", params.searchQuery);
    if (params.filterType && params.filterType !== "All")
      queryParams.append("type", params.filterType);
    if (params.filterCourse && params.filterCourse !== "All")
      queryParams.append("course", params.filterCourse);
    if (params.filterSubject && params.filterSubject !== "All")
      queryParams.append("subject", params.filterSubject);
    if (params.sortBy === "popular") queryParams.append("sortBy", "downloads");
    if (params.sortBy === "rating") queryParams.append("sortBy", "averageRating");
    if (params.sortBy === "recent") queryParams.append("sortBy", "createdAt");

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

    return resourcesData;
  }, [API_URL]);

  const fetchResources = useCallback(
    async (isRefresh = false, showLoadingState = true) => {
      const currentParams = createFetchParams(
        localSearchQuery,
        localFilterType,
        localFilterCourse,
        localFilterSubject,
        localSortBy
      );

      if (shouldSkipFetch && !isRefresh) {
        return;
      }

      // Cancel any ongoing background fetch
      if (backgroundFetchRef.current) {
        backgroundFetchRef.current.abort();
        backgroundFetchRef.current = null;
      }

      // Try to get from cache first (unless force refresh)
      if (!isRefresh) {
        const cached = cacheManager.get(currentParams);
        if (cached) {
          setResources(cached.data);
          setError(null);
          setIsStaleData(cached.isStale);
          initialLoadDone.current = true;

          // If data is stale, fetch fresh data in background
          if (cached.isStale) {
            console.log("Using stale cached data, fetching fresh data in background...");
            
            // Create abort controller for background fetch
            const abortController = new AbortController();
            backgroundFetchRef.current = abortController;
            
            try {
              const freshData = await fetchFromAPI(currentParams);
              
              // Only update if this fetch wasn't cancelled
              if (!abortController.signal.aborted) {
                cacheManager.set(currentParams, freshData);
                setResources(freshData);
                setIsStaleData(false);
                console.log("Background refresh completed");
              }
            } catch (err) {
              if (!abortController.signal.aborted) {
                console.warn("Background refresh failed:", err);
              }
            } finally {
              if (backgroundFetchRef.current === abortController) {
                backgroundFetchRef.current = null;
              }
            }
          }

          return cached.data;
        }
      }

      // No cache hit or force refresh - show loading and fetch
      lastFetchParams.current = currentParams;

      if (showLoadingState) {
        setLoading(true);
      }
      setError(null);

      try {
        const freshData = await fetchFromAPI(currentParams);
        
        // Update cache and state
        cacheManager.set(currentParams, freshData);
        setResources(freshData);
        setIsStaleData(false);
        setError(null);
        initialLoadDone.current = true;

        // Prefetch common filter combinations
        const commonParams = [
          { ...currentParams, filterType: "Notes" },
          { ...currentParams, filterType: "Question Paper" },
          { ...currentParams, sortBy: "popular" },
        ];
        
        // Don't wait for prefetch
        setTimeout(() => {
          cacheManager.prefetch(commonParams, fetchFromAPI);
        }, 1000);

        return freshData;
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again.");
        setResources([]);
        setIsStaleData(false);
      } finally {
        setLoading(false);
      }
    },
    [
      localSearchQuery,
      localFilterType,
      localFilterCourse,
      localFilterSubject,
      localSortBy,
      createFetchParams,
      shouldSkipFetch,
      fetchFromAPI,
    ]
  );

  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchResources();
    }
  }, []);

  useEffect(() => {
    if (initialLoadDone.current) {
      fetchResources();
    }
  }, [localSearchQuery, localFilterType, localFilterCourse, localFilterSubject, localSortBy, fetchResources]);

  const handleRefresh = useCallback((forceClear = false) => {
    if (forceClear) {
      cacheManager.clear();
    }
    fetchResources(true, true); // Force refresh with loading state
  }, [fetchResources]);

  const displayedResources = useMemo(() => resources, [resources]);

  const showLoadingState = loading && (!initialLoadDone.current || resources.length === 0);

  // New logic for the minimize/exit animation
  const handleMinimize = () => {
    setIsExiting(true);
  };
  
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 500); // Duration of the exit animation
      return () => clearTimeout(timer);
    }
  }, [isExiting, navigate]);
  

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (backgroundFetchRef.current) {
        backgroundFetchRef.current.abort();
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`px-4 py-8 max-w-full mx-auto min-h-screen transition-all duration-300 ${
            isFullPage
              ? "bg-gradient-to-br from-pearl via-ivory to-cream dark:bg-gradient-to-br pt-16 dark:from-onyx dark:via-charcoal dark:to-onyx dark:text-white text-gray-500"
              : "bg-transparent"
          }`}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleMinimize}
            className={`fixed ${
              isFullPage ? "visible" : "hidden"
            } top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-onyx shadow-glow-sm hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-md border border-gray-200 dark:border-charcoal`}
          >
            <FontAwesomeIcon icon={faMinimize} className="text-sm" />
            <span>Minimize</span>
          </motion.button>

          {showSearchControls && (
            <SearchSection
              searchQuery={localSearchQuery}
              setSearchQuery={setLocalSearchQuery}
              filterType={localFilterType}
              setFilterType={setLocalFilterType}
              filterCourse={localFilterCourse}
              setFilterCourse={setLocalFilterCourse}
              filterSubject={localFilterSubject}
              setFilterSubject={setLocalFilterSubject}
              handleRefresh={handleRefresh}
              cacheStats={cacheStats}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 max-w-6xl mx-auto"
          >
            <div className="flex items-center gap-3">
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
              
              {/* Connection and Cache Status */}
              <div className="flex items-center gap-2">
                {isStaleData && (
                  <span className="flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                    <WifiOff size={12} />
                    Cached
                  </span>
                )}
                {backgroundFetchRef.current && (
                  <span className="flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    <RefreshCcw size={12} className="animate-spin" />
                    Updating
                  </span>
                )}
              </div>
            </div>
            
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
              <div className="max-w-md mx-auto">
                <div className="text-lg mb-2">⚠️ Error</div>
                <p className="mb-4">{error}</p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRefresh(false)}
                  className="px-4 py-2 bg-amber-600 dark:bg-amber-200 text-white dark:text-amber-900 rounded-lg hover:bg-amber-700 dark:hover:bg-amber-300 transition-colors"
                >
                  Try Again
                </motion.button>
              </div>
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
            className="max-w-6xl grid grid-cols-1 md:grid-cols-2  lg:grid-cols-3 mx-auto gap-8"
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
                <Link
                  to={`/resources/${resource._id}`}
                  state={{ resource: resource }}
                >
                  <UniversalResourceCard 
        key={resource._id}
        resource={resource}
        variant="default"
        // onSave={handleSave}
        // onFlag={handleFlag}
      />
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.section>
      )}
    </AnimatePresence>
  );
};

export default ResourcesSection;