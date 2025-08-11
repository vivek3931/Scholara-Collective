import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faFlag,
  faFileAlt,
  faStar,
  faEye,
  faSpinner,
  faTimes,
  faExternalLinkAlt,
  faChevronLeft,
  faChevronRight,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useModal } from "../../context/ModalContext/ModalContext";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = `../../../workers/pdf.worker.min.js`;

const ResourceCard = React.memo(({ resource, onSave, onFlag, isSavedPage = false, onUnsave }) => {
  const { token, isAuthenticated } = useAuth();
  const { showModal } = useModal();
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [unsaving, setUnsaving] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [useFallback, setUseFallback] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  
  // Refs for cleanup and abort control
  const previewContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const previewDataUrlRef = useRef(null);
  const isPreviewMountedRef = useRef(false);
  
  // Cache management - using a Map to store cached previews
  const previewCacheRef = useRef(new Map());
  const cacheTimeoutRef = useRef(new Map());
  
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
  // Cache settings
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  const MAX_CACHE_SIZE = 20; // Maximum number of cached previews

  // Cache management functions
  const getCachedPreview = useCallback((resourceId) => {
    const cached = previewCacheRef.current.get(resourceId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Using cached preview for resource: ${resourceId}`);
      return cached.dataUrl;
    }
    return null;
  }, [CACHE_DURATION]);

  const setCachedPreview = useCallback((resourceId, dataUrl) => {
    const cache = previewCacheRef.current;
    const timeouts = cacheTimeoutRef.current;
    
    // Implement LRU cache by removing oldest entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value;
      const oldEntry = cache.get(oldestKey);
      if (oldEntry) {
        URL.revokeObjectURL(oldEntry.dataUrl);
        cache.delete(oldestKey);
        
        if (timeouts.has(oldestKey)) {
          clearTimeout(timeouts.get(oldestKey));
          timeouts.delete(oldestKey);
        }
      }
    }
    
    // Add new entry to cache
    cache.set(resourceId, {
      dataUrl,
      timestamp: Date.now()
    });
    
    // Set up automatic cleanup after cache duration
    const timeoutId = setTimeout(() => {
      const entry = cache.get(resourceId);
      if (entry) {
        URL.revokeObjectURL(entry.dataUrl);
        cache.delete(resourceId);
        timeouts.delete(resourceId);
      }
    }, CACHE_DURATION);
    
    timeouts.set(resourceId, timeoutId);
    
    console.log(`Cached preview for resource: ${resourceId}, cache size: ${cache.size}`);
  }, [CACHE_DURATION, MAX_CACHE_SIZE]);

  const clearCache = useCallback(() => {
    // Clean up all cached URLs
    previewCacheRef.current.forEach((entry) => {
      URL.revokeObjectURL(entry.dataUrl);
    });
    previewCacheRef.current.clear();
    
    // Clear all timeouts
    cacheTimeoutRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    cacheTimeoutRef.current.clear();
    
    console.log('Preview cache cleared');
  }, []);

  // Cleanup function for preview resources (but preserve cache)
  const cleanupPreviewResources = useCallback(() => {
    // Cancel any ongoing fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    // Only revoke current preview URL if it's not cached
    if (previewDataUrlRef.current) {
      const isCached = Array.from(previewCacheRef.current.values()).some(
        entry => entry.dataUrl === previewDataUrlRef.current
      );
      
      if (!isCached) {
        URL.revokeObjectURL(previewDataUrlRef.current);
      }
      previewDataUrlRef.current = null;
    }
    
    // Reset preview state
    setPreviewDataUrl(null);
    setPreviewLoading(false);
    setPreviewError(null);
    setUseFallback(false);
    setNumPages(null);
    setPageNumber(1);
    setZoom(1);
    isPreviewMountedRef.current = false;
  }, []);

  // Handle modal body styles
  useEffect(() => {
    if (showPreviewModal) {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      // Prevent cursor blinking and disable text selection when modal is open
      document.body.style.overflow = "hidden";
      document.body.style.cursor = "default";
      document.body.style.userSelect = "none";
      document.body.style.webkitUserSelect = "none";
      document.body.style.msUserSelect = "none";
      document.body.style.mozUserSelect = "none";
      
      // Add a class to body for additional CSS control
      document.body.classList.add('modal-open');
    } else {
      // Restore original styles
      document.body.style.overflow = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.msUserSelect = "";
      document.body.style.mozUserSelect = "";
      
      document.body.classList.remove('modal-open');
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.msUserSelect = "";
      document.body.style.mozUserSelect = "";
      document.body.classList.remove('modal-open');
    };
  }, [showPreviewModal]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      cleanupPreviewResources();
      clearCache(); // Clear cache on unmount
    };
  }, [cleanupPreviewResources, clearCache]);

  // Start loading timeout with proper cleanup
  const startLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      if (isPreviewMountedRef.current) {
        setUseFallback(true);
        setPreviewError(
          "Preview is taking too long to load. You might want to download the file instead."
        );
        setPreviewLoading(false);
      }
    }, 30000);
  }, []);

  const getTypeClasses = (type) => {
    const normalizedType = type?.toLowerCase();
    if (normalizedType && normalizedType.includes("pdf"))
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 font-poppins";
    if (normalizedType && normalizedType.includes("image"))
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 font-poppins";
    if (
      normalizedType &&
      (normalizedType.includes("doc") ||
        normalizedType.includes("xls") ||
        normalizedType.includes("ppt"))
    )
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 font-poppins";
    return "bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-200 font-poppins";
  };

  const genericBgColor = "#F59E0B";

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesomeIcon
            key={`full-${i}`}
            icon={faStar}
            className="text-yellow-500 dark:text-amber-400 "
          />
        ))}
        {hasHalfStar && (
          <FontAwesomeIcon
            icon={faStar}
            className="text-yellow-500 dark:text-amber-400 opacity-50"
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesomeIcon
            key={`empty-${i}`}
            icon={faStar}
            className="text-yellow-500 dark:text-amber-400"
          />
        ))}
      </div>
    );
  };

  const getFileExtension = (url) => {
    if (!url) return "";
    try {
      const path = new URL(url).pathname;
      const lastDotIndex = path.lastIndexOf(".");
      if (lastDotIndex > -1) {
        return path.substring(lastDotIndex).split(/[?#]/)[0].toLowerCase();
      }
    } catch (e) {
      console.error("Error parsing URL:", e);
    }
    return "";
  };

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }) => {
      if (isPreviewMountedRef.current) {
        console.log("PDF loaded successfully, pages:", numPages);
        setNumPages(numPages);
        setPreviewLoading(false);
        setPreviewError(null);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    },
    []
  );

  const onDocumentLoadError = useCallback(
    (error) => {
      if (isPreviewMountedRef.current) {
        console.error("Error loading PDF document:", error);
        setPreviewError(
          "Failed to load PDF preview. It might be corrupted or incompatible."
        );
        setUseFallback(true);
        setPreviewLoading(false);
        
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    },
    []
  );

  const handleDownload = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message:
          "You need to be logged in to download resources. Please log in or create an account.",
        confirmText: "Go to Login",
        onConfirm: () => window.location.href = "/login",
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    setDownloading(true);
    try {
      console.log("Initiating download for:", resource.title);
      const response = await fetch(
        `${API_URL}/resources/${resource._id}/download`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.msg || "Unknown error"
          }`
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${resource.title.replace(
        /[^a-z0-9._-]/gi,
        "_"
      )}${getFileExtension(resource.cloudinaryUrl)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      showModal({
        type: "success",
        title: "Download Started",
        message: "Your download has started successfully!",
        confirmText: "OK",
      });

      await fetch(`${API_URL}/resources/${resource._id}/increment-download`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Download count incremented.");
    } catch (error) {
      console.error("Download failed:", error);
      showModal({
        type: "error",
        title: "Download Failed",
        message: `Could not download the file: ${error.message}. Please try again.`,
        confirmText: "Close",
      });
    } finally {
      setDownloading(false);
    }
  };

  const documentProps = useMemo(
    () => ({
      file: previewDataUrl,
      onLoadSuccess: onDocumentLoadSuccess,
      onLoadError: onDocumentLoadError,
      className: "w-full h-full overflow-auto",
      loading: (
        <div className="flex flex-col items-center text-gray-600 dark:text-platinum font-poppins">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="2x"
            className="mb-3 text-amber-600 dark:text-amber-200"
          />
          <span>Loading PDF...</span>
        </div>
      ),
      error: (
        <div className="text-center text-red-600 dark:text-amber-300 font-poppins">
          <p className="mb-2">Error rendering PDF. Please try downloading.</p>
          <button
            onClick={handleDownload}
            className="mt-4 px-4 py-2 bg-amber-600 text-white dark:bg-onyx/90 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-orange-400 dark:via-amber-500 dark:to-yellow-500 rounded-md hover:bg-amber-700 dark:hover:bg-amber-950/90 font-poppins shadow-glow-sm"
          >
            <FontAwesomeIcon icon={faDownload} className="mr-2" /> Download File
          </button>
        </div>
      ),
      renderTextLayer: false,
      renderAnnotationLayer: false,
    }),
    [previewDataUrl, onDocumentLoadSuccess, onDocumentLoadError, handleDownload]
  );

  const pageProps = useMemo(
    () => ({
      pageNumber: pageNumber,
      scale: zoom,
      renderTextLayer: false,
      renderAnnotationLayer: false,
      className: "shadow-lg my-2",
    }),
    [pageNumber, zoom]
  );

  const handlePreview = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message:
          "You need to be logged in to preview resources. Please log in or create an account.",
        confirmText: "Go to Login",
        onConfirm: () => window.location.href = "/login",
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    console.log("Opening preview modal");
    setShowPreviewModal(true);
    isPreviewMountedRef.current = true;
    
    // Check if preview is already cached
    const cachedDataUrl = getCachedPreview(resource._id);
    if (cachedDataUrl) {
      // Use cached data immediately
      previewDataUrlRef.current = cachedDataUrl;
      setPreviewDataUrl(cachedDataUrl);
      setPreviewLoading(false);
      setPreviewError(null);
      return;
    }

    // Clean up any existing preview resources first (but preserve cache)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    setPreviewLoading(true);
    setPreviewError(null);
    setUseFallback(false);
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    startLoadingTimeout();

    try {
      console.log(`Fetching preview for resource: ${resource._id}`);
      const response = await fetch(
        `${API_URL}/resources/${resource._id}/preview`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: abortControllerRef.current.signal,
        }
      );

      // Check if component is still mounted and request wasn't aborted
      if (!isPreviewMountedRef.current || abortControllerRef.current?.signal.aborted) {
        return;
      }

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.msg || "Unknown error"
          }`
        );
      }

      const blob = await response.blob();
      
      // Check again if component is still mounted
      if (!isPreviewMountedRef.current) {
        return;
      }
      
      const url = URL.createObjectURL(blob);
      previewDataUrlRef.current = url;
      setPreviewDataUrl(url);
      setPreviewLoading(false);
      
      // Cache the preview data
      setCachedPreview(resource._id, url);
      
    } catch (error) {
      // Check if error is due to abortion (user closed modal)
      if (error.name === 'AbortError' || !isPreviewMountedRef.current) {
        console.log("Preview request aborted");
        return;
      }
      
      console.error("Preview failed:", error);
      if (isPreviewMountedRef.current) {
        setPreviewError(
          `Failed to load preview: ${error.message}. This file might not be directly viewable.`
        );
        setUseFallback(true);
        setPreviewLoading(false);
        showModal({
          type: "error",
          title: "Preview Failed",
          message: `Could not load preview for this file: ${error.message}. It might be corrupted or an unsupported format. Please try downloading it instead.`,
          confirmText: "OK",
        });
      }
    }
  };

  const handleClosePreviewModal = useCallback(() => {
    console.log("Closing preview modal");
    setShowPreviewModal(false);
    // Clean up all preview resources
    cleanupPreviewResources();
  }, [cleanupPreviewResources]);

  const changePage = useCallback(
    (offset) => {
      setPageNumber((prevPageNumber) =>
        Math.max(1, Math.min(prevPageNumber + offset, numPages))
      );
    },
    [numPages]
  );

  const handleZoomIn = useCallback(
    () => setZoom((prev) => Math.min(prev + 0.1, 3)),
    []
  );
  const handleZoomOut = useCallback(
    () => setZoom((prev) => Math.max(prev - 0.1, 0.5)),
    []
  );

  const handleSave = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message:
          "You need to be logged in to save resources to your library. Please log in or create an account.",
        confirmText: "Go to Login",
        onConfirm: () => window.location.href = "/login",
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(
        `${API_URL}/resources/${resource._id}/save`,
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
          message: "This resource has been successfully added to your library!",
          confirmText: "Great!",
        });
        onSave?.(resource._id);
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
        onConfirm: () => window.location.href = "/login",
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    showModal({
      type: "info",
      title: "Confirm Flagging",
      message: "Are you sure you want to flag this resource for review? This action cannot be undone.",
      confirmText: "Flag",
      onConfirm: async () => {
        setFlagging(true);
        try {
          const response = await fetch(
            `${API_URL}/resources/${resource._id}/flag`,
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
            onFlag?.(resource._id);
          } else {
            showModal({
              type: "error",
              title: "Failed to Flag",
              message: `Could not flag resource: ${data.msg || "Unknown error"}`,
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

  const handleUnsave = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message:
          "You need to be logged in to remove resources from your library. Please log in or create an account.",
        confirmText: "Go to Login",
        onConfirm: () => window.location.href = "/login",
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    showModal({
      type: "warning",
      title: "Remove from Library?",
      message: `Are you sure you want to remove "${resource.title}" from your saved resources?`,
      confirmText: "Remove",
      onConfirm: async () => {
        setUnsaving(true);
        try {
          const response = await fetch(
            `${API_URL}/resources/${resource._id}/unsave`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || "Failed to unsave resource");
          }

          onUnsave?.(resource._id);
          showModal({
            type: "success",
            title: "Resource Removed",
            message: "The resource has been removed from your saved library.",
            confirmText: "OK",
          });
        } catch (error) {
          console.error("Error unsaving resource:", error);
          showModal({
            type: "error",
            title: "Error",
            message: `Failed to remove resource: ${error.message}`,
            confirmText: "OK",
          });
        } finally {
          setUnsaving(false);
        }
      },
      cancelText: "Cancel",
      isDismissible: true,
    });
  };

  const isPDF =
    resource.cloudinaryUrl &&
    getFileExtension(resource.cloudinaryUrl) === ".pdf";
  const isImage =
    resource.cloudinaryUrl &&
    (getFileExtension(resource.cloudinaryUrl) === ".jpg" ||
      getFileExtension(resource.cloudinaryUrl) === ".jpeg" ||
      getFileExtension(resource.cloudinaryUrl) === ".png" ||
      getFileExtension(resource.cloudinaryUrl) === ".gif" ||
      getFileExtension(resource.cloudinaryUrl) === ".svg");

  const handleModalBackgroundClick = useCallback(
    (e) => {
      if (e.target === e.currentTarget) {
        console.log("Background clicked, closing modal");
        handleClosePreviewModal();
      }
    },
    [handleClosePreviewModal]
  );

  // Create the modal component
  const modalContent = showPreviewModal && (
    <div
      className="modal-backdrop fixed inset-0 flex items-center pt-20 scroll-container justify-center bg-black bg-opacity-75 p-4 overflow-hidden"
      style={{
        cursor: 'default',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        msUserSelect: 'none',
        MozUserSelect: 'none',
        zIndex: 2147483647,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={handleModalBackgroundClick}
    >
      <div
        className="modal-content relative bg-white dark:bg-onyx/90 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col font-poppins pointer-events-auto"
        style={{
          cursor: 'default',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
          MozUserSelect: 'none',
          zIndex: 2147483647,
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-onyx flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:bg-gradient-to-r dark:from-orange-400 dark:via-amber-500 dark:to-yellow-500 dark:bg-clip-text dark:text-transparent font-poppins">
            Preview: {resource.title}
          </h2>
          <div className="flex items-center gap-2">
            {isPDF && !previewError && (
              <>
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-2 rounded-full hover:bg-gray-100 hover:scale-105 dark:hover:bg-charcoal transition duration-200 text-gray-600 dark:text-amber-200 disabled:opacity-50 shadow-glow-sm"
                  style={{ cursor: 'pointer' }}
                >
                  <ZoomOut size={20} />
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-2 rounded-full hover:bg-gray-100 hover:scale-105 dark:hover:bg-charcoal transition duration-200 text-gray-600 dark:text-amber-200 disabled:opacity-50 shadow-glow-sm"
                  style={{ cursor: 'pointer' }}
                >
                  <ZoomIn size={20} />
                </button>
              </>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 rounded-full bg-gray-100 text-amber-600 hover:bg-gray-200 dark:bg-onyx/90 dark:text-amber-200 hover:scale-105 dark:hover:bg-charcoal transition duration-200 disabled:opacity-50 shadow-glow-sm"
              style={{ cursor: 'pointer' }}
              title="Download File"
            >
              {downloading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faDownload} />
              )}
            </button>
            <button
              onClick={handleClosePreviewModal}
              className="p-2 rounded-full hover:bg-gray-100 hover:scale-105 dark:hover:bg-charcoal transition duration-200 text-gray-600 dark:text-amber-200 shadow-glow-sm"
              style={{ cursor: 'pointer' }}
              title="Close Preview"
            >
              <FontAwesomeIcon icon={faTimes} size="lg" />
            </button>
          </div>
        </div>
        <div
          ref={previewContainerRef}
          className="flex-1 overflow-auto p-4 flex items-center justify-center"
          style={{ 
            minHeight: 0, 
            scrollbarWidth: "none",
            cursor: 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            msUserSelect: 'none',
            MozUserSelect: 'none'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {previewLoading && !previewError && (
            <div className="flex flex-col items-center justify-center text-gray-600 dark:text-platinum font-poppins">
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                size="2x"
                className="mb-3 text-amber-600 dark:text-amber-200"
              />
              <span>Loading preview...</span>
            </div>
          )}
          {previewError && (
            <div className="text-center text-red-600 dark:text-amber-300 font-poppins">
              <p className="mb-2">{previewError}</p>
              {useFallback && (
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-onyx/90 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-orange-400 dark:via-amber-500 dark:to-yellow-500 dark:hover:bg-amber-950/90 rounded-md shadow-glow-sm font-poppins"
                  style={{ cursor: 'pointer' }}
                  disabled={downloading}
                >
                  {downloading ? (
                    <FontAwesomeIcon
                      icon={faSpinner}
                      spin
                      className="mr-2"
                    />
                  ) : (
                    <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  )}
                  Download File
                </button>
              )}
              {resource.cloudinaryUrl && (
                <a
                  href={resource.cloudinaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 ml-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-onyx rounded-md shadow-sm text-sm text-gray-700 dark:text-platinum bg-white dark:bg-onyx/90 hover:bg-gray-50 dark:hover:bg-amber-50/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-200 font-poppins"
                  style={{ cursor: 'pointer' }}
                >
                  <FontAwesomeIcon
                    icon={faExternalLinkAlt}
                    className="mr-2 text-amber-600 dark:text-amber-200"
                  />{" "}
                  Open in New Tab
                </a>
              )}
            </div>
          )}
          {!previewLoading && !previewError && previewDataUrl && (
            <>
              {isPDF ? (
                <div className="flex flex-col items-center w-full h-full">
                  <Document {...documentProps}>
                    <Page key={`page_${pageNumber}`} {...pageProps} />
                  </Document>
                  {numPages > 1 && (
                    <div className="flex justify-center items-center mt-4 gap-4 bg-gray-100 dark:bg-amber-950/90 p-2 rounded-lg flex-shrink-0">
                      <button
                        onClick={() => changePage(-1)}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-amber-800 text-gray-600 dark:text-amber-200 disabled:opacity-50 shadow-glow-sm"
                        style={{ cursor: pageNumber <= 1 ? 'default' : 'pointer' }}
                      >
                        <FontAwesomeIcon icon={faChevronLeft} />
                      </button>
                      <span className="text-gray-700 dark:text-platinum font-poppins">
                        Page {pageNumber} of {numPages}
                      </span>
                      <button
                        onClick={() => changePage(1)}
                        disabled={pageNumber >= numPages}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-amber-800 text-gray-600 dark:text-amber-200 disabled:opacity-50 shadow-glow-sm"
                        style={{ cursor: pageNumber >= numPages ? 'default' : 'pointer' }}
                      >
                        <FontAwesomeIcon icon={faChevronRight} />
                      </button>
                    </div>
                  )}
                </div>
              ) : isImage ? (
                <img
                  src={previewDataUrl}
                  alt={resource.title}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    cursor: 'default',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    msUserSelect: 'none',
                    MozUserSelect: 'none'
                  }}
                  onLoad={() => {
                    if (isPreviewMountedRef.current) {
                      setPreviewLoading(false);
                    }
                  }}
                  onError={() => {
                    if (isPreviewMountedRef.current) {
                      setPreviewError("Failed to load image preview.");
                      setUseFallback(true);
                      setPreviewLoading(false);
                      showModal({
                        type: "error",
                        title: "Image Preview Failed",
                        message:
                          "Could not load image preview. The file might be corrupted or in an unsupported format.",
                        confirmText: "OK",
                      });
                    }
                  }}
                />
              ) : (
                <div className="text-center text-gray-600 dark:text-platinum font-poppins">
                  <p className="mb-2">
                    This file type is not directly previewable in the
                    browser.
                  </p>
                  <p className="mb-4">
                    Please download the file to view it.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-amber-600 text-white hover:bg-amber-700 dark:bg-onyx/90 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-orange-400 dark:via-amber-500 dark:to-yellow-500 dark:hover:bg-amber-950/90 rounded-md shadow-glow-sm font-poppins"
                    style={{ cursor: 'pointer' }}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <FontAwesomeIcon
                        icon={faSpinner}
                        spin
                        className="mr-2"
                      />
                    ) : (
                      <FontAwesomeIcon icon={faDownload} className="mr-2" />
                    )}
                    Download File
                  </button>
                  {resource.cloudinaryUrl && (
                    <a
                      href={resource.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 ml-2 inline-flex items-center px-4 py-2 border border-gray-300 dark:border-onyx rounded-md shadow-sm text-sm text-gray-700 dark:text-platinum bg-white dark:bg-onyx/90 hover:bg-gray-50 dark:hover:bg-amber-50/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-200 font-poppins"
                      style={{ cursor: 'pointer' }}
                    >
                      <FontAwesomeIcon
                        icon={faExternalLinkAlt}
                        className="mr-2 text-amber-600 dark:text-amber-200"
                      />{" "}
                      Open in New Tab
                    </a>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-charcoal/95 rounded-2xl overflow-hidden shadow-glow-sm animate-fade-in font-poppins">
      <div
        className="h-36 flex items-center justify-center text-white relative"
        style={{ backgroundColor: genericBgColor }}
      >
        <FontAwesomeIcon icon={faFileAlt} size="3x" className="opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 opacity-20"></div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:bg-gradient-to-r dark:from-orange-400 dark:via-amber-500 dark:to-yellow-500 dark:bg-clip-text dark:text-transparent line-clamp-2 font-poppins">
            {resource.title}
          </h3>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium uppercase ${getTypeClasses(
              resource.fileType
            )}`}
          >
            {resource.fileType || "Document"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-platinum mb-3">
          <span>{resource.subject}</span>
          <span>•</span>
          <span>{resource.uploadedBy?.username || "Unknown"}</span>
          {resource.year && (
            <>
              <span>•</span>
              <span>{resource.year}</span>
            </>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-platinum mb-4 line-clamp-2">
          {resource.description || "No description available"}
        </p>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1">
            {renderStars(resource.averageRating || 0)}
            <span className="text-xs text-gray-600 dark:text-platinum ml-1">
              (
              {resource.averageRating
                ? resource.averageRating.toFixed(1)
                : "0.0"}
              )
            </span>
          </div>
          <div className="text-xs text-gray-600 dark:text-platinum">
            {resource.downloads || 0} downloads
          </div>
        </div>
        {resource.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2.5 py-1 bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 text-xs rounded-full text-white font-poppins"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-onyx">
          <button
            onClick={handlePreview}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-onyx/90 dark:text-gray-300 hover:scale-105 dark:hover:bg-charcoal transition duration-200 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 shadow-glow-sm font-poppins"
            disabled={previewLoading || (!isPDF && !isImage)}
            title={
              !isPDF && !isImage
                ? "Preview not available for this file type"
                : "Preview Document"
            }
          >
            {previewLoading ? (
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-amber-600 dark:text-amber-200"
              />
            ) : (
              <FontAwesomeIcon
                icon={faEye}
                className="text-gray-600 dark:text-amber-200"
              />
            )}
            Preview
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2 rounded-lg bg-gray-100 text-amber-600 hover:bg-gray-200 dark:bg-onyx/90 dark:text-amber-200 hover:scale-105 dark:hover:bg-charcoal transition duration-200 disabled:opacity-50 shadow-glow-sm font-poppins"
              title="Download"
            >
              {downloading ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-amber-600 dark:text-amber-200"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faDownload}
                  className="text-amber-600 dark:text-amber-200"
                />
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-2 rounded-lg bg-gray-100 text-amber-600 hover:bg-gray-200 dark:bg-onyx/90 dark:text-amber-200 hover:scale-105 dark:hover:bg-charcoal transition duration-200 disabled:opacity-50 shadow-glow-sm font-poppins"
              title="Save to Library"
            >
              {saving ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-amber-600 dark:text-amber-200"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faBookmark}
                  className="text-amber-600 dark:text-amber-200"
                />
              )}
            </button>
            <button
              onClick={handleFlag}
              disabled={flagging}
              className="p-2 rounded-lg bg-gray-100 text-amber-600 hover:bg-gray-200 dark:bg-onyx/90 dark:text-amber-200 hover:scale-105 dark:hover:bg-charcoal transition duration-200 disabled:opacity-50 shadow-glow-sm font-poppins"
              title="Flag Content"
            >
              {flagging ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="text-amber-600 dark:text-amber-200"
                />
              ) : (
                <FontAwesomeIcon
                  icon={faFlag}
                  className="text-amber-600 dark:text-amber-200"
                />
              )}
            </button>
            {isSavedPage && (
              <button
                onClick={handleUnsave}
                disabled={unsaving}
                className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 transition duration-200 disabled:opacity-50 shadow-glow-sm font-poppins"
                title="Remove from Saved Resources"
              >
                {unsaving ? (
                  <FontAwesomeIcon
                    icon={faSpinner}
                    spin
                    className="text-red-600 dark:text-red-300"
                  />
                ) : (
                  <FontAwesomeIcon
                    icon={faTrash}
                    className="text-red-600 dark:text-red-300"
                  />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Render modal using portal to document.body */}
      {modalContent && createPortal(modalContent, document.body)}
    </div>
  );
});

export default ResourceCard;