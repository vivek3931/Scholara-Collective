import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBookmark,
  faSearch,
  faFilter,
  faSpinner,
  faExclamationTriangle,
  faChevronDown,
  faChevronUp,
  faGraduationCap,
  faEye,
  faArrowLeft,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useModal } from "../../context/ModalContext/ModalContext";
import { useTheme } from "../../context/ThemeProvider/ThemeProvider.jsx";
import CustomWarningModal from "../CustomWarningModal/CustomWarningModal";
import UniversalResourceCard from "../UniversalResourceCard/UniversalResourceCard";
import Navbar from "../Navbar/Navbar";

const SavedResourcesPage = () => {
  const { token, isAuthenticated } = useAuth();
  const { showModal, closeModal } = useModal();
  const { isDarkMode } = useTheme();
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

  // Handle unsaving a resource
  const handleUnsave = useCallback((resourceId) => {
    setSavedResources((prev) =>
      prev.filter((resource) => resource._id !== resourceId)
    );
  }, []);

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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx flex items-center justify-center">
        <div className="text-center  backdrop-blur-lg rounded-2xl p-8 border border-gray-200/50 dark:border-charcoal/50">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="2x"
            className="text-amber-500 mb-4"
          />
          <p className="text-gray-600 dark:text-gray-400 font-poppins">
            Loading your saved resources...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx flex items-center justify-center">
        <div className="text-center max-w-md bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl p-8 shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            size="2x"
            className="text-red-500 mb-4"
          />
          <h2 className="text-xl font-poppins font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Resources
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4 font-poppins">{error}</p>
          <button
            onClick={fetchSavedResources}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 font-poppins"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx">
      
      
      <div className="relative z-10 max-w-7xl mx-auto p-4  animate-fade-in">
        {/* Page Header */}
        <div className="flex items-center justify-center gap-3 mb-6 sm:mb-10 sm:pt-8">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl shadow-glow-sm">
            <FontAwesomeIcon
              icon={faBookmark}
              className="text-white text-xl sm:text-2xl"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-poppins font-bold text-gray-900 dark:text-white">
            My Saved Resources
          </h1>
        </div>

        <p className="text-gray-600 dark:text-gray-400 mb-8 text-center sm:text-left font-poppins">
          Your personal library of saved academic resources
        </p>

        {/* Search and Filters */}
        <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-6 mb-8 overflow-hidden">
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-charcoal rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-onyx/95 dark:text-white bg-white/95 transition-all duration-200 hover:shadow-glow-sm font-poppins"
                />
              </div>
            </div>

            {/* Sort and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto px-4 py-3 border border-gray-300 dark:border-charcoal rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-onyx/95 dark:text-white bg-white/95 appearance-none pr-8 transition-all duration-200 hover:shadow-glow-sm font-poppins"
                >
                  <option value="savedDate">Recently Saved</option>
                  <option value="title">Title A-Z</option>
                  <option value="subject">Subject</option>
                  <option value="rating">Highest Rated</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="year">Newest Year</option>
                </select>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full sm:w-auto px-4 py-3 bg-gray-100/95 dark:bg-onyx/95 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 hover:scale-105 shadow-glow-sm font-poppins"
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>Filters</span>
                <FontAwesomeIcon
                  icon={showFilters ? faChevronUp : faChevronDown}
                />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-charcoal/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                    Subject
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-charcoal rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-onyx/95 dark:text-white bg-white/95 appearance-none pr-8 transition-all duration-200 hover:shadow-glow-sm font-poppins"
                    >
                      <option value="">All Subjects</option>
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 font-poppins">
                    File Type
                  </label>
                  <div className="relative">
                    <select
                      value={filterBy}
                      onChange={(e) => setFilterBy(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 dark:border-charcoal rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent dark:bg-onyx/95 dark:text-white bg-white/95 appearance-none pr-8 transition-all duration-200 hover:shadow-glow-sm font-poppins"
                    >
                      <option value="all">All Types</option>
                      <option value="pdf">PDF Documents</option>
                      <option value="image">Images</option>
                      <option value="document">Office Documents</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedSubject("");
                      setFilterBy("all");
                      setSortBy("savedDate");
                    }}
                    className="w-full sm:w-auto px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-charcoal rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-105 shadow-glow-sm font-poppins"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-glow-sm mr-4">
                <FontAwesomeIcon
                  icon={faBookmark}
                  className="text-white text-xl"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {savedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400 font-poppins">Total Saved</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl shadow-glow-sm mr-4">
                <FontAwesomeIcon
                  icon={faGraduationCap}
                  className="text-white text-xl"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {subjects.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400 font-poppins">Subjects</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-6 hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-glow-sm mr-4">
                <FontAwesomeIcon
                  icon={faEye}
                  className="text-white text-xl"
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white font-poppins">
                  {filteredAndSortedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400 font-poppins">Showing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-16 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50">
            <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:bg-onyx/60 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FontAwesomeIcon
                icon={faBookmark}
                size="2x"
                className="text-gray-400 dark:text-charcoal"
              />
            </div>
            <h3 className="text-2xl font-poppins font-semibold text-gray-900 dark:text-white mb-3">
              {savedResources.length === 0
                ? "No Saved Resources Yet"
                : "No Resources Found"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto font-poppins">
              {savedResources.length === 0
                ? "Start building your library by saving resources you find interesting!"
                : "Try adjusting your search or filter criteria."}
            </p>
            {savedResources.length === 0 && (
              <button
                onClick={() => (window.location.href = "/resources")}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 font-poppins"
              >
                Explore Resources
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedResources.map((resource, index) => (
              <div
                key={resource._id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <UniversalResourceCard
                  resource={resource}
                  variant="saved"
                  onUnsave={handleUnsave}
                  onSave={fetchSavedResources}
                />
              </div>
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
          isDismissible={modalConfig.isDismissible}
        />
      )}
    </div>
  );
};

export default SavedResourcesPage;