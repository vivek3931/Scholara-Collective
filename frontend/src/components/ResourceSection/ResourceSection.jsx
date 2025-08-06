import React, { useState, useEffect } from "react";
import ResourceCard from "../ResourceCard/ResourceCard";
import { faSearch, faSpinner , faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const ResourcesSection = ({
  searchQuery,
  filterType,
  filterCourse,
  filterSubject, // Added to match App.jsx context
  sortBy,
  setSortBy,
  showModal,
  isFullPage = false, // <-- New prop with a default value of false
}) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (searchQuery) queryParams.append("search", searchQuery);
        if (filterType && filterType !== "All")
          queryParams.append("type", filterType);
        if (filterCourse && filterCourse !== "All")
          queryParams.append("course", filterCourse);
        if (filterSubject && filterSubject !== "All")
          queryParams.append("subject", filterSubject);
        if (sortBy === "popular") queryParams.append("sortBy", "downloads");
        if (sortBy === "rating") queryParams.append("sortBy", "averageRating");
        if (sortBy === "recent") queryParams.append("sortBy", "createdAt");

        const url = `${API_URL}/resources?${queryParams.toString()}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (Array.isArray(data)) {
          setResources(data);
        } else if (data && Array.isArray(data.resources)) {
          setResources(data.resources);
        } else {
          console.error("API response format is not as expected:", data);
          setResources([]);
        }
      } catch (err) {
        console.error("Failed to fetch resources:", err);
        setError("Failed to load resources. Please try again.");
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [searchQuery, filterType, filterCourse, filterSubject, sortBy]); // Added filterSubject dependency

  const handleGoBack = () =>{
    window.history.back();
  }

  const displayedResources = resources;

  return (
    <section
      className={`px-4 py-8 max-w-full mx-auto min-h-screen transition-all duration-300 animate-fade-in ${
        isFullPage
          ? "bg-gray-100 dark:bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx"
          : "bg-gray-50 dark:bg-transparent"
      } hover:${isFullPage ? "bg-gray-100 dark:bg-zinc-900" : "bg-gray-100"}`}
    >
      <button
                onClick={handleGoBack}
                className={`fixed ${isFullPage ? "visible" : "hidden" } top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-onyx shadow-glow-sm hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-md border border-gray-200 dark:border-charcoal`}
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm"/>
                <span>Back</span>
              </button>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold dark:text-white font-poppins">
          Popular Resources
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-platinum font-poppins">
            Sort by:
          </span>
          <div className="relative">
            <select
              className="p-2 pr-8 border rounded-lg bg-white text-gray-700 border-gray-300 hover:border-gray-400 dark:bg-onyx/80 dark:text-platinum dark:border-onyx font-poppins focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-amber-200 shadow-glow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-500 dark:text-amber-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 flex flex-col items-center justify-center text-gray-600 dark:text-platinum font-poppins">
          <FontAwesomeIcon
            icon={faSpinner}
            spin
            size="2x"
            className="mb-4 text-amber-600 dark:text-amber-200"
          />
          <p>Loading resources...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-red-600 dark:text-amber-300 font-poppins">
          Error: {error}
        </div>
      )}

      {!loading && !error && displayedResources.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-amber-50/80 flex items-center justify-center shadow-glow-sm">
              <FontAwesomeIcon
                icon={faSearch}
                className="text-2xl text-amber-600 dark:text-amber-200"
              />
            </div>
            <h3 className="text-xl font-medium bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 bg-clip-text text-transparent font-poppins mb-2">
              No resources found
            </h3>
            <p className="text-gray-600 dark:text-platinum font-poppins">
              Try adjusting your search terms or filters.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mx-auto gap-8 ">
        {displayedResources.map((resource) => (
          <ResourceCard
            key={resource._id}
            resource={resource}
            showModal={showModal}
          />
        ))}
      </div>
    </section>
  );
};

export default ResourcesSection;
