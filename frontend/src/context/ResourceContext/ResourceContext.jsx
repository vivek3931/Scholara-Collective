import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext/AuthContext';
import { useModal } from '../ModalContext/ModalContext';
import axios from 'axios';

const ResourceContext = createContext();

export const useResource = () => useContext(ResourceContext);

export const ResourceProvider = ({ children }) => {
  const { token, isAuthenticated, user, updateUser } = useAuth();
  const { showModal } = useModal();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Search-related state
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [suggestions, setSuggestions] = useState([]);

  const showInsufficientCoinsModal = (cost, userCoins) => {
    showModal({
      type: "info",
      title: "Insufficient Coins",
      message: `You need ${cost} coins to purchase this resource. You currently have ${userCoins} coins.`,
      confirmText: "Got it!",
      isDismissible: true,
    });
  };

  // Search functionality
  const performSearch = useCallback(async (query, filters = {}, page = 1) => {
    if (!query.trim()) {
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      return { results: [], total: 0, totalPages: 1, currentPage: 1 };
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: "10",
      });

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value && key !== "sort") {
          params.append(key, value);
        }
      });

      if (filters.sort && filters.sort !== "newest") {
        params.append("sort", filters.sort);
      }

      const response = await axios.get(`${API_URL}/resources?${params}`);
      const data = response.data;

      const results = {
        results: data.resources || [],
        total: data.total || 0,
        totalPages: data.totalPages || 1,
        currentPage: data.currentPage || 1
      };

      setSearchResults(results.results);
      setTotalResults(results.total);
      setTotalPages(results.totalPages);
      setCurrentPage(results.currentPage);

      return results;
    } catch (err) {
      console.error("Search error:", err);
      const errorMessage = "Failed to fetch search results. Please try again.";
      setSearchError(errorMessage);
      setSearchResults([]);
      setTotalResults(0);
      setTotalPages(1);
      setCurrentPage(1);
      
      return { results: [], total: 0, totalPages: 1, currentPage: 1, error: errorMessage };
    } finally {
      setSearchLoading(false);
    }
  }, [API_URL]);

  // Search suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return [];
    }

    try {
      const response = await axios.get(
        `${API_URL}/resources/suggestions?search=${encodeURIComponent(query)}`
      );
      const suggestionsData = response.data || [];
      setSuggestions(suggestionsData);
      return suggestionsData;
    } catch (err) {
      console.error("Suggestions error:", err);
      setSuggestions([]);
      return [];
    }
  }, [API_URL]);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    setSearchResults([]);
    setTotalResults(0);
    setTotalPages(1);
    setCurrentPage(1);
    setSearchError(null);
    setSuggestions([]);
  }, []);

  const handleDownload = async (resource) => {
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
          throw new Error(errorData.msg || "Download failed due to server error.");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${resource.title.replace(/[^a-z0-9._-]/gi, "_")}.${resource.fileType}`;
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
    }
  };

  const handleSave = async (resourceId) => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to save resources to your library.",
        confirmText: "Go to Login",
        onConfirm: () => (window.location.href = "/login"),
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/resources/${resourceId}/save`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        showModal({
          type: "success",
          title: "Resource Saved!",
          message: "This resource has been successfully added to your library!",
          confirmText: "Great!",
        });
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
    }
  };

  const handleFlag = async (resourceId) => {
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
        try {
          const response = await fetch(`${API_URL}/resources/${resourceId}/flag`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: "Reported by user" }),
          });

          const data = await response.json();
          if (response.ok) {
            showModal({
              type: "success",
              title: "Resource Flagged",
              message: "Thank you for helping maintain content quality!",
              confirmText: "Got It",
            });
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
        }
      },
      cancelText: "Cancel",
      isDismissible: true,
    });
  };

  const handleUnsave = async (resourceId) => {
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
      message: `Are you sure you want to remove this resource?`,
      confirmText: "Remove",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/resources/${resourceId}/unsave`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.msg || "Failed to unsave resource");
          }

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
        }
      },
      cancelText: "Cancel",
      isDismissible: true,
    });
  };

  const handleDelete = async (resourceId) => {
    showModal({
      type: "danger",
      title: "Confirm Deletion",
      message: "Are you sure you want to delete this resource? This cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        try {
          const response = await fetch(`${API_URL}/resources/${resourceId}/delete-my-resource`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.msg || "Failed to delete resource");
          }

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
        }
      },
    });
  };

  const handlePurchase = async (resource, cost) => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to purchase resources.",
        confirmText: "Go to Login",
        onConfirm: () => (window.location.href = "/login"),
        cancelText: "Cancel",
        isDismissible: true,
      });
      return;
    }

    if (user?.scholaraCoins < cost) {
      showInsufficientCoinsModal(cost, user?.scholaraCoins);
      return;
    }

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
        if (updateUser && res.data.user) {
          updateUser(res.data.user);
        } else if (updateUser) {
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
      showModal({
        type: "error",
        title: "Purchase Failed",
        message: error.response?.data?.message || "Purchase failed. Please try again.",
        confirmText: "OK",
      });
    }
  };

  const value = {
    // Existing methods
    handleDownload,
    handleSave,
    handleFlag,
    handleUnsave,
    handleDelete,
    handlePurchase,
    showInsufficientCoinsModal,
    
    // Search methods and state
    performSearch,
    fetchSuggestions,
    clearSearchResults,
    searchResults,
    searchLoading,
    searchError,
    totalResults,
    totalPages,
    currentPage,
    suggestions,
  };

  return (
    <ResourceContext.Provider value={value}>
      {children}
    </ResourceContext.Provider>
  );
};