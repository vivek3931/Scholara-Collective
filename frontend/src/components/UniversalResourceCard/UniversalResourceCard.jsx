import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import coin from "../../assets/coin.svg";
import {
  faDownload,
  faBookmark,
  faFlag,
  faStar,
  faEye,
  faSpinner,
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
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useModal } from "../../context/ModalContext/ModalContext";
import axios from "axios";

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
    const [isPurchased, setIsPurchased] = useState(false);
    const [purchasing, setPurchasing] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Refs
    const dropdownRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
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
      if (!resource || !resource._id) {
        console.error("Resource or Resource ID is undefined.");
        showModal({
          type: "error",
          title: "Save Error",
          message:
            "Could not save the resource. Resource information is missing.",
          confirmText: "OK",
        });
        return;
      }
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
            message:
              "This resource has been successfully added to your library!",
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

    const handlePreview = () => {
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

      // For now, just show a message that preview functionality will be implemented
      showModal({
        type: "info",
        title: "Preview",
        message: "Preview functionality will be available soon!",
        confirmText: "OK",
      });
    };

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
        <div className="h-full flex flex-col relative p-2 overflow-visible">
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

            {/* Coins Display - New separate section */}

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
              <div className="flex justify-between items-center mb-3">
                <div className="flex flex-wrap gap-1.5 ">
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
                <div className=" flex justify-end">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg shadow-soft-sm border border-amber-200 dark:border-amber-800/50">
                    <img src={coin} alt="coin" className="w-4 h-4" />
                    <span className="text-sm font-bold text-amber-800 dark:text-amber-300">
                      {cost} coins
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions Section - Completely redesigned */}
            <div className="mt-auto">
              <div className="flex items-center justify-between p-2 sm:p-3 bg-[#80808009] shadow-inner dark:shadow-[inset_0_2px_4px_0_rgb(0_0_0_/_0.3)] dark:bg-gradient-to-r dark:from-charcoal rounded-lg sm:rounded-xl border border-silver/50 dark:border-0">
                {/* Main Action Button */}
                <div className="flex items-center gap-2">
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
                      className={`px-4 py-2 rounded-md sm:rounded-lg flex items-center gap-1.5 sm:gap-2 font-medium
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
                </div>

                {/* Secondary Actions */}
                <div className="flex items-center gap-1 sm:gap-2 ">
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
                      className="px-3 py-2 lg:mr-0 mr-3 rounded-md sm:rounded-lg bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
              shadow-soft-md hover:shadow-soft-lg transition-all duration-200
              border border-silver/50 dark:border-charcoal/60 flex items-center gap-1.5"
                      title="Preview"
                    >
                      <FontAwesomeIcon
                        icon={faEye}
                        className="text-amber-500 dark:text-amber-400 text-xs sm:text-sm"
                      />
                      <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400 font-medium">
                        Preview
                      </span>
                    </motion.button>
                  )}

                  {/* Dropdown Menu with improved z-index */}
                  {actionButtons.length > 0 && (
                    <div className="relative" ref={dropdownRef}>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        onClick={(e) => {
                          setShowDropdown(!showDropdown);
                          e.preventDefault();
                        }}
                        className="px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md sm:rounded-lg bg-ivory dark:bg-charcoal hover:bg-cream dark:hover:bg-charcoal/70
                shadow-soft-md hover:shadow-soft-lg transition-all duration-200
                border border-silver/50 dark:border-charcoal/60"
                        title="More actions"
                      >
                        <FontAwesomeIcon
                          icon={faEllipsisV}
                          className="text-graphite dark:text-amber-400 text-xs sm:text-sm"
                        />
                      </motion.button>

                      <AnimatePresence>
                        {showDropdown && (
                          <>
                            {/* Backdrop */}
                            <div
                              className="fixed inset-0 z-[9998]"
                              onClick={() => setShowDropdown(false)}
                            />
                            {/* Dropdown with higher z-index */}
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 10, scale: 0.95 }}
                              transition={{ duration: 0.15 }}
                              className={`absolute 
                              bottom-full mb-2
                              } right-0 bg-ivory dark:bg-charcoal border border-silver dark:border-charcoal
                      rounded-lg sm:rounded-xl shadow-2xl dark:shadow-glow-sm min-w-[120px] sm:min-w-[150px] overflow-hidden z-[9999]`}
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
    );
  }
);

UniversalResourceCard.displayName = "UniversalResourceCard";

export default UniversalResourceCard;
