import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import coin from "../../assets/coin.svg";
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
  faTrashAlt,
  faCalendar,
  faUser,
  faGraduationCap,
  faCoins,
  faEllipsisV,
  faUserPlus,
  faUpload,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";
import { ZoomIn, ZoomOut } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useModal } from "../../context/ModalContext/ModalContext";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import axios from "axios";

pdfjs.GlobalWorkerOptions.workerSrc = `../../../workers/pdf.worker.min.js`;

const UniversalResourceCard = React.memo(
  ({
    resource,
    variant = "default",
    onSave,
    onFlag,
    onUnsave,
    onResourceDeleted,
    showPreview = true,
    showActions = true,
    showStats = true,
    showTags = true,
    showDescription = true,
    className = "",
  }) => {
    // Destructure `user` and `fetchUserCoins` from useAuth
    const { token, isAuthenticated, user, fetchUserCoins, updateUser } =
      useAuth();
    const { showModal } = useModal();
    const isAdmin = user?.roles == "admin";
    console.log(isAdmin);

    // State management
    const [downloading, setDownloading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [flagging, setFlagging] = useState(false);
    const [unsaving, setUnsaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [isDeleted, setIsDeleted] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);
    const [useFallback, setUseFallback] = useState(false);
    const [previewDataUrl, setPreviewDataUrl] = useState(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [purchasing, setPurchasing] = useState(false); // Add purchasing state
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Refs
    const previewContainerRef = useRef(null);
    const abortControllerRef = useRef(null);
    const loadingTimeoutRef = useRef(null);
    const previewDataUrlRef = useRef(null);
    const isPreviewMountedRef = useRef(false);
    const dropdownRef = useRef(null);

    // Cache management
    const previewCacheRef = useRef(new Map());
    const cacheTimeoutRef = useRef(new Map());

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
    const MAX_CACHE_SIZE = 20;
    const cost = 30; // Cost of the resource
    const isOwner = user && resource.uploadedBy?._id === user._id;

    // Get current user coins from context, default to 0 if not available
    const userCoins = user?.scholaraCoins || 0;

    // Helper functions
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

    const isPDF =
      resource.cloudinaryUrl &&
      getFileExtension(resource.cloudinaryUrl) === ".pdf";
    const isImage =
      resource.cloudinaryUrl &&
      [".jpg", ".jpeg", ".png", ".gif", ".svg"].includes(
        getFileExtension(resource.cloudinaryUrl)
      );

    // Effects
    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);
      return () => window.removeEventListener("resize", checkMobile);
    }, []);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Fetch purchase status when authenticated and resource._id changes
    useEffect(() => {
      const fetchPurchaseStatus = async () => {
        if (!isAuthenticated || !token || !user) {
          setIsPurchased(false);
          return;
        }

        if (isAdmin) {
          setIsPurchased(true); // Treat admin as having "purchased" everything
          return;
        }
        // Check if the user's purchasedResources array (which comes with the user object from context)
        // includes the current resource's ID.
        const purchased =
          user.purchasedResources?.includes(resource._id) || false;
        setIsPurchased(purchased);
      };
      // Trigger fetch when auth state or resource ID changes
      fetchPurchaseStatus();
    }, [isAuthenticated, token, user?.purchasedResources, resource._id, user]);

    useEffect(() => {
      return () => {
        // Cleanup preview resources
        if (previewDataUrlRef.current) {
          URL.revokeObjectURL(previewDataUrlRef.current);
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      };
    }, []);

    // Cache management
    const getCachedPreview = useCallback(
      (resourceId) => {
        const cached = previewCacheRef.current.get(resourceId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.dataUrl;
        }
        return null;
      },
      [CACHE_DURATION]
    );

    const setCachedPreview = useCallback(
      (resourceId, dataUrl) => {
        const cache = previewCacheRef.current;
        const timeouts = cacheTimeoutRef.current;

        // Clean oldest cache if we're at max size
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

        cache.set(resourceId, { dataUrl, timestamp: Date.now() });
        const timeoutId = setTimeout(() => {
          const entry = cache.get(resourceId);
          if (entry) {
            URL.revokeObjectURL(entry.dataUrl);
            cache.delete(resourceId);
            timeouts.delete(resourceId);
          }
        }, CACHE_DURATION);

        timeouts.set(resourceId, timeoutId);
      },
      [CACHE_DURATION, MAX_CACHE_SIZE]
    );

    // PDF handlers
    const onDocumentLoadSuccess = useCallback(({ numPages }) => {
      if (isPreviewMountedRef.current) {
        setNumPages(numPages);
        setPreviewLoading(false);
        setPreviewError(null);
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    }, []);

    const onDocumentLoadError = useCallback((error) => {
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
    }, []);

    // Action handlers
    const handleDownload = async () => {
      if (!isAuthenticated) {
        showModal({
          type: "warning",
          title: "Authentication Required",
          message: "You need to be logged in to download resources.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }

      setDownloading(true);
      try {
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
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(
              errorData.msg || "Download failed due to server error."
            );
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
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

        // Increment download count only after a successful download attempt
        await fetch(`${API_URL}/resources/${resource._id}/increment-download`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Download failed:", error);
        showModal({
          type: "error",
          title: "Download Failed",
          message: `Could not download the file: ${error.message}`,
          confirmText: "Close",
        });
      } finally {
        setDownloading(false);
      }
    };

   const handleSave = async () => {
    if (!isAuthenticated) {
        showModal({
            type: "warning",
            title: "Authentication Required",
            message: "You need to be logged in to save resources to your library. Please log in or create an account.",
            confirmText: "Go to Login",
            onConfirm: () => (window.location.href = "/login"),
            cancelText: "Cancel",
            isDismissible: true,
        });
        return;
    }
    setSaving(true);
    if (!resource || !resource._id) {
    console.error("Resource or Resource ID is undefined.");
    showModal({
      type: "error",
      title: "Save Error",
      message: "Could not save the resource. Resource information is missing.",
      confirmText: "OK",
    });
    return;
  }
    try {
        const response = await fetch(
            `${API_URL}/resources/${resource._id}/save`, {
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
            message: "An unexpected error occurred while saving the resource. Please try again.",
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
          message: "You need to be logged in to flag resources.",
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
        message: "Are you sure you want to flag this resource for review?",
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
                message: "Thank you for helping maintain content quality!",
                confirmText: "Got It",
              });
              onFlag?.(resource._id);
            } else {
              throw new Error(data.msg || "Failed to flag resource");
            }
          } catch (error) {
            console.error("Flag error:", error);
            showModal({
              type: "error",
              title: "Flagging Error",
              message: error.message,
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
          message: "You need to be logged in to remove resources.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }

      showModal({
        type: "warning",
        title: "Remove from Library?",
        message: `Are you sure you want to remove "${resource.title}"?`,
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
              message: "The resource has been removed from your library.",
              confirmText: "OK",
            });
          } catch (error) {
            console.error("Error unsaving resource:", error);
            showModal({
              type: "error",
              title: "Error",
              message: error.message,
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

    const handleDelete = async () => {
      showModal({
        type: "danger",
        title: "Confirm Deletion",
        message: `Are you sure you want to delete "${resource.title}"? This cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: async () => {
          setDeleting(true);
          try {
            const response = await fetch(
              `${API_URL}/resources/${resource._id}/delete-my-resource`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.msg || "Failed to delete resource");
            }

            setIsDeleted(true);
            onResourceDeleted?.(resource._id);
            showModal({
              type: "success",
              title: "Resource Deleted",
              message: "The resource has been successfully deleted.",
              confirmText: "OK",
            });
          } catch (error) {
            console.error("Delete error:", error);
            showModal({
              type: "error",
              title: "Deletion Failed",
              message: error.message,
              confirmText: "Close",
            });
          } finally {
            setDeleting(false);
          }
        },
      });
    };

    const handlePreview = async () => {
      if (!isAuthenticated) {
        showModal({
          type: "warning",
          title: "Authentication Required",
          message: "You need to be logged in to preview resources.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }

      setShowPreviewModal(true);
      isPreviewMountedRef.current = true;

      const cachedDataUrl = getCachedPreview(resource._id);
      if (cachedDataUrl) {
        previewDataUrlRef.current = cachedDataUrl;
        setPreviewDataUrl(cachedDataUrl);
        setPreviewLoading(false);
        setPreviewError(null);
        return;
      }

      // Cleanup any existing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      setPreviewLoading(true);
      setPreviewError(null);
      setUseFallback(false);

      abortControllerRef.current = new AbortController();
      loadingTimeoutRef.current = setTimeout(() => {
        if (isPreviewMountedRef.current) {
          setUseFallback(true);
          setPreviewError(
            "Preview is taking too long to load. Try downloading instead."
          );
          setPreviewLoading(false);
        }
      }, 30000);

      try {
        const response = await fetch(
          `${API_URL}/resources/${resource._id}/preview`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${token}` },
            signal: abortControllerRef.current.signal,
          }
        );

        if (!isPreviewMountedRef.current) return;

        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.msg || "Failed to load preview");
        }

        const blob = await response.blob();
        if (!isPreviewMountedRef.current) return;

        const url = URL.createObjectURL(blob);
        previewDataUrlRef.current = url;
        setPreviewDataUrl(url);
        setPreviewLoading(false);
        setCachedPreview(resource._id, url);
      } catch (error) {
        if (error.name === "AbortError" || !isPreviewMountedRef.current) return;

        console.error("Preview failed:", error);
        setPreviewError(error.message);
        setUseFallback(true);
        setPreviewLoading(false);
      }
    };

    useEffect(() => {
      if (showPreviewModal) {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        document.body.style.overflow = "hidden";
        document.body.classList.add("modal-open");
      } else {
        document.body.style.overflow = "";
        document.body.classList.remove("modal-open");
      }

      return () => {
        document.body.style.overflow = "";
        document.body.classList.remove("modal-open");
      };
    }, [showPreviewModal]);

    const handlePurchase = async () => {
      if (!isAuthenticated) {
        showModal({
          type: "warning",
          title: "Authentication Required",
          message:
            "You need to be logged in to purchase resources. Please log in or create an account.",
          confirmText: "Go to Login",
          onConfirm: () => (window.location.href = "/login"),
          cancelText: "Cancel",
          isDismissible: true,
        });
        return;
      }

      if (userCoins < cost) {
        showInsufficientCoinsModal();
        return;
      }

      setPurchasing(true);

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const res = await axios.post(
          `${API_URL}/resources/${resource._id}/purchase`,
          { cost },
          config
        );

        if (res.data.success) {
          // Immediately update local state
          setIsPurchased(true);

          // Update user context with the returned user data from backend
          if (updateUser && res.data.user) {
            updateUser(res.data.user);
          } else if (updateUser) {
            // Fallback: manual update if backend doesn't return full user object
            updateUser({
              ...user,
              scholaraCoins: res.data.scholaraCoins,
              purchasedResources: res.data.purchasedResources || [
                ...(user.purchasedResources || []),
                resource._id,
              ],
            });
          }

          showModal({
            type: "success",
            title: "Resource Unlocked",
            message: "Resource unlocked successfully! You can now download it.",
            confirmText: "Great!",
          });
        } else {
          throw new Error(res.data.message || "Purchase failed.");
        }
      } catch (error) {
        console.error("Purchase failed:", error);

        // Revert the purchase state on error
        setIsPurchased(false);

        showModal({
          type: "error",
          title: "Purchase Failed",
          message:
            error.response?.data?.message ||
            "Purchase failed. Please try again.",
          confirmText: "OK",
        });
      } finally {
        setPurchasing(false);
      }
    };

    const showInsufficientCoinsModal = () => {
      showModal({
        type: "info",
        title: "Insufficient Coins",
        message: (
          <div className="space-y-4 ">
            <p className="text-gray-600 dark:text-gray-300 font-poppins">
              You need {cost} ScholaraCoins to purchase this resource. You
              currently have {userCoins} coins.
            </p>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faCoins} className="text-amber-500" />
                How to Earn ScholaraCoins:
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faUserPlus}
                    className="text-green-500 text-xs"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Refer friends:</strong> Get 50 coins when they
                    successfully register
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faUpload}
                    className="text-blue-500 text-xs"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Upload resources:</strong> Earn 80 coins for each
                    approved resource
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={faInfoCircle}
                    className="text-purple-500 text-xs"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    <strong>Daily activities:</strong> Complete tasks and earn
                    bonus coins
                  </span>
                </li>
              </ul>
            </div>
          </div>
        ),
        confirmText: "Got it!",
        isDismissible: true,
      });
    };

    const handleClosePreviewModal = useCallback(() => {
      setShowPreviewModal(false);
      isPreviewMountedRef.current = false;
    }, []);

    const changePage = useCallback(
      (offset) => {
        setPageNumber((prev) => Math.max(1, Math.min(prev + offset, numPages)));
      },
      [numPages]
    );

    const handleZoomIn = useCallback(
      () => setZoom((prev) => Math.min(prev + 0.2, 3)),
      []
    );
    const handleZoomOut = useCallback(
      () => setZoom((prev) => Math.max(prev - 0.2, 0.5)),
      []
    );

    // UI helpers
    const renderStars = (rating) => {
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 >= 0.5;
      const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

      return (
        <div className="flex items-center gap-0.5">
          {[...Array(fullStars)].map((_, i) => (
            <FontAwesomeIcon
              key={`full-${i}`}
              icon={faStar}
              className="text-amber-400 text-xs drop-shadow-sm"
            />
          ))}
          {hasHalfStar && (
            <FontAwesomeIcon
              icon={faStar}
              className="text-amber-400 opacity-50 text-xs drop-shadow-sm"
            />
          )}
          {[...Array(emptyStars)].map((_, i) => (
            <FontAwesomeIcon
              key={`empty-${i}`}
              icon={faStar}
              className="text-gray-300 dark:text-gray-600 text-xs"
            />
          ))}
        </div>
      );
    };

    const getCardClasses = () => {
      const base =
        "bg-ivory/95 dark:bg-onyx/95 backdrop-blur-lg rounded-2xl shadow-soft-md border border-silver/50 dark:border-charcoal/50 font-poppins transition-all duration-300 hover:shadow-soft-xl hover:shadow-orange-sm dark:hover:shadow-glow-sm";

      switch (variant) {
        case "compact":
          return `${base} p-3 hover:scale-[1.01]`;
        case "profile":
          return `${base} p-3 hover:scale-[1.01]`;
        case "saved":
          return `${base} p-4 ring-1 ring-amber-200/50 dark:ring-amber-700/30 hover:ring-amber-300/70`;
        default:
          return `${base} p-4 hover:scale-[1.005]`;
      }
    };

    const getTitleClasses = () => {
      switch (variant) {
        case "compact":
        case "profile":
          return "text-sm font-bold text-slate dark:text-platinum line-clamp-1 tracking-tight";
        default:
          return "text-lg font-bold text-slate dark:text-platinum line-clamp-1 tracking-tight";
      }
    };

    const getActionButtons = () => {
      const buttons = [];

      if (showActions) {
        if (variant === "saved") {
          buttons.push({
            key: "unsave",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleUnsave();
            },
            disabled: unsaving,
            className:
              "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600",
            icon: unsaving ? faSpinner : faTrash,
            title: "Remove",
            spin: unsaving,
          });
        } else {
          buttons.push({
            key: "save",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleSave();
            },
            disabled: saving,
            className:
              "text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-600",
            icon: saving ? faSpinner : faBookmark,
            title: "Save",
            spin: saving,
          });
        }

        buttons.push({
          key: "flag",
          onClick: (e) => {
            e?.preventDefault?.();
            e?.stopPropagation?.();
            handleFlag();
          },
          disabled: flagging,
          className:
            "text-orange-500 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600",
          icon: flagging ? faSpinner : faFlag,
          title: "Flag",
          spin: flagging,
        });

        if (isOwner && (variant === "profile" || variant === "default")) {
          buttons.push({
            key: "delete",
            onClick: (e) => {
              e?.preventDefault?.();
              e?.stopPropagation?.();
              handleDelete();
            },
            disabled: deleting,
            className:
              "text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600",
            icon: deleting ? faSpinner : faTrashAlt,
            title: "Delete",
            spin: deleting,
          });
        }
      }

      return buttons;
    };

    const actionButtons = getActionButtons();

    if (isDeleted) return null;

    return (
      <div className={`${getCardClasses()} ${className} group`}>
        <div className="h-full flex flex-col relative p-2 overflow-visible  ">
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-light-subtle dark:bg-gradient-to-br dark:from-transparent dark:via-transparent dark:to-charcoal/30 pointer-events-none rounded-xl" />

          {/* Content wrapper with proper spacing */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Header Section - Enhanced */}
            <div className="flex justify-between items-start mb-3 gap-3">
              <div className="flex-1 min-w-0">
                <h3 className={`${getTitleClasses()} mb-1`}>
                  {variant === "compact" || variant === "profile"
                    ? resource.title
                    : resource.title.length > 20
                    ? resource.title.slice(0, 25) + "..."
                    : resource.title}
                </h3>
              </div>

              {/* File Type Badge - Redesigned */}
              <div className="flex-shrink-0">
                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold
                bg-gradient-to-r from-amber-200 to-amber-300 text-amber-800
                dark:from-charcoal dark:to-ash/20 dark:text-white
                shadow-soft-sm border border-amber-300 dark:border-charcoal/50
                transition-all duration-200 group-hover:shadow-amber-200/50 dark:group-hover:shadow-orange-sm uppercase"
                >
                  {resource.fileType || "Document"}
                </span>
              </div>
            </div>

            {/* Meta Information - Better spacing */}
            <div className="flex items-center gap-2 text-xs text-graphite dark:text-ash mb-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-100 dark:bg-blue-900/20 rounded-md">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  className="text-blue-500 text-xs"
                />
                <span className="font-medium">{resource.subject}</span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 bg-teal-100 dark:bg-teal-900/20 rounded-md">
                <FontAwesomeIcon
                  icon={faUser}
                  className="text-teal-500 text-xs"
                />
                <span className="font-medium">
                  {resource.uploadedBy?.username || "Unknown"}
                </span>
              </div>

              {resource.year && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-md">
                  <FontAwesomeIcon
                    icon={faCalendar}
                    className="text-orange-500 text-xs"
                  />
                  <span className="font-medium">{resource.year}</span>
                </div>
              )}
            </div>

            {/* Description - Improved typography */}
            {showDescription && (
              <div className="mb-3">
                <p
                  className={`text-sm text-graphite dark:text-ash leading-relaxed ${
                    variant === "compact" ? "line-clamp-1" : "line-clamp-2"
                  }`}
                >
                  {resource.description || "No description available"}
                </p>
              </div>
            )}

            {/* Stats Section - Enhanced design */}
            {showStats && (
              <div className="flex items-center justify-between mb-3 p-3 bg-cream/70 dark:bg-charcoal/50 shadow-inner-md rounded-lg">
                <div className="flex items-center gap-2">
                  {renderStars(resource.averageRating || 0)}
                  <span className="text-slate dark:text-platinum text-sm font-semibold">
                    {resource.averageRating?.toFixed(1) || "0.0"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-graphite dark:text-ash">
                  <FontAwesomeIcon icon={faDownload} className="text-xs" />
                  <span className="text-sm font-semibold">
                    {resource.downloads || 0}
                  </span>
                </div>
              </div>
            )}

            {/* Tags - Improved design */}
            {showTags && resource.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {resource.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                    bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500
                    text-white shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {tag}
                  </span>
                ))}
                {resource.tags.length > 3 && (
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                  bg-silver dark:bg-charcoal text-graphite dark:text-ash
                  border border-ash/30 dark:border-charcoal/60"
                  >
                    +{resource.tags.length - 3}
                  </span>
                )}
              </div>
            )}

            {/* Actions Section - Completely redesigned */}
            <div className="mt-auto">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-[#80808009] shadow-inner dark:shadow-[inset_0_2px_4px_0_rgb(0_0_0_/_0.3)] dark:bg-gradient-to-r dark:from-charcoal  rounded-lg sm:rounded-xl border border-silver/50 dark:border-0">

                {/* Price - Enhanced styling */}
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className="flex items-center gap-2 px-2 py-1 bg-ivory dark:bg-onyx rounded-md sm:rounded-lg shadow-soft-sm">
                    <img
                      src={coin}
                      alt="coin"
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    />
                    <span className="text-xs sm:text-sm font-bold text-slate dark:text-amber-300">
                      {cost}
                    </span>
                  </div>
                </div>

                {/* Action Buttons - Improved layout */}
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Main Action Button */}
                  {isPurchased ? (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDownload();
                      }}
                      disabled={downloading}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-slate to-graphite hover:from-graphite hover:to-slate
            dark:from-charcoal dark:to-midnight dark:hover:from-ash/20 dark:hover:to-charcoal
            text-ivory dark:text-platinum rounded-md sm:rounded-lg flex items-center gap-1.5 sm:gap-2 font-medium
            shadow-soft-lg hover:shadow-soft-xl transition-all duration-200 disabled:opacity-60"
                    >
                      {downloading ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="text-xs sm:text-sm"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faDownload}
                          className="text-xs sm:text-sm"
                        />
                      )}
                      <span className="text-xs sm:text-sm">Download</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (userCoins < cost) {
                          showInsufficientCoinsModal();
                        } else {
                          handlePurchase();
                        }
                      }}
                      disabled={purchasing}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md sm:rounded-lg flex items-center gap-1.5 sm:gap-2 font-medium
            shadow-soft-lg hover:shadow-soft-xl transition-all duration-200 disabled:opacity-60 ${
              userCoins < cost
                ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white hover:shadow-red-md"
                : "bg-warm-sunset hover:bg-warm-glow text-white hover:shadow-orange-md"
            }`}
                    >
                      {purchasing ? (
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          className="text-xs sm:text-sm"
                        />
                      ) : (
                        <>
                          <img
                            src={coin}
                            alt="coin"
                            className="w-3 h-3 sm:w-4 sm:h-4"
                          />
                          <span className="text-xs sm:text-sm">
                            {userCoins < cost ? "Need Coins" : "Buy Now"}
                          </span>
                        </>
                      )}
                    </motion.button>
                  )}

                  {/* Secondary Actions */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    {/* Preview Button */}
                    {showPreview && (isPDF || isImage) && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreview();
                        }}
                        className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
              shadow-soft-md hover:shadow-soft-lg transition-all duration-200
              border border-silver/50 dark:border-charcoal/60"
                        title="Preview"
                      >
                        <FontAwesomeIcon
                          icon={faEye}
                          className="text-amber-500 dark:text-amber-400 text-xs sm:text-sm"
                        />
                      </motion.button>
                    )}

                    {/* Dropdown Menu */}
                    {actionButtons.length > 0 && (
                      <div className="relative" ref={dropdownRef}>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          whileHover={{ scale: 1.05 }}
                          onClick={(e) => {
                            setShowDropdown(!showDropdown);
                            e.preventDefault();
                          }}
                          className="p-1.5 sm:p-2 rounded-md sm:rounded-lg bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
                shadow-soft-md hover:shadow-soft-lg transition-all duration-200
                border border-silver/50 dark:border-charcoal/60"
                          title="More actions"
                        >
                          <FontAwesomeIcon
                            icon={faEllipsisV}
                            className="text-graphite dark:text-ash text-xs sm:text-sm"
                          />
                        </motion.button>

                        <AnimatePresence>
                          {showDropdown && (
                            <>
                              {/* Backdrop */}
                              <div
                                className="fixed inset-0 z-[999998]"
                                onClick={() => setShowDropdown(false)}
                              />
                              {/* Dropdown */}
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className={`absolute ${
                                  isMobile
                                    ? "bottom-full mb-2"
                                    : "top-full mt-2"
                                } right-0 bg-ivory dark:bg-charcoal border border-silver dark:border-charcoal
                      rounded-lg sm:rounded-xl shadow-soft-xl dark:shadow-glow-sm min-w-[120px] sm:min-w-[150px] overflow-hidden `}
                                style={{ zIndex: 999999999999999 }}
                              >
                                {actionButtons.map((button, index) => (
                                  <button
                                    key={button.key}
                                    onClick={(e) => {
                                      button.onClick(e);
                                      setShowDropdown(false);
                                    }}
                                    disabled={button.disabled}
                                    className={`w-full px-3 py-2 sm:px-4 sm:py-3 text-left hover:bg-cream dark:hover:bg-midnight/50
                          transition-all duration-150 flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium
                          disabled:opacity-50 ${button.className} ${
                                      index === 0
                                        ? ""
                                        : "border-t border-silver/30 dark:border-charcoal/60"
                                    }`}
                                  >
                                    <FontAwesomeIcon
                                      icon={button.icon}
                                      spin={button.spin}
                                      className="text-xs sm:text-sm"
                                    />
                                    <span>{button.title}</span>
                                  </button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Modal */}
        {createPortal(
          <AnimatePresence>
            {showPreviewModal && (
              <motion.div
                className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm z-[999999] sm:p-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={handleClosePreviewModal}
              >
                <motion.div
                  className="relative bg-white dark:bg-onyx/95 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full h-[90vh] sm:h-full max-w-7xl max-h-[95vh] flex flex-col"
                  initial={
                    isMobile
                      ? { y: "100%" }
                      : { scale: 0.95, opacity: 0, y: 20 }
                  }
                  animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
                  exit={
                    isMobile
                      ? { y: "100%" }
                      : { scale: 0.95, opacity: 0, y: 20 }
                  }
                  transition={{
                    duration: 0.3,
                    ease: isMobile ? [0.32, 0.72, 0, 1] : [0.16, 1, 0.3, 1],
                    delay: isMobile ? 0 : 0.1,
                  }}
                  onClick={(e) => e.stopPropagation()}
                  drag={isMobile ? "y" : false}
                  dragConstraints={{ top: 0 }}
                  onDragEnd={(e, info) => {
                    if (info.offset.y > 100) {
                      handleClosePreviewModal();
                    }
                  }}
                >
                  {/* Drag handle for mobile only */}
                  {isMobile && (
                    <div className="py-3 flex justify-center touch-none">
                      <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                    </div>
                  )}

                  {/* Modal Header */}
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-onyx/50">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                      {resource.title}
                    </h2>
                    <button
                      onClick={handleClosePreviewModal}
                      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-charcoal text-gray-600 dark:text-gray-300"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>

                  {/* Controls Bar */}
                  <div
                    className={`${
                      isMobile
                        ? "fixed bottom-4 left-2 right-2 z-[1000000] flex justify-center"
                        : "flex justify-between items-center p-3 border-b border-gray-200 dark:border-onyx/50 bg-white/90 dark:bg-onyx/90"
                    }`}
                  >
                    {isMobile ? (
                      <div className="bg-white/90 dark:bg-onyx/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-charcoal/50 w-full px-3 py-2">
                        <div className="flex items-center justify-between">
                          {/* Left side controls - Icons only for mobile */}
                          <div className="flex items-center gap-2">
                            {isPDF && !previewError && (
                              <>
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal/50 rounded-lg p-1">
                                  <button
                                    onClick={handleZoomOut}
                                    disabled={zoom <= 0.5}
                                    className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                    title="Zoom Out"
                                  >
                                    <ZoomOut size={14} />
                                  </button>
                                  <span className="px-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {Math.round(zoom * 100)}%
                                  </span>
                                  <button
                                    onClick={handleZoomIn}
                                    disabled={zoom >= 3}
                                    className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                    title="Zoom In"
                                  >
                                    <ZoomIn size={14} />
                                  </button>
                                </div>

                                {/* Page Navigation */}
                                {numPages > 1 && (
                                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal/50 rounded-lg p-1">
                                    <button
                                      onClick={() => changePage(-1)}
                                      disabled={pageNumber <= 1}
                                      className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                      title="Previous Page"
                                    >
                                      <FontAwesomeIcon
                                        icon={faChevronLeft}
                                        size="sm"
                                      />
                                    </button>
                                    <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[40px] text-center">
                                      {pageNumber}/{numPages}
                                    </span>
                                    <button
                                      onClick={() => changePage(1)}
                                      disabled={pageNumber >= numPages}
                                      className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                      title="Next Page"
                                    >
                                      <FontAwesomeIcon
                                        icon={faChevronRight}
                                        size="sm"
                                      />
                                    </button>
                                  </div>
                                )}
                              </>
                            )}
                          </div>

                          {/* Download Button - Icon only for mobile */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!isAuthenticated) {
                                showModal({
                                  type: "warning",
                                  title: "Authentication Required",
                                  message:
                                    "You need to be logged in to download resources.",
                                  confirmText: "Go to Login",
                                  onConfirm: () =>
                                    (window.location.href = "/login"),
                                  cancelText: "Cancel",
                                  isDismissible: true,
                                });
                                return;
                              }

                              if (!isPurchased) {
                                if (userCoins < cost) {
                                  showInsufficientCoinsModal();
                                  return;
                                }
                                handlePurchase();
                                return;
                              }

                              handleDownload();
                            }}
                            disabled={downloading || purchasing}
                            className="p-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-lg disabled:opacity-50 shadow-lg transition-all duration-200"
                            title={
                              isPurchased
                                ? "Download"
                                : `Purchase for ${cost} coins`
                            }
                          >
                            {downloading || purchasing ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : isPurchased ? (
                              <FontAwesomeIcon icon={faDownload} />
                            ) : (
                              <img src={coin} alt="coin" className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Layout - Left side controls */}
                        <div className="flex items-center gap-3">
                          {isPDF && !previewError && (
                            <>
                              <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal/50 rounded-lg p-1">
                                <button
                                  onClick={handleZoomOut}
                                  disabled={zoom <= 0.5}
                                  className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                  title="Zoom Out"
                                >
                                  <ZoomOut size={16} />
                                </button>
                                <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {Math.round(zoom * 100)}%
                                </span>
                                <button
                                  onClick={handleZoomIn}
                                  disabled={zoom >= 3}
                                  className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                  title="Zoom In"
                                >
                                  <ZoomIn size={16} />
                                </button>
                              </div>

                              {numPages > 1 && (
                                <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal/50 rounded-lg p-1">
                                  <button
                                    onClick={() => changePage(-1)}
                                    disabled={pageNumber <= 1}
                                    className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                    title="Previous Page"
                                  >
                                    <FontAwesomeIcon
                                      icon={faChevronLeft}
                                      size="sm"
                                    />
                                  </button>
                                  <span className="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[60px] text-center">
                                    {pageNumber}/{numPages}
                                  </span>
                                  <button
                                    onClick={() => changePage(1)}
                                    disabled={pageNumber >= numPages}
                                    className="p-2 rounded-md hover:bg-white dark:hover:bg-charcoal transition-all duration-200 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                                    title="Next Page"
                                  >
                                    <FontAwesomeIcon
                                      icon={faChevronRight}
                                      size="sm"
                                    />
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Desktop Layout - Right side download button */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) {
                              showModal({
                                type: "warning",
                                title: "Authentication Required",
                                message:
                                  "You need to be logged in to download resources.",
                                confirmText: "Go to Login",
                                onConfirm: () =>
                                  (window.location.href = "/login"),
                                cancelText: "Cancel",
                                isDismissible: true,
                              });
                              return;
                            }

                            if (!isPurchased) {
                              if (userCoins < cost) {
                                showInsufficientCoinsModal();
                                return;
                              }
                              handlePurchase();
                              return;
                            }

                            handleDownload();
                          }}
                          disabled={downloading || purchasing}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 rounded-lg flex items-center gap-2 text-sm disabled:opacity-50 shadow-lg transition-all duration-200"
                        >
                          {downloading || purchasing ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <FontAwesomeIcon
                              icon={isPurchased ? faDownload : faCoins}
                            />
                          )}
                          {purchasing
                            ? "Purchasing..."
                            : isPurchased
                            ? "Download"
                            : "Purchase"}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Content Area */}
                  <div
                    ref={previewContainerRef}
                    className={`flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-charcoal/30 ${
                      isMobile ? "pb-24" : ""
                    }`}
                  >
                    {previewLoading && !previewError && (
                      <div className="flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
                        <FontAwesomeIcon
                          icon={faSpinner}
                          spin
                          size="2x"
                          className="mb-4 text-amber-500"
                        />
                        <span>Loading preview...</span>
                      </div>
                    )}

                    {previewError && (
                      <div className="text-center p-8">
                        <FontAwesomeIcon
                          icon={faExternalLinkAlt}
                          size="3x"
                          className="mb-4 text-gray-400"
                        />
                        <p className="mb-4">{previewError}</p>
                        <div className="flex gap-4 justify-center">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (isPurchased) {
                                handleDownload();
                              } else {
                                handlePurchase();
                              }
                            }}
                            className="px-6 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl shadow-lg font-medium"
                            disabled={downloading || purchasing}
                          >
                            <FontAwesomeIcon
                              icon={isPurchased ? faDownload : faCoins}
                              className="mr-2"
                            />
                            {isPurchased ? "Download File" : "Purchase"}
                          </button>
                          {resource.cloudinaryUrl && (
                            <a
                              href={resource.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                            >
                              <FontAwesomeIcon
                                icon={faExternalLinkAlt}
                                className="mr-2"
                              />
                              Open in New Tab
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {!previewLoading && !previewError && previewDataUrl && (
                      <>
                        {isPDF ? (
                          <div className="w-full h-full flex flex-col items-center p-4">
                            <Document
                              file={previewDataUrl}
                              onLoadSuccess={onDocumentLoadSuccess}
                              onLoadError={onDocumentLoadError}
                              className="w-full h-full flex justify-center"
                              loading={
                                <div className="flex flex-col items-center text-gray-600 dark:text-gray-300">
                                  <FontAwesomeIcon
                                    icon={faSpinner}
                                    spin
                                    size="2x"
                                    className="mb-3 text-amber-500"
                                  />
                                  <span>Loading PDF...</span>
                                </div>
                              }
                              error={
                                <div className="text-center text-gray-600 dark:text-gray-300">
                                  <p className="mb-2">
                                    Error rendering PDF. Please try downloading.
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (isPurchased) {
                                        handleDownload();
                                      } else {
                                        handlePurchase();
                                      }
                                    }}
                                    className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 shadow-lg"
                                    disabled={downloading || purchasing}
                                  >
                                    <FontAwesomeIcon
                                      icon={isPurchased ? faDownload : faCoins}
                                      className="mr-2"
                                    />
                                    {isPurchased ? "Download File" : "Purchase"}
                                  </button>
                                </div>
                              }
                            >
                              <Page
                                pageNumber={pageNumber}
                                scale={zoom}
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                className="shadow-xl rounded-lg overflow-hidden"
                              />
                            </Document>
                          </div>
                        ) : isImage ? (
                          <div className="flex items-center justify-center w-full h-full p-4">
                            <img
                              src={previewDataUrl}
                              alt={resource.title}
                              className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                              onLoad={() => setPreviewLoading(false)}
                              onError={() => {
                                setPreviewError(
                                  "Failed to load image preview."
                                );
                                setUseFallback(true);
                                setPreviewLoading(false);
                              }}
                            />
                          </div>
                        ) : (
                          <div className="text-center p-8">
                            <FontAwesomeIcon
                              icon={faFileAlt}
                              size="3x"
                              className="mb-4 text-gray-400"
                            />
                            <p className="mb-6">
                              This file type cannot be previewed.
                            </p>
                            <div className="flex gap-4 justify-center">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (isPurchased) {
                                    handleDownload();
                                  } else {
                                    handlePurchase();
                                  }
                                }}
                                className="px-6 py-3 bg-amber-500 text-white hover:bg-amber-600 rounded-xl shadow-lg font-medium"
                                disabled={downloading || purchasing}
                              >
                                <FontAwesomeIcon
                                  icon={isPurchased ? faDownload : faCoins}
                                  className="mr-2"
                                />
                                {isPurchased ? "Download File" : "Purchase"}
                              </button>
                              {resource.cloudinaryUrl && (
                                <a
                                  href={resource.cloudinaryUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium"
                                >
                                  <FontAwesomeIcon
                                    icon={faExternalLinkAlt}
                                    className="mr-2"
                                  />
                                  Open in New Tab
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </div>
    );
  }
);

UniversalResourceCard.displayName = "UniversalResourceCard";

export default UniversalResourceCard;
