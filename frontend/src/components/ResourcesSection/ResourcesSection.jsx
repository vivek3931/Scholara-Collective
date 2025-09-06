import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useResources from "../../hooks/useResources/useResources";
import UniversalResourceCard from "../UniversalResourceCard/UniversalResourceCard";
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
  Settings,
  WifiOff,
  TrendingUp,
  Sparkles,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  Download,
  Calendar,
  Users,
  ArrowRight,
  Minimize2,
  Loader2,
} from "lucide-react";
import { useDebounce } from "use-debounce";
import { useModal } from "../../context/ModalContext/ModalContext";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";

// Enhanced Cache Manager (keeping your existing implementation)
class ResourcesCacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheKeys = this.loadCacheKeys();
    this.CACHE_DURATION = 5 * 60 * 1000;
    this.STALE_TIME = 30 * 1000;
    this.MAX_CACHE_SIZE = 100;
    this.backgroundFetches = new Map();
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
    let cacheEntry = this.memoryCache.get(key);
    
    if (!cacheEntry) {
      try {
        const stored = localStorage.getItem(`resources_cache_${key}`);
        if (stored) {
          cacheEntry = JSON.parse(stored);
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

    this.memoryCache.set(key, cacheEntry);

    try {
      localStorage.setItem(`resources_cache_${key}`, JSON.stringify(cacheEntry));
      
      if (!this.cacheKeys.includes(key)) {
        this.cacheKeys.push(key);
        
        if (this.cacheKeys.length > this.MAX_CACHE_SIZE) {
          const oldestKey = this.cacheKeys.shift();
          this.delete(oldestKey);
        }
        
        this.saveCacheKeys();
      }
    } catch (error) {
      console.warn('Failed to save to localStorage cache:', error);
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
}

const cacheManager = new ResourcesCacheManager();

// Memoized ResourceCard with consistent dimensions
const MemoizedResourceCard = React.memo(({ resource }) => (
  <Link 
    to={`/resources/${resource._id}`} 
    state={{ resource }}
    className="block h-full"
  >
    <div 
      className="h-full w-full"
      style={{
        minHeight: '300px',
        maxHeight: '450px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <UniversalResourceCard 
        resource={resource}
        variant="default"
        className="h-full flex flex-col"
      />
    </div>
  </Link>
));

MemoizedResourceCard.displayName = 'MemoizedResourceCard';

// Swiper Component for horizontal scrolling
const ResourceSwiper = React.memo(({ resources, title, icon: Icon, isLoading, emptyMessage }) => {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Debounce scroll updates to prevent excessive re-renders
  const updateScrollButtons = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      const newCanScrollLeft = scrollLeft > 0;
      const newCanScrollRight = scrollLeft < scrollWidth - clientWidth - 1;

      // Only update state if values actually changed
      setCanScrollLeft((prev) => (prev !== newCanScrollLeft ? newCanScrollLeft : prev));
      setCanScrollRight((prev) => (prev !== newCanScrollRight ? newCanScrollRight : prev));
    }
  }, []);

  // Debounced version of updateScrollButtons
  const debouncedUpdateScrollButtons = useMemo(() => {
    let timeoutId;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateScrollButtons, 50);
    };
  }, [updateScrollButtons]);

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', debouncedUpdateScrollButtons, { passive: true });
      window.addEventListener('resize', debouncedUpdateScrollButtons, { passive: true });
      return () => {
        container.removeEventListener('scroll', debouncedUpdateScrollButtons);
        window.removeEventListener('resize', debouncedUpdateScrollButtons);
      };
    }
  }, [debouncedUpdateScrollButtons, resources.length]);

  const scroll = useCallback((direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 280 + 24; // Adjusted card width (280px) + gap (24px)
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const targetScroll =
        direction === 'left'
          ? Math.max(0, currentScroll - scrollAmount)
          : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth',
      });
      // Trigger immediate scroll button update after programmatic scroll
      setTimeout(updateScrollButtons, 100);
    }
  }, [updateScrollButtons]);

  // Memoize the resource cards
  const resourceCards = useMemo(
    () =>
      resources.map((resource, index) => (
        <motion.div
          key={resource._id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="flex-shrink-0 snap-start"
          style={{ width: '280px' }}
        >
          <div
            className="h-full"
            style={{
              minHeight: '300px',
              maxHeight: '550px',
            }}
          >
            <MemoizedResourceCard resource={resource} />
          </div>
        </motion.div>
      )),
    [resources]
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-12 relative"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
            <Icon className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">{resources.length} resources available</p>
          </div>
        </motion.div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="animate-spin text-amber-600 dark:text-amber-400" size={32} />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && resources.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <Search className="text-gray-400 dark:text-gray-500" size={24} />
          </div>
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {/* Resources Swiper with realistic shadow effects and extreme buttons */}
      {!isLoading && resources.length > 0 && (
        <div className="relative">
          {/* Left shadow effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-10"
            style={{
              boxShadow: canScrollLeft
                ? 'inset 16px 0 16px -8px rgba(0, 0, 0, 0.15), inset 8px 0 8px -4px rgba(0, 0, 0, 0.1)'
                : 'none',
            }}
          />

          {/* Right shadow effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollRight ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10"
            style={{
              boxShadow: canScrollRight
                ? 'inset -16px 0 16px -8px rgba(0, 0, 0, 0.15), inset -8px 0 8px -4px rgba(0, 0, 0, 0.1)'
                : 'none',
            }}
          />

          {/* Left navigation button - more extreme left */}
          {canScrollLeft && (
            <div className="absolute left-[-1rem] top-1/2 transform -translate-y-1/2 z-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll('left')}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-white shadow-md hover:shadow-lg hover:from-orange-500 hover:via-amber-600 hover:to-yellow-600 transition-all duration-200"
              >
                <ChevronLeft size={20} />
              </motion.button>
            </div>
          )}

          {/* Right navigation button - more extreme right */}
          {canScrollRight && (
            <div className="absolute right-[-1rem] top-1/2 transform -translate-y-1/2 z-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => scroll('right')}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-white shadow-md hover:shadow-lg hover:from-orange-500 hover:via-amber-600 hover:to-yellow-600 transition-all duration-200"
              >
                <ChevronRight size={20} />
              </motion.button>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-snap-type-x proximity"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              minHeight: '320px',
              alignItems: 'stretch',
            }}
          >
            {resourceCards}
          </div>

          {/* Add CSS to hide scrollbars */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
        </div>
      )}
    </motion.section>
  );
});

ResourceSwiper.displayName = 'ResourceSwiper';

// Memoized Category Button with new beautiful theme
const CategoryButton = React.memo(({ 
  category, 
  index, 
  selectedCategory, 
  subjectsByCategory, 
  onCategorySelect,
  size = 'normal' // Added size prop for different button sizes
}) => {
  const isSelected = selectedCategory?.id === category.id;
  
  return (
    <motion.button
      key={category.id}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.02 }}
      whileHover={{ 
        scale: 1.08,
        transition: { duration: 0.1 }
      }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onCategorySelect(category)}
      className={`group relative transition-all duration-200 overflow-hidden ${
        size === 'large' ? 'p-8 rounded-3xl' : 'p-6 rounded-2xl'
      } ${
        isSelected
          ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-xl shadow-amber-500/30'
          : 'bg-white dark:bg-onyx/95 border border-gray-200 dark:border-amber-500 hover:border-transparent hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-gray-900/50'
      }`}
    >
      {/* Background Gradient Overlay for hover */}
      {!isSelected && (
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
      
      {/* Category Name */}
      <h3 className={`font-semibold text-sm mb-2 transition-all duration-300 relative z-10 ${
        isSelected
          ? 'text-white drop-shadow-sm'
          : 'text-gray-800 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
      }`}>
        {category.name}
      </h3>
      
      {/* Subject Count */}
      {subjectsByCategory[category.name] && (
        <p className={`transition-all duration-300 relative z-10 ${
          size === 'large' ? 'text-sm' : 'text-xs'
        } ${
          isSelected
            ? 'text-white/90'
            : 'text-gray-500 dark:text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-300'
        }`}>
          {subjectsByCategory[category.name].length} subjects
        </p>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-2 right-2 w-6 h-6 bg-white/30 rounded-full flex items-center justify-center"
        >
          <Star size={12} className="text-white fill-white" />
        </motion.div>
      )}
    </motion.button>
  );
});

CategoryButton.displayName = 'CategoryButton';

// Full Page Categories Modal Component - Enhanced Compact Version
const CategoriesModal = React.memo(({ 
  isOpen, 
  onClose, 
  categories, 
  subjectsByCategory, 
  onCategorySelect, 
  selectedCategory 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Handle category selection and close modal
  const handleCategorySelect = useCallback((category) => {
    onCategorySelect(category);
    onClose();
  }, [onCategorySelect, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Modal Content - Compact Size */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ 
            duration: 0.4, 
            ease: [0.16, 1, 0.3, 1],
            type: "spring",
            damping: 25,
            stiffness: 400
          }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[85vh] bg-white dark:bg-onyx rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Modal Header - Compact */}
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-charcoal bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/10 dark:via-orange-950/10 dark:to-red-950/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-xl shadow-lg">
                <Grid3X3 className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                  All Categories
                </h2>
                <p className="text-gray-600 text-xs md:text-sm dark:text-gray-300">
                  {filteredCategories.length} categories available
                </p>
              </div>
            </div>
            
            {/* Close Button */}
            <motion.button
              whileHover={{ 
                scale: 1.1,
                rotate: 5,
              }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="group relative overflow-hidden p-2 bg-gray-100 dark:bg-charcoal hover:bg-red-500 dark:hover:bg-red-500 rounded-lg transition-all duration-200"
            >
              <X size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-white transition-colors relative z-10" />
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </motion.button>
          </div>

          {/* Search Bar - Compact */}
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-charcoal">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-charcoal border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 text-gray-800 dark:text-gray-200 text-sm"
              />
            </div>
          </div>

          {/* Categories Grid - Scrollable with Perfect Fit */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredCategories.map((category, index) => {
                const isSelected = selectedCategory?.id === category.id;
                
                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.1 }
                    }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleCategorySelect(category)}
                    className={`group relative transition-all duration-200 overflow-hidden p-3 md:p-4 rounded-xl ${
                      isSelected
                        ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 text-white shadow-lg shadow-amber-500/30'
                        : 'bg-white dark:bg-onyx/95 border border-gray-200 dark:border-amber-500 hover:border-transparent hover:shadow-lg hover:shadow-gray-300/50 dark:hover:shadow-gray-900/50'
                    }`}
                  >
                    {/* Background Gradient Overlay for hover */}
                    {!isSelected && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-red-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}
                    
                    {/* Shine effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                    
                    {/* Category Name */}
                    <h3 className={`font-semibold text-xs md:text-sm mb-1 transition-all duration-300 relative z-10 text-center ${
                      isSelected
                        ? 'text-white drop-shadow-sm'
                        : 'text-gray-800 dark:text-gray-200 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                    }`}>
                      {category.name}
                    </h3>
                    
                    {/* Subject Count */}
                    {subjectsByCategory[category.name] && (
                      <p className={`transition-all duration-300 relative z-10 text-xs text-center ${
                        isSelected
                          ? 'text-white/90'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-amber-500 dark:group-hover:text-amber-300'
                      }`}>
                        {subjectsByCategory[category.name].length} subjects
                      </p>
                    )}
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 right-1 w-4 h-4 bg-white/30 rounded-full flex items-center justify-center"
                      >
                        <Star size={10} className="text-white fill-white" />
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>
            
            {/* No Results Message */}
            {filteredCategories.length === 0 && searchTerm && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <Search className="text-gray-400 dark:text-gray-500" size={20} />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                  No categories found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Try searching with different keywords
                </p>
              </motion.div>
            )}
          </div>

          {/* Modal Footer - Compact */}
          <div className="p-4 md:p-6 border-t border-gray-200 dark:border-charcoal bg-gray-50 dark:bg-charcoal/50">
            <div className="flex items-center justify-between">
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                {filteredCategories.length} of {categories.length} categories shown
              </p>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-4 md:px-6 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 text-sm"
              >
                Done
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

CategoriesModal.displayName = 'CategoriesModal';

// Categories Grid Component (Updated)
const CategoriesGrid = React.memo(({ 
  categories, 
  subjectsByCategory, 
  onCategorySelect, 
  selectedCategory 
}) => {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  
  // Show only first 8 categories in the main grid
  const displayedCategories = useMemo(() => 
    categories.slice(0, 8),
    [categories]
  );

  const openCategoriesModal = useCallback(() => {
    setShowCategoriesModal(true);
  }, []);

  const closeCategoriesModal = useCallback(() => {
    setShowCategoriesModal(false);
  }, []);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-between mb-6 flex-wrap gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 rounded-xl shadow-lg">
              <Grid3X3 className="text-white" size={24} />
            </div>
            <div>
              <h2 className="lg:text-2xl text-lg font-bold text-gray-800 dark:text-white">
                Browse by Category
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Explore {categories.length} different subject categories
              </p>
            </div>
          </div>

                {categories.length > 8 && (
                <motion.button
                  whileHover={{ 
                  scale: 1.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openCategoriesModal}
                  className="group text-sm relative overflow-hidden flex justify-center items-center gap-3 px-6 py-3 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-white font-medium rounded-xl shadow-lg lg:text-base transition-all duration-200 w-full sm:w-auto"
                >
                  {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              
             
              <span className="relative z-10 font-medium">
                View All Categories
              </span>
              
              <motion.div
                className="relative z-10"
                animate={{ x: 0 }}
                whileHover={{ x: 3 }}
              >
                <ArrowRight size={18} />
              </motion.div>
            </motion.button>
          )}
        </motion.div>

        {/* Categories Grid - Show only first 8 */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-8 gap-6">
          {displayedCategories.map((category, index) => (
            <CategoryButton
              key={category.id}
              category={category}
              index={index}
              selectedCategory={selectedCategory}
              subjectsByCategory={subjectsByCategory}
              onCategorySelect={onCategorySelect}
            />
          ))}
        </div>
      </motion.section>

      {/* Categories Modal */}
      <CategoriesModal
        isOpen={showCategoriesModal}
        onClose={closeCategoriesModal}
        categories={categories}
        subjectsByCategory={subjectsByCategory}
        onCategorySelect={onCategorySelect}
        selectedCategory={selectedCategory}
      />
    </>
  );
});

CategoriesGrid.displayName = 'CategoriesGrid';

// Main Enhanced Resources Section Component
const EnhancedResourcesSection = React.memo(({
  isFullPage = false,
  showSearchControls = false,
}) => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { isAuthenticated, token } = useAuth();
  
  // Using your actual useResources hook
  const {
    resources,
    categories,
    subjectsByCategory,
    isLoading,
    error,
    fetchResources,
    fetchTrendingResources,
    fetchRecentlyAddedResources
  } = useResources();

  // State management with proper initialization
  const [state, setState] = useState({
    trendingResources: [],
    recentResources: [],
    selectedCategory: null,
    categoryResources: [],
    loadingTrending: true,
    loadingRecent: true,
    loadingCategory: false,
    isExiting: false
  });

  // Memoized fetch functions to prevent recreation on every render
  const fetchTrendingMemo = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingTrending: true }));
      const trending = await fetchTrendingResources();
      setState(prev => ({ 
        ...prev, 
        trendingResources: trending, 
        loadingTrending: false 
      }));
    } catch (err) {
      console.error('Error loading trending resources:', err);
      setState(prev => ({ ...prev, loadingTrending: false }));
    }
  }, [fetchTrendingResources]);

  const fetchRecentMemo = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loadingRecent: true }));
      const recent = await fetchRecentlyAddedResources();
      setState(prev => ({ 
        ...prev, 
        recentResources: recent, 
        loadingRecent: false 
      }));
    } catch (err) {
      console.error('Error loading recent resources:', err);
      setState(prev => ({ ...prev, loadingRecent: false }));
    }
  }, [fetchRecentlyAddedResources]);

  // Fetch data only once on mount
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      await Promise.all([
        fetchTrendingMemo(),
        fetchRecentMemo()
      ]);
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []); // Empty dependency array - only run once

  // Handle category selection with proper memoization
  const handleCategorySelect = useCallback(async (category) => {
    if (category.id === 'trending') {
      setState(prev => ({
        ...prev,
        selectedCategory: category,
        categoryResources: prev.trendingResources
      }));
      return;
    }

    try {
      setState(prev => ({ 
        ...prev, 
        loadingCategory: true, 
        selectedCategory: category 
      }));
      
      const resources = await fetchResources(category.id);
      
      setState(prev => ({ 
        ...prev, 
        categoryResources: resources, 
        loadingCategory: false 
      }));
    } catch (err) {
      console.error('Error loading category resources:', err);
      setState(prev => ({ ...prev, loadingCategory: false }));
      showModal({
        type: 'error',
        title: 'Error',
        message: 'Failed to load resources for this category.',
        confirmText: 'OK'
      });
    }
  }, [fetchResources, showModal]);

  // Handle minimize/exit
  const handleMinimize = useCallback(() => {
    setState(prev => ({ ...prev, isExiting: true }));
  }, []);

  useEffect(() => {
    if (state.isExiting) {
      const timer = setTimeout(() => {
        navigate("/");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.isExiting, navigate]);

  return (
    <AnimatePresence>
      {!state.isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`min-h-screen transition-all duration-300 ${
            isFullPage
              ? "bg-gradient-to-br from-pearl via-ivory to-cream dark:bg-gradient-to-br pt-16 dark:from-onyx dark:via-charcoal dark:to-onyx dark:text-white text-gray-500"
              : "bg-transparent"
          }`}
        >
          

          <div className="max-w-7xl mx-auto px-4 ">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                Discover Learning Resources
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Explore thousands of educational materials across multiple categories and subjects
              </p>
            </motion.div>

            {/* Trending Resources */}
            <ResourceSwiper
              resources={state.trendingResources}
              title="Trending Resources"
              icon={TrendingUp}
              isLoading={state.loadingTrending}
              emptyMessage="No trending resources at the moment"
            />

            {/* Recently Added Resources */}
            <ResourceSwiper
              resources={state.recentResources}
              title="Recently Added"
              icon={Sparkles}
              isLoading={state.loadingRecent}
              emptyMessage="No recent resources found"
            />

            {/* Categories Grid */}
            <CategoriesGrid
              categories={categories}
              subjectsByCategory={subjectsByCategory}
              onCategorySelect={handleCategorySelect}
              selectedCategory={state.selectedCategory}
            />

            {/* Selected Category Resources */}
            {state.selectedCategory && (
              <ResourceSwiper
                resources={state.categoryResources}
                title={`${state.selectedCategory.name} Resources`}
                icon={BookOpen}
                isLoading={state.loadingCategory}
                emptyMessage={`No resources found in ${state.selectedCategory.name}`}
              />
            )}

            {/* Beautiful Browse All Resources Button */}
          {!isFullPage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="text-center mt-12"
            >
              <Link to="/resources">
                <motion.button
                  whileHover={{ 
                    scale: 1.05,
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="group relative overflow-hidden inline-flex items-center gap-4 px-4 lg:px-10 py-3 lg:py-5 bg-gradient-to-r from-orange-500 via-amber-600 to-yellow-600 text-white font-semibold rounded-2xl shadow-2xl transition-all lg:text-lg text-xs duration-300"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-amber-700 to-red-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

                  <Search size={22} className="relative z-10 group -hover:rotate-12 transition-transform duration-300" />
                  <span className="relative z-10 text-lg">Browse All Resources</span>
                  <motion.div
                    className="relative z-10"
                    animate={{ x: 0 }}
                    initial={{ x: 20 }}
                  >
                    <ArrowRight size={22} />
                  </motion.div>
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
});

EnhancedResourcesSection.displayName = 'EnhancedResourcesSection';

export default EnhancedResourcesSection;