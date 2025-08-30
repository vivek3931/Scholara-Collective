import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
  User,
  Calendar,
  Tag,
  Download,
  Star,
  Eye,
  ArrowLeft,
  Loader2,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  AlertCircle,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // State management
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [visiblePages, setVisiblePages] = useState(new Set([1]));
  const [numPages, setNumPages] = useState(0);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  console.log(resources )

  console.log(resources[0]?.thumbnailUrl)

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState({
    subject: searchParams.get("subject") || "",
    year: searchParams.get("year") || "",
    tags: searchParams.get("tags") || "",
    sort: searchParams.get("sort") || "newest",
  });

  useEffect(() => {
    if (!previewDataUrl || !numPages || numPages <= 1) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const newVisiblePages = new Set(visiblePages);
        let shouldUpdate = false;

        entries.forEach(entry => {
          const pageNumber = parseInt(entry.target.getAttribute('data-page-number'), 10);

          if (entry.isIntersecting) {
            if (!newVisiblePages.has(pageNumber)) {
              newVisiblePages.add(pageNumber);
              shouldUpdate = true;
            }
          }
        });

        if (shouldUpdate) {
          setVisiblePages(newVisiblePages);
        }
      },
      { threshold: 0.1 }
    );

    // Observe all page elements
    const pageElements = document.querySelectorAll('[data-page-number]');
    pageElements.forEach(el => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [previewDataUrl, numPages, visiblePages]);

  // Get file type icon and color
  const getFileTypeIcon = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "image":
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="w-8 h-8 text-blue-500" />;
      case "xlsx":
      case "xls":
        return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
      case "pptx":
      case "ppt":
        return <Presentation className="w-8 h-8 text-orange-500" />;
      default:
        return <FileText className="w-8 h-8 text-gray-500" />;
    }
  };

  // Get file type background color for thumbnail
  const getFileTypeBackground = (fileType) => {
    switch (fileType?.toLowerCase()) {
      case "pdf":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "image":
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
      case "xlsx":
      case "xls":
        return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "pptx":
      case "ppt":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700";
    }
  };

  // Fetch search results
  const fetchSearchResults = async (query, currentFilters, page = 1) => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        search: query,
        page: page.toString(),
        limit: "10",
      });

      // Add filters to params
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && key !== "sort") {
          params.append(key, value);
        }
      });

      if (currentFilters.sort && currentFilters.sort !== "newest") {
        params.append("sort", currentFilters.sort);
      }

      const response = await axios.get(`${API_URL}/resources?${params}`);
      const data = response.data;

      setResources(data.resources || []);
      setTotalResults(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 1);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to fetch search results. Please try again.");
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch search suggestions
  const fetchSuggestions = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_URL}/resources/suggestions?search=${encodeURIComponent(query)}`
      );
      setSuggestions(response.data || []);
    } catch (err) {
      console.error("Suggestions error:", err);
      setSuggestions([]);
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Update URL params
    const newParams = new URLSearchParams();
    newParams.set("q", searchQuery);
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      }
    });

    setSearchParams(newParams);
    fetchSearchResults(searchQuery, filters, 1);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL
    const newParams = new URLSearchParams();
    newParams.set("q", searchQuery);
    Object.entries(newFilters).forEach(([filterKey, filterValue]) => {
      if (filterValue) {
        newParams.set(filterKey, filterValue);
      }
    });

    setSearchParams(newParams);
    fetchSearchResults(searchQuery, newFilters, 1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchSearchResults(searchQuery, filters, page);
    window.scrollTo(0, 0);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.title);
    setSuggestions([]);
    navigate(`/resources/${suggestion._id}`);
  };

  // Initial search on component mount
  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearchQuery(query);
      const initialFilters = {
        subject: searchParams.get("subject") || "",
        year: searchParams.get("year") || "",
        tags: searchParams.get("tags") || "",
        sort: searchParams.get("sort") || "newest",
      };
      setFilters(initialFilters);
      fetchSearchResults(query, initialFilters, 1);
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch suggestions on search query change
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery !== searchParams.get("q")) {
        fetchSuggestions(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx"></div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-16 lg:px-8 py-8 flex-1">
        <button onClick={handleBackClick}  className="mb-4 fixed top-4 left-4 bg-white dark:bg-charcoal dark:hover:bg-onyx shadow-glow-sm duration-200 rounded-md hover:scale-105 px-4 py-2 z-20 flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100">
          <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white mb-4">
              Search Results
            </h1>

            {/* Search Form */}
            <div className="relative mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit(e)}
                  placeholder="Search for resources..."
                  className="w-full px-6 py-4 pl-12 pr-16 text-lg bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg border border-gray-300 dark:border-charcoal rounded-2xl dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 shadow-glow-sm"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-glow-sm"
                >
                  Search
                </button>
              </div>

              {/* Search Suggestions */}
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-charcoal rounded-xl shadow-xl border border-gray-200 dark:border-charcoal z-50 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion._id || index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                    >
                      <Search className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {suggestion.title}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Info and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-gray-600 dark:text-gray-400">
                {!loading && (
                  <span>
                    {totalResults > 0
                      ? `Found ${totalResults} result${
                          totalResults === 1 ? "" : "s"
                        } for "${searchParams.get("q")}"`
                      : `No results found for "${searchParams.get("q")}"`}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Filter Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white/95 dark:bg-charcoal/95 border border-gray-300 dark:border-charcoal rounded-xl hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
                >
                  <Filter className="w-4 h-4" /> Filters
                </button>
                {/* Sort Dropdown */}
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="px-4 py-2 bg-white/95 dark:bg-charcoal/95 border dark:text-white border-gray-300 dark:border-charcoal rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 shadow-sm"
                >
                  <option value="newest">Newest First</option>
                  <option value="downloads">Most Downloaded</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mt-6 p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl border border-gray-200 dark:border-charcoal shadow-glow-sm animate-fade-in">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={filters.subject}
                      onChange={(e) =>
                        handleFilterChange("subject", e.target.value)
                      }
                      placeholder="Filter by subject"
                      className="w-full px-3 py-2 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 "
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      value={filters.year}
                      onChange={(e) =>
                        handleFilterChange("year", e.target.value)
                      }
                      placeholder="Filter by year"
                      className="w-full px-3 py-2 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={filters.tags}
                      onChange={(e) =>
                        handleFilterChange("tags", e.target.value)
                      }
                      placeholder="Filter by tags (comma-separated)"
                      className="w-full px-3 py-2 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200 "
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Searching...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Search Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() =>
                  fetchSearchResults(searchQuery, filters, currentPage)
                }
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-glow-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && resources.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No resources found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Try a different search query or adjust your filters.
              </p>
            </div>
          )}

          {/* Search Results List */}
          {!loading && !error && resources.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {resources.map((resource) => (
                <Link
                  to={`/resources/${resource._id}`}
                  key={resource._id}
                  className="flex flex-row bg-white/95 dark:bg-onyx backdrop-blur-lg rounded-2xl overflow-hidden shadow-glow-sm border border-gray-200 dark:border-charcoal transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1"
                >
                  {/* Thumbnail/Icon */}
                  <div
                    className={`relative flex-shrink-0 flex items-center justify-center w-24 sm:w-32 lg:min-h-full h-auto  ${getFileTypeBackground(
                      resource.fileType
                    )}`}
                  >
                    {resource.fileType === "pdf" ? (
                      <img
                        src={resource.thumbnailUrl}
                        alt={`Thumbnail for ${resource.title}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      getFileTypeIcon(resource.fileType)
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
                        {resource.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {resource.description || "No description provided."}
                      </p>
                    </div>

                    <div className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>{resource.uploadedBy?.username || "N/A"}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <BookOpen className="w-3 h-3 text-gray-400" />
                        <span>{resource.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{resource.year}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-charcoal border border-gray-300 dark:border-charcoal rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      currentPage === page
                        ? "bg-gradient-to-r from-amber-500 to-orange-400 text-white"
                        : "bg-white dark:bg-charcoal border border-gray-300 dark:border-charcoal hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-charcoal border border-gray-300 dark:border-charcoal rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>

      
    </div>
  );
};

export default SearchResults;