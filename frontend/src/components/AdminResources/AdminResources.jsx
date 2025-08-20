import React, { useState, useEffect } from "react";
import * as api from "../../api.js"; // Using your original API import
import {
  FolderKanban,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Flag,
  ChevronDown,
  ChevronUp,
  Download,
  User,
  Calendar,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- Custom Modal Component for Confirmation ---
const Modal = ({ isOpen, onClose, title, message, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex items-center justify-center min-h-screen p-4"
      >
        <div
          className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white dark:bg-onyx rounded-2xl p-6 shadow-xl w-full max-w-sm mx-auto transition-all"
        >
          <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-onyx-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {message}
            </p>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 bg-gray-100 hover:bg-gray-200 dark:bg-charcoal dark:hover:bg-onyx-600 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-amber-600 hover:bg-amber-700 transition-colors"
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// --- Custom Notification Component for Success/Error Messages ---
const Notification = ({ show, message, type, onClose }) => {
  if (!show) return null;

  const typeStyles = {
    success:
      "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    error: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  };

  const icon =
    type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />;

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [show, onClose]);

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-xl shadow-lg flex items-center space-x-2 z-50 ${typeStyles[type]}`}
    >
      {icon}
      <p className="text-sm font-medium">{message}</p>
      <button
        onClick={onClose}
        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-onyx transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
};

const AdminResources = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'public', 'private', 'flagged'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedResourceId, setExpandedResourceId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "",
  });

  const limit = 20; // Number of resources per page

  // --- Notification Helpers ---
  const showNotification = (message, type) => {
    setNotification({ show: true, message, type });
  };

  const closeNotification = () => {
    setNotification({ show: false, message: "", type: "" });
  };

  // --- Fetch Resources Function ---
  const fetchResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getResources(
        searchQuery,
        subjectFilter,
        statusFilter,
        currentPage,
        limit
      );
      setResources(data.resources);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(
        "Error fetching resources:",
        err.response?.data || err.message
      );
      setError(
        "Failed to load resources. Please ensure you are logged in with appropriate permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- useEffect to fetch data on filter/page changes ---
  useEffect(() => {
    fetchResources();
  }, [searchQuery, subjectFilter, statusFilter, currentPage]);

  // --- Action Handlers with Modal Integration ---
  const handleToggleVisibility = async (resourceId, currentVisibility) => {
    const action = currentVisibility === "public" ? "private" : "public";
    setModalContent({
      title: "Change Visibility",
      message: `Are you sure you want to change this resource's visibility to "${action}"?`,
      onConfirm: async () => {
        try {
          await api.toggleResourceVisibility(resourceId);
          fetchResources(); // Refresh list
          showNotification(
            "Resource visibility changed successfully.",
            "success"
          );
        } catch (err) {
          showNotification(
            `Failed to toggle visibility: ${
              err.response?.data?.msg || err.message
            }`,
            "error"
          );
        } finally {
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  const handleDeleteResource = async (resourceId) => {
    setModalContent({
      title: "Delete Resource",
      message:
        "Are you sure you want to delete this resource permanently? This action is irreversible.",
      onConfirm: async () => {
        try {
          await api.deleteResource(resourceId);
          fetchResources(); // Refresh list
          showNotification("Resource deleted successfully.", "success");
        } catch (err) {
          showNotification(
            `Failed to delete resource: ${
              err.response?.data?.msg || err.message
            }`,
            "error"
          );
        } finally {
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  const handleResolveFlags = async (resourceId, actionType) => {
    const title =
      actionType === "remove" ? "Remove Flagged Resource" : "Approve Resource";
    const message = `Are you sure you want to ${
      actionType === "remove"
        ? "permanently remove this resource due to flags"
        : "approve this resource and clear its flags"
    }?`;

    setModalContent({
      title,
      message,
      onConfirm: async () => {
        try {
          await api.resolveFlags(resourceId, actionType);
          fetchResources(); // Refresh list
          showNotification(
            `Resource ${
              actionType === "remove"
                ? "removed"
                : "flags resolved and approved"
            } successfully.`,
            "success"
          );
        } catch (err) {
          showNotification(
            `Failed to resolve flags: ${
              err.response?.data?.msg || err.message
            }`,
            "error"
          );
        } finally {
          setShowModal(false);
        }
      },
    });
    setShowModal(true);
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const toggleExpandResource = (resourceId) => {
    setExpandedResourceId(
      expandedResourceId === resourceId ? null : resourceId
    );
  };

  // Example subjects, ideally fetch from backend dynamically for a robust app
  const subjectOptions = [
    { value: "all", label: "All Subjects" },
    { value: "Mathematics", label: "Mathematics" },
    { value: "Physics", label: "Physics" },
    { value: "Chemistry", label: "Chemistry" },
    { value: "Computer Science", label: "Computer Science" },
    { value: "Biology", label: "Biology" },
    { value: "History", label: "History" },
    { value: "Literature", label: "Literature" },
    { value: "Economics", label: "Economics" },
  ];

  const statusOptions = [
    { value: "all", label: "All Statuses" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
    { value: "flagged", label: "Flagged" },
  ];

  return (
    <div className="p-6 md:p-8 bg-white dark:bg-onyx rounded-2xl shadow-lg border border-gray-200 dark:border-charcoal transition-all duration-300">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-poppins text-gray-800 dark:text-gray-100">
        <FolderKanban
          size={24}
          className="text-amber-600 dark:text-amber-200"
        />
        <span>Resource Management</span>
      </h2>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={20} className="text-amber-600 dark:text-amber-200" />
          </div>
          <input
            type="text"
            placeholder="Search by title, subject, or uploader..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx-700 bg-white hover:bg-gray-50 dark:bg-onyx text-gray-700 dark:text-gray-200 font-poppins placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 shadow-glow-sm"
          />
        </div>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-300 dark:border-onyx-700 bg-white hover:bg-gray-50 dark:bg-onyx text-gray-700 dark:text-gray-200 font-poppins focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 cursor-pointer hover:border-amber-400 dark:hover:border-amber-200 shadow-glow-sm"
        >
          {subjectOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-gray-300 dark:border-onyx-700 bg-white hover:bg-gray-50 dark:bg-onyx text-gray-700 dark:text-gray-200 font-poppins focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 cursor-pointer hover:border-amber-400 dark:hover:border-amber-200 shadow-glow-sm"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500 mx-auto mb-4"></div>
            <p className="text-lg text-gray-700 dark:text-gray-200">
              Loading Resources...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Preparing your resource dashboard
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 p-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                Error
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {resources.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 dark:bg-onyx rounded-xl shadow-sm">
              <Search className="mx-auto h-12 w-12 text-gray-400 dark:text-amber-200" />
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                No resources found
              </h3>
              <p className="mt-1 text-gray-500 dark:text-gray-300">
                {searchQuery ||
                subjectFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "There are currently no resources in the system."}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSubjectFilter("all");
                    setStatusFilter("all");
                  }}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
                >
                  Clear filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {resources.map((resource) => (
                <div
                  key={resource._id}
                  className="bg-white dark:bg-onyx rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-charcoal"
                >
                  {/* Resource Summary */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-charcoal/20 transition-colors grid grid-cols-2 md:grid-cols-6 gap-4 items-center"
                    onClick={() => toggleExpandResource(resource._id)}
                  >
                    <div className="col-span-2 md:col-span-1 flex items-center">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mr-3">
                        <FileText
                          size={20}
                          className="text-amber-600 dark:text-amber-200"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {resource.title.length > 17
                            ? resource.title.slice(0, 17) + "..."
                            : resource.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-300 truncate">
                          {resource.subject}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Uploader
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {resource.uploadedBy
                          ? resource.uploadedBy.username
                          : "N/A"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Downloads
                      </p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {resource.downloads}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Visibility
                      </p>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                          resource.visibility === "public"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                        }`}
                      >
                        {resource.visibility}
                      </span>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Flags
                      </p>
                      {resource.flags?.length > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                          <Flag size={12} className="mr-1" />{" "}
                          {resource.flags.length}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-700 dark:text-gray-200">
                          None
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleVisibility(
                            resource._id,
                            resource.visibility
                          );
                        }}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          resource.visibility === "public"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:hover:bg-yellow-900/50"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
                        }`}
                      >
                        {resource.visibility === "public"
                          ? "Make Private"
                          : "Make Public"}
                      </button>
                      {expandedResourceId === resource._id ? (
                        <ChevronUp className="h-5 w-5 text-gray-400 dark:text-amber-200" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400 dark:text-amber-200" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Resource Details */}
                  <AnimatePresence>
                    {expandedResourceId === resource._id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-gray-200 dark:border-charcoal p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Resource Information */}
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                              <FileText className="mr-2 h-5 w-5 text-blue-500" />
                              Resource Information
                            </h3>
                            <div className="space-y-2">
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Title:
                                </span>{" "}
                                {resource.title}
                              </p>
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Subject:
                                </span>{" "}
                                {resource.subject}
                              </p>
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Uploader:
                                </span>{" "}
                                {resource.uploadedBy
                                  ? resource.uploadedBy.username
                                  : "N/A"}
                              </p>
                              <p className="text-gray-600 dark:text-gray-300">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  Visibility:
                                </span>
                                <span
                                  className={`ml-2 px-2 py-1 text-xs rounded-full ${
                                    resource.visibility === "public"
                                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200"
                                  }`}
                                >
                                  {resource.visibility}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Statistics & Flags */}
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                              <Download className="mr-2 h-5 w-5 text-green-500" />
                              Statistics & Status
                            </h3>
                            <div className="space-y-2">
                              <div className="bg-gray-50 dark:bg-onyx p-3 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Total Downloads
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                  {resource.downloads}
                                </p>
                              </div>
                              <div className="bg-gray-50 dark:bg-onyx p-3 rounded-lg">
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Flags
                                </p>
                                {resource.flags?.length > 0 ? (
                                  <div className="flex items-center">
                                    <Flag
                                      size={16}
                                      className="text-red-500 mr-2"
                                    />
                                    <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                      {resource.flags.length}
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                    None
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center">
                              <User className="mr-2 h-5 w-5 text-purple-500" />
                              Quick Actions
                            </h3>
                            <div className="grid grid-cols-1 gap-2">
                              <button
                                onClick={() =>
                                  handleToggleVisibility(
                                    resource._id,
                                    resource.visibility
                                  )
                                }
                                className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
                                  resource.visibility === "public"
                                    ? "bg-yellow-50 text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-200 dark:hover:bg-blue-900/30"
                                }`}
                              >
                                {resource.visibility === "public" ? (
                                  <>
                                    <EyeOff className="mr-2 h-4 w-4" /> Make
                                    Private
                                  </>
                                ) : (
                                  <>
                                    <Eye className="mr-2 h-4 w-4" /> Make Public
                                  </>
                                )}
                              </button>

                              {resource.flags?.length > 0 && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleResolveFlags(
                                        resource._id,
                                        "approve"
                                      )
                                    }
                                    className="flex items-center justify-center p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 dark:bg-green-900/20 dark:text-green-200 dark:hover:bg-green-900/30 transition-colors"
                                  >
                                    <Flag className="mr-2 h-4 w-4" />
                                    Approve & Clear Flags
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleResolveFlags(resource._id, "remove")
                                    }
                                    className="flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Remove Flagged Resource
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() =>
                                  handleDeleteResource(resource._id)
                                }
                                className="flex items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-200 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Resource
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6 px-4 py-3 bg-gray-50 dark:bg-onyx rounded-lg shadow-sm">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-md hover:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-200">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white rounded-md hover:bg-amber-700 dark:hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Modal and Notification components */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalContent.title}
        message={modalContent.message}
        onConfirm={modalContent.onConfirm}
      />
      <AnimatePresence>
        {notification.show && (
          <Notification
            show={notification.show}
            message={notification.message}
            type={notification.type}
            onClose={closeNotification}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminResources;
