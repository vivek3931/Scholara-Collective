import { useState, useEffect, useCallback, useRef } from 'react';

// Cache configuration
const CACHE_CONFIG = {
  EXPIRY_TIME: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 50,
  STALE_TIME: 30 * 1000, // 30 seconds - data is considered stale after this time
};

// Singleton cache manager
class CacheManager {
  constructor() {
    if (CacheManager.instance) {
      return CacheManager.instance;
    }
    
    this.memoryCache = new Map();
    this.cacheKeys = this.loadCacheKeys();
    this.subscribers = new Map(); // For cache invalidation
    
    CacheManager.instance = this;
  }

  loadCacheKeys() {
    try {
      const keys = localStorage.getItem('route_cache_keys');
      return keys ? JSON.parse(keys) : [];
    } catch {
      return [];
    }
  }

  saveCacheKeys() {
    try {
      localStorage.setItem('route_cache_keys', JSON.stringify(this.cacheKeys));
    } catch (error) {
      console.warn('Failed to save cache keys:', error);
    }
  }

  generateCacheKey(route, filters = {}) {
    const filterString = Object.entries(filters)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
    return `${route}_${filterString}`;
  }

  isValidCache(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_CONFIG.EXPIRY_TIME;
  }

  isStaleCache(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) return true;
    return Date.now() - cacheEntry.timestamp > CACHE_CONFIG.STALE_TIME;
  }

  get(route, filters = {}) {
    const key = this.generateCacheKey(route, filters);
    
    let cacheEntry = this.memoryCache.get(key);
    
    if (!cacheEntry) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
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
        timestamp: cacheEntry.timestamp
      };
    }

    this.delete(key);
    return null;
  }

  set(route, filters = {}, data) {
    const key = this.generateCacheKey(route, filters);
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      route,
      filters: { ...filters }
    };

    this.memoryCache.set(key, cacheEntry);

    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
      
      if (!this.cacheKeys.includes(key)) {
        this.cacheKeys.push(key);
        
        if (this.cacheKeys.length > CACHE_CONFIG.MAX_CACHE_SIZE) {
          const oldestKey = this.cacheKeys.shift();
          this.delete(oldestKey);
        }
        
        this.saveCacheKeys();
      }
    } catch (error) {
      console.warn('Failed to save to localStorage cache:', error);
    }

    // Notify subscribers of cache update
    this.notifySubscribers(key, cacheEntry.data);
  }

  delete(key) {
    this.memoryCache.delete(key);
    try {
      localStorage.removeItem(`cache_${key}`);
      this.cacheKeys = this.cacheKeys.filter(k => k !== key);
      this.saveCacheKeys();
    } catch (error) {
      console.warn('Failed to delete from localStorage cache:', error);
    }

    // Notify subscribers of cache deletion
    this.notifySubscribers(key, null);
  }

  clear() {
    this.memoryCache.clear();
    try {
      this.cacheKeys.forEach(key => {
        localStorage.removeItem(`cache_${key}`);
      });
      localStorage.removeItem('route_cache_keys');
    } catch (error) {
      console.warn('Failed to clear localStorage cache:', error);
    }
    this.cacheKeys = [];

    // Notify all subscribers
    this.subscribers.forEach((callbacks) => {
      callbacks.forEach(callback => callback(null));
    });
  }

  // Subscribe to cache changes for a specific key
  subscribe(key, callback) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Notify subscribers of cache changes
  notifySubscribers(key, data) {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Invalidate cache for a route pattern
  invalidatePattern(routePattern) {
    const keysToDelete = this.cacheKeys.filter(key => key.includes(routePattern));
    keysToDelete.forEach(key => this.delete(key));
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Custom hook for route-based data caching
 * @param {string} route - The route identifier
 * @param {Function} fetchFunction - Function that returns a Promise with the data
 * @param {Object} options - Configuration options
 * @returns {Object} - { data, isLoading, error, refetch, clearCache }
 */
export const useRouteCache = (route, fetchFunction, options = {}) => {
  const {
    filters = {},
    enabled = true,
    staleWhileRevalidate = true,
    refetchOnMount = false,
    refetchInterval = null,
  } = options;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);

  const cacheKey = cacheManager.generateCacheKey(route, filters);
  const abortControllerRef = useRef();
  const intervalRef = useRef();

  // Fetch data function
  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled || !fetchFunction) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Try to get from cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = cacheManager.get(route, filters);
        if (cached) {
          setData(cached.data);
          setIsStale(cached.isStale);
          setError(null);

          // If using stale-while-revalidate and data is stale, fetch in background
          if (staleWhileRevalidate && cached.isStale) {
            // Background fetch without showing loading state
            try {
              const freshData = await fetchFunction({ signal: abortController.signal });
              cacheManager.set(route, filters, freshData);
              setData(freshData);
              setIsStale(false);
            } catch (bgError) {
              console.warn('Background refresh failed:', bgError);
            }
          }

          return cached.data;
        }
      }

      // No cache hit or force refresh - show loading and fetch
      setIsLoading(true);
      setError(null);

      const freshData = await fetchFunction({ signal: abortController.signal });
      
      // Update cache and state
      cacheManager.set(route, filters, freshData);
      setData(freshData);
      setIsStale(false);
      setError(null);

      return freshData;
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error(`Failed to fetch data for route ${route}:`, err);
      setError(err);
      
      // If we have stale data, keep showing it
      if (!data) {
        setData(null);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [route, fetchFunction, filters, enabled, staleWhileRevalidate, data]);

  // Initial fetch
  useEffect(() => {
    fetchData(refetchOnMount);
  }, [fetchData, refetchOnMount]);

  // Set up refetch interval
  useEffect(() => {
    if (refetchInterval && enabled) {
      intervalRef.current = setInterval(() => {
        fetchData(false); // Don't force refresh on interval
      }, refetchInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [fetchData, refetchInterval, enabled]);

  // Subscribe to cache changes
  useEffect(() => {
    const unsubscribe = cacheManager.subscribe(cacheKey, (newData) => {
      if (newData === null) {
        // Cache was cleared
        setData(null);
        setIsStale(false);
      } else {
        // Cache was updated
        setData(newData);
        setIsStale(false);
      }
    });

    return unsubscribe;
  }, [cacheKey]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Manual refetch function
  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cache for this route
  const clearCache = useCallback(() => {
    cacheManager.delete(cacheKey);
  }, [cacheKey]);

  // Clear all cache for this route pattern
  const clearRouteCache = useCallback(() => {
    cacheManager.invalidatePattern(route);
  }, [route]);

  return {
    data,
    isLoading,
    error,
    isStale,
    refetch,
    clearCache,
    clearRouteCache,
    cacheKey
  };
};

// Hook for managing global cache
export const useGlobalCache = () => {
  const clearAllCache = useCallback(() => {
    cacheManager.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      memorySize: cacheManager.memoryCache.size,
      localStorageSize: cacheManager.cacheKeys.length,
    };
  }, []);

  return {
    clearAllCache,
    getCacheStats
  };
};

// Higher-order component for cache management
export const withCache = (WrappedComponent) => {
  return function CachedComponent(props) {
    const { clearAllCache, getCacheStats } = useGlobalCache();
    
    return (
      <WrappedComponent
        {...props}
        clearCache={clearAllCache}
        getCacheStats={getCacheStats}
      />
    );
  };
};