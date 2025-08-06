import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faDownload,
  faBookmark,
  faFlag,
  faFileAlt,
  faEye,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";

const ProfileResourceCard = ({ resource, showModal }) => {
  const { token, isAuthenticated } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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

  const handleDownload = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to download resources.",
        confirmText: "Go to Login",
        cancelText: "Cancel",
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
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${resource.title.replace(/[^a-z0-9._-]/gi, "_")}${getFileExtension(resource.cloudinaryUrl)}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      await fetch(`${API_URL}/resources/${resource._id}/increment-download`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Download failed:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to save resources.",
        confirmText: "Go to Login",
        cancelText: "Cancel",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/resources/${resource._id}/save`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
      console.error("Save error:", error);
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
        cancelText: "Cancel",
      });
      return;
    }

    const reason = prompt("Please provide a reason for flagging:");
    if (!reason?.trim()) return;

    setFlagging(true);
    try {
      await fetch(`${API_URL}/resources/${resource._id}/flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: reason.trim() }),
      });
    } catch (error) {
      console.error("Flag error:", error);
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-glow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all hover:shadow-lg">
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileResourceCard;