import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useResource } from "../../context/ResourceContext/ResourceContext";
import {
  BookOpen,
  User,
  Calendar,
  FileText,
  Image,
  FileSpreadsheet,
  Presentation,
  AlertCircle,
  Loader2,
  Filter,
  Search,
} from "lucide-react";

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const {
    performSearch,
    searchResults,
    searchLoading,
    searchError,
    totalResults,
    totalPages,
    currentPage,
  } = useResource();

  // Filter state
  const [filters, setFilters] = useState({
    subject: searchParams.get("subject") || "",
    year: searchParams.get("year") || "",
    tags: searchParams.get("tags") || "",
    sort: searchParams.get("sort") || "newest",
  });
  const [showFilters, setShowFilters] = useState(false);

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

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);

    // Update URL
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }

    setSearchParams(newParams);
    performSearch(searchParams.get("q") || "", newFilters, 1);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", page.toString());
    setSearchParams(newParams);
    performSearch(searchParams.get("q") || "", filters, page);
    window.scrollTo(0, 0);
  };

  // Initial search on component mount and when searchParams change
  useEffect(() => {
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const initialFilters = {
      subject: searchParams.get("subject") || "",
      year: searchParams.get("year") || "",
      tags: searchParams.get("tags") || "",
      sort: searchParams.get("sort") || "newest",
    };
    setFilters(initialFilters);
    if (query) {
      performSearch(query, initialFilters, page);
    }
  }, [searchParams, performSearch]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx"></div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-16 lg:px-8 py-8 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-8 animate-fade-in">
            <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white mb-4">
              Search Results
            </h1>

            {/* Results Info and Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-gray-600 dark:text-gray-400">
                {!searchLoading && (
                  <span>
                    {totalResults > 0
                      ? `Found ${totalResults} result${
                          totalResults === 1 ? "" : "s"
                        } for "${searchParams.get("q") || ""}"`
                      : `No results found for "${searchParams.get("q") || ""}"`}
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
                      className="w-full px-3 py-2 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200"
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
                      className="w-full px-3 py-2 bg-white dark:bg-onyx border border-gray-300 dark:border-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {searchLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Searching...
              </span>
            </div>
          )}

          {/* Error State */}
          {searchError && (
            <div className="text-center py-12">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Search Failed
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchError}
              </p>
              <button
                onClick={() =>
                  performSearch(
                    searchParams.get("q") || "",
                    filters,
                    currentPage
                  )
                }
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl hover:scale-105 transition-all duration-200 shadow-glow-sm"
              >
                Try Again
              </button>
            </div>
          )}

          {/* No Results */}
          {!searchLoading &&
            !searchError &&
            searchResults.length === 0 &&
            searchParams.get("q") && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No resources found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try a different search query using the search bar above.
                </p>
              </div>
            )}

          {/* Search Results List */}
          {!searchLoading && !searchError && searchResults.length > 0 && (
            <div className="flex flex-col gap-4 animate-fade-in-up">
              {searchResults.map((resource) => (
                <Link
                  to={`/resources/${resource._id}`}
                  key={resource._id}
                  className="flex flex-row bg-white/95 dark:bg-onyx backdrop-blur-lg rounded-2xl overflow-hidden shadow-glow-sm border border-gray-200 dark:border-charcoal transition-all duration-300 hover:shadow-glow-lg hover:-translate-y-1"
                >
                  {/* Thumbnail/Icon */}
                  <div
                    className={`relative flex-shrink-0 flex items-center justify-center w-24 sm:w-32 lg:min-h-full h-auto ${getFileTypeBackground(
                      resource.fileType
                    )}`}
                  >
                    {resource.fileType === "pdf" ? (
                      <img
                        src={resource.thumbnailUrl || "https://res.cloudinary.com/dr9zse9a6/image/upload/v1756788547/scholara_note_qzpglu.svg"}
                        onError={(e)=>{
                          e.target.onerror = null;
                           e.target.src = "https://res.cloudinary.com/dr9zse9a6/image/upload/v1756788547/scholara_note_qzpglu.svg"
                        }}
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
