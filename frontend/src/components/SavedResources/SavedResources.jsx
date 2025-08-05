import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faSearch,
  faFilter,
  faSpinner,
  faTrash,
  faExclamationTriangle,
  faChevronDown,
  faChevronUp,
  faGraduationCap,
  faEye,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";

// Import your existing components and context
import { useAuth } from "../../context/AuthContext/AuthContext";
import ResourceCard from "../ResourceCard/ResourceCard"; // Adjust path as needed
import CustomWarningModal from "../CustomWarningModal/CustomWarningModal";

// Enhanced ResourceCard wrapper with delete button
const SavedResourceCard = ({ resource, onUnsave, showModal }) => {
  const confirmUnsave = useCallback(() => {
    showModal({
      type: "warning",
      title: "Remove from Library?",
      message: `Are you sure you want to remove "${resource.title}" from your saved resources?`,
      confirmText: "Remove",
      onConfirm: () => onUnsave(resource._id),
      onCancel: null, // CustomWarningModal can use null to hide the cancel button
    });
  }, [resource, onUnsave, showModal]);

  return (
    <div className="relative group">
      <ResourceCard
        resource={resource}
        onSave={() => {}} // Already saved, no action needed
        onFlag={() => {}} // Handle flag if needed
        showModal={showModal}
      />
      
      {/* Delete button positioned within the card */}
      <button
        onClick={confirmUnsave}
        className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100 z-10"
        title="Remove from saved resources"
      >
        <FontAwesomeIcon icon={faTrash} size="sm" />
      </button>
    </div>
  );
};

const SavedResourcesPage = () => {
  const { token, isAuthenticated } = useAuth();
  const [savedResources, setSavedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("savedDate");
  const [filterBy, setFilterBy] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Back navigation handler
  const handleGoBack = useCallback(() => {
    window.history.back();
  }, []);

  // Fetch saved resources from backend
  const fetchSavedResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/resources/my-library`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to fetch saved resources");
      }

      const data = await response.json();
      setSavedResources(data);
    } catch (err) {
      console.error("Error fetching saved resources:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedResources();
    }
  }, [isAuthenticated, fetchSavedResources]);

  // Modal handler
  const showModal = useCallback((config) => {
    setModalConfig(config);
  }, []);

  const closeModal = useCallback(() => {
    setModalConfig(null);
  }, []);

  // Handle unsaving a resource
  const handleUnsave = useCallback(
    async (resourceId) => {
      try {
        const response = await fetch(
          `${API_URL}/resources/${resourceId}/unsave`,
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

        // Remove the resource from local state
        setSavedResources((prev) =>
          prev.filter((resource) => resource._id !== resourceId)
        );

        showModal({
          type: "success",
          title: "Resource Removed",
          message: "The resource has been removed from your saved library.",
          confirmText: "OK",
          onConfirm: () => closeModal(), // Close modal on 'OK'
          onCancel: null, // Hide cancel button
        });
      } catch (err) {
        console.error("Error unsaving resource:", err);
        showModal({
          type: "error",
          title: "Error",
          message: `Failed to remove resource: ${err.message}`,
          confirmText: "OK",
          onConfirm: () => closeModal(),
          onCancel: null,
        });
      }
    },
    [token, showModal, closeModal]
  );

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set(
      savedResources.map((resource) => resource.subject)
    );
    return Array.from(subjectSet).sort();
  }, [savedResources]);

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = savedResources.filter((resource) => {
      const matchesSearch =
        !searchTerm ||
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags?.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesSubject =
        !selectedSubject || resource.subject === selectedSubject;

      const matchesFilter =
        filterBy === "all" ||
        (filterBy === "pdf" &&
          resource.fileType?.toLowerCase().includes("pdf")) ||
        (filterBy === "image" &&
          resource.fileType?.toLowerCase().includes("image")) ||
        (filterBy === "document" &&
          (resource.fileType?.toLowerCase().includes("doc") ||
            resource.fileType?.toLowerCase().includes("xls") ||
            resource.fileType?.toLowerCase().includes("ppt")));

      return matchesSearch && matchesSubject && matchesFilter;
    });

    // Sort resources
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "subject":
          return a.subject.localeCompare(b.subject);
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0);
        case "downloads":
          return (b.downloads || 0) - (a.downloads || 0);
        case "year":
          return (b.year || 0) - (a.year || 0);
        case "savedDate":
        default:
          return (
            new Date(b.createdAt || b.updatedAt) -
            new Date(a.createdAt || a.updatedAt)
          );
      }
    });

    return filtered;
  }, [savedResources, searchTerm, selectedSubject, filterBy, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-onyx flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="2x"
            className="text-blue-500 mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400">
            Loading your saved resources...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size="2x"
            className="text-red-500 mb-4"
          />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Resources
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchSavedResources}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex justify-between items-center mb-10">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 px-3 py-2 text-gray-600 dark:text-gray-400 dark:bg-onyx shadow-glow-sm hover:text-gray-800 bg-white  hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition duration-200 rounded-md "
          >
            <FontAwesomeIcon icon={faArrowLeft}/>
            <span>Back</span>
          </button>
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={faBookmark}
              className="text-blue-500 text-2xl"
            />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Saved Resources
            </h1>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 -mt-6 mb-8">
            Your personal library of saved academic resources
        </p>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search your saved resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx/60 dark:text-white"
              >
                <option value="savedDate">Recently Saved</option>
                <option value="title">Title A-Z</option>
                <option value="subject">Subject</option>
                <option value="rating">Highest Rated</option>
                <option value="downloads">Most Downloaded</option>
                <option value="year">Newest Year</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 dark:bg-onyx/60 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
                <FontAwesomeIcon
                  icon={showFilters ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Type
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx/60 dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="image">Images</option>
                    <option value="document">Office Documents</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSubject("");
                      setFilterBy("all");
                      setSortBy("savedDate");
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={faBookmark}
                className="text-blue-500 text-2xl mr-3"
              />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {savedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Saved</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={faGraduationCap}
                className="text-green-500 text-2xl mr-3"
              />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subjects.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Subjects</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-onyx/60 rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon
                icon={faEye}
                className="text-purple-500 text-2xl mr-3"
              />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAndSortedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Showing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon
              icon={faBookmark}
              size="3x"
              className="text-gray-300 dark:text-gray-600 mb-4"
            />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {savedResources.length === 0
                ? "No Saved Resources Yet"
                : "No Resources Found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {savedResources.length === 0
                ? "Start building your library by saving resources you find interesting!"
                : "Try adjusting your search or filter criteria."}
            </p>
            {savedResources.length === 0 && (
              <button
                onClick={() => (window.location.href = "/explore")} // Adjust route as needed
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Explore Resources
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedResources.map((resource) => (
              <SavedResourceCard
                key={resource._id}
                resource={resource}
                onUnsave={handleUnsave}
                showModal={showModal}
              />
            ))}
          </div>
        )}
      </div>

      {modalConfig && (
        <CustomWarningModal
          isOpen={!!modalConfig}
          onClose={closeModal}
          type={modalConfig.type}
          title={modalConfig.title}
          message={modalConfig.message}
          confirmText={modalConfig.confirmText}
          onConfirm={modalConfig.onConfirm}
          cancelText={modalConfig.cancelText}
          onCancel={modalConfig.onCancel}
        />
      )}
    </div>
  );
};

export default SavedResourcesPage;