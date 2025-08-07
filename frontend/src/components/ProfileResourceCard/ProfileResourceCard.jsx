// ProfileResourceCard.jsx
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faFlag,
  faSpinner,
  faTrashAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import { useModal } from "../../context/ModalContext/ModalContext";

const ProfileResourceCard = ({ resource, onResourceDeleted }) => {
  const { token, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  // REMOVED: Local modal state is no longer needed
  // const [modal, setModal] = useState({
  //   isOpen: false,
  //   type: "",
  //   title: "",
  //   message: "",
  //   confirmText: "Confirm",
  //   cancelText: "Cancel",
  //   onConfirm: () => {},
  //   onCancel: () => {},
  //   isDismissible: true,
  // });

  // NEW: Get the showModal function from the context
  const { showModal } = useModal();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    setIsDeleted(false);
    setDeleting(false);
  }, [resource]);

  const isOwner = user && resource.uploadedBy?._id === user._id;

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

  // REMOVED: The local openModal and closeModal functions are now replaced by the hook
  // const openModal = (...) => { ... };
  // const closeModal = () => { ... };


  const handleDownload = async () => {
    if (!isAuthenticated) {
      showModal({ // UPDATED: Use showModal from the hook
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to download resources. Please log in or create an account.",
        confirmText: "Go to Login",
        cancelText: "Cancel",
        onConfirm: () => navigate("/login"),
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

      showModal({ // UPDATED: Use showModal from the hook
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
      showModal({ // UPDATED: Use showModal from the hook
        type: "error",
        title: "Download Failed",
        message: `Could not download the file: ${error.message}. Please try again.`,
        confirmText: "Close",
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      showModal({ // UPDATED: Use showModal from the hook
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to save resources to your library. Please log in or create an account.",
        confirmText: "Go to Login",
        cancelText: "Cancel",
        onConfirm: () => navigate("/login"),
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/resources/${resource._id}/save`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        showModal({ // UPDATED: Use showModal from the hook
          type: "success",
          title: "Resource Saved!",
          message: "This resource has been successfully added to your library!",
          confirmText: "Great!"
        });
      } else {
        showModal({ // UPDATED: Use showModal from the hook
          type: "error",
          title: "Failed to Save",
          message: `Could not save resource: ${data.msg || "Unknown error"}`,
          confirmText: "OK",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      showModal({ // UPDATED: Use showModal from the hook
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
      showModal({ // UPDATED: Use showModal from the hook
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to flag resources. Please log in or create an account.",
        confirmText: "Go to Login",
        cancelText: "Cancel",
        onConfirm: () => navigate("/login"),
      });
      return;
    }

    const reason = prompt("Please provide a reason for flagging this resource:");
    if (!reason?.trim()) {
      showModal({ // UPDATED: Use showModal from the hook
        type: "info",
        title: "Flagging Cancelled",
        message: "Flagging was cancelled because no reason was provided.",
        confirmText: "OK",
      });
      return;
    }

    setFlagging(true);
    try {
      const response = await fetch(`${API_URL}/resources/${resource._id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      const data = await response.json();
      if (response.ok) {
        showModal({ // UPDATED: Use showModal from the hook
          type: "success",
          title: "Resource Flagged",
          message: "This resource has been flagged for review. Thank you for helping us maintain content quality!",
          confirmText: "Got It",
        });
      } else {
        showModal({ // UPDATED: Use showModal from the hook
          type: "error",
          title: "Failed to Flag",
          message: `Could not flag resource: ${data.msg || "Unknown error"}`,
          confirmText: "OK",
        });
      }
    } catch (error) {
      console.error("Flag error:", error);
      showModal({ // UPDATED: Use showModal from the hook
        type: "error",
        title: "Flagging Error",
        message: "An unexpected error occurred while flagging the resource. Please try again.",
        confirmText: "OK",
      });
    } finally {
      setFlagging(false);
    }
  };

  const handleDelete = async () => {
    showModal({ // UPDATED: Use showModal from the hook
      type: "danger",
      title: "Confirm Deletion",
      message: `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
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
            throw new Error(
              data.msg ||
              `HTTP error! Status: ${response.status} (${response.statusText})`
            );
          }
          setIsDeleted(true);
          if (onResourceDeleted) {
            onResourceDeleted(resource._id);
          }
          showModal({ // UPDATED: Use showModal from the hook
            type: "success",
            title: "Resource Deleted",
            message: "The resource has been successfully deleted.",
            confirmText: "OK"
          });
        } catch (error) {
          console.error("Delete error:", error.message);
          showModal({ // UPDATED: Use showModal from the hook
            type: "error",
            title: "Deletion Failed",
            message: `Could not delete resource: ${error.message}`,
            confirmText: "Close"
          });
        } finally {
          setDeleting(false);
        }
      },
    });
  };

  if (isDeleted) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-glow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
      {/* REMOVED: The CustomWarningModal component is no longer rendered here */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-md font-medium text-gray-900 dark:text-white truncate">
              {resource.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
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
          </div>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200">
            {resource.fileType || "File"}
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
          {resource.description || "No description"}
        </p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {resource.downloads || 0} downloads
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              title="Download"
            >
              {downloading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
              ) : (
                <FontAwesomeIcon icon={faDownload} className="text-xs" />
              )}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              title="Save"
            >
              {saving ? (
                <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
              ) : (
                <FontAwesomeIcon icon={faBookmark} className="text-xs" />
              )}
            </button>
            <button
              onClick={handleFlag}
              disabled={flagging}
              className="p-1.5 rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-700 dark:text-gray-300"
              title="Flag"
            >
              {flagging ? (
                <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
              ) : (
                <FontAwesomeIcon icon={faFlag} className="text-xs" />
              )}
            </button>
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="p-1.5 rounded-md bg-red-100 hover:bg-red-200 dark:bg-red-900/50 dark:hover:bg-red-900 transition-colors text-red-700 dark:text-red-300"
                title="Delete Resource"
              >
                {deleting ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                ) : (
                  <FontAwesomeIcon icon={faTrashAlt} className="text-xs" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileResourceCard;