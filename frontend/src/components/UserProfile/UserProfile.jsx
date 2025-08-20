import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faUser,
  faSignOutAlt,
  faEdit,
  faSave,
  faTimes,
  faCalendarAlt,
  faEnvelope,
  faArrowLeft,
  faUpload,
  faBookmark,
} from "@fortawesome/free-solid-svg-icons"; // Added faUpload, faBookmark
import { useAuth } from "../../context/AuthContext/AuthContext.jsx";
import SavedResources from "../SavedResources/SavedResources.jsx"; // Import the SavedResources component
import UniversalResourceCard from "../UniversalResourceCard/UniversalResourceCard.jsx";
import { useNavigate } from "react-router-dom";

const Profile = ({ showModal }) => {
  const {
    user,
    token,
    logout,
    setUser,
    error: authError,
    clearError,
  } = useAuth();
  const [resources, setResources] = useState([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ username: "", bio: "" });
  const [activeTab, setActiveTab] = useState("uploads"); // State for active tab: 'uploads' or 'saved'
  const navigate = useNavigate();

  console.log("User in Profile:", user);

  useEffect(() => {
    const fetchUploadedResources = async () => {
      setLoadingResources(true);
      setError(null);

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://localhost:5000/api"
          }/resources/my-uploaded`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setResources(data.resources || []);
      } catch (err) {
        console.error("Failed to fetch uploaded resources:", err);
        setError("Failed to load your uploaded resources. Please try again.");
      } finally {
        setLoadingResources(false);
      }
    };

    if (user && activeTab === "uploads") {
      // Fetch only if user exists and 'uploads' tab is active
      setFormData({ username: user.username || "", bio: user.bio || "" });
      fetchUploadedResources();
    }
    // No explicit fetch for 'saved' here, as SavedResources component will handle its own fetching
  }, [user, token, activeTab]); // Added activeTab to dependencies

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResourceDeleted = async (resourceId) => {
    // Remove from resources state
    setResources((prev) =>
      prev.filter((resource) => resource._id !== resourceId)
    );

    showModal({
      type: "success",
      title: "Resource Deleted",
      message: "The resource has been successfully deleted.",
      confirmText: "OK",
    });
  };

  const handleSave = async () => {
    setError(null);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000/api"
        }/users/profile`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedData = await response.json();
      // Update AuthContext user state to ensure consistency across the app
      setUser((prev) => ({ ...prev, ...formData }));
      clearError();
      setIsEditing(false);
      showModal({
        type: "success",
        title: "Profile Updated",
        message: "Your profile has been successfully updated!",
      });
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError(
        "Failed to update profile. This endpoint may not be implemented yet or there was a server error."
      );
      showModal({
        type: "error",
        title: "Profile Update Failed",
        message: error || "Failed to update profile. Please try again.",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Failed to logout. Please try again.");
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const displayError = error || authError;

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-onyx dark:via-charcoal dark:to-onyx transition-all duration-300 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={handleGoBack}
          className={`fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-onyx shadow-glow-sm hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-md border border-gray-200 dark:border-charcoal`}
        >
          <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
          <span>Back</span>
        </button>
        {/* Profile Header */}
        <div className="flex flex-col pt-10 sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-poppins">
              My Profile
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage your account and resources
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleEditToggle}
              className={`flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-all duration-200
                ${
                  isEditing
                    ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                }
                hover:shadow-md`}
            >
              <FontAwesomeIcon icon={isEditing ? faTimes : faEdit} />
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg
                       bg-gray-100 text-gray-700 hover:bg-gray-200
                       dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600
                       transition-all duration-200 hover:shadow-md"
            >
              <FontAwesomeIcon icon={faSignOutAlt} />
              Logout
            </button>
          </div>
        </div>

        {/* Loading State for Resources */}
        {loadingResources && activeTab === "uploads" && (
          <div className="text-center py-12 flex flex-col items-center justify-center text-gray-600 dark:text-platinum font-poppins">
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              size="2x"
              className="mb-4 text-blue-600 dark:text-blue-400"
            />
            <p>Loading your uploaded resources...</p>
          </div>
        )}

        {/* Error State */}
        {displayError && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 dark:border-red-400 p-4 mb-8 rounded-r-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500 dark:text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {displayError}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!loadingResources && !displayError && user && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx shadow-glow-sm rounded-xl overflow-hidden transition-all duration-300 hover:shadow-xl">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div className="relative mb-4">
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/70 flex items-center justify-center shadow-lg">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="text-5xl text-blue-600 dark:text-blue-400"
                        />
                      </div>
                      {isEditing && (
                        <button className="absolute bottom-0 right-0 bg-white dark:bg-gray-700 p-2 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <svg
                            className="w-5 h-5 text-blue-600 dark:text-blue-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="w-full space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Bio
                          </label>
                          <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleInputChange}
                            rows="4"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            placeholder="Tell us about yourself..."
                          />
                        </div>
                        <button
                          onClick={handleSave}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faSave} />
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent dark:from-blue-400 dark:to-blue-300 mb-2">
                          {user.username}
                        </h3>

                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-4">
                          <FontAwesomeIcon icon={faEnvelope} className="mr-2" />
                          <span>{user.email}</span>
                        </div>

                        <div className="flex items-center justify-center text-gray-600 dark:text-gray-400 mb-6">
                          <FontAwesomeIcon
                            icon={faCalendarAlt}
                            className="mr-2"
                          />
                          <span>
                            Joined{" "}
                            {new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              { year: "numeric", month: "long" }
                            )}
                          </span>
                        </div>

                        <div className="bg-gray-50 dark:bg-onyx/60 shadow-glow-sm p-4 rounded-lg">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                            ABOUT ME
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {user.bio ||
                              "No bio provided yet. Share something about yourself!"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resources Section - now with Tabs */}
            <div className="lg:col-span-2">
              <div className="bg-white bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx shadow-glow-sm rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
                {/* Tab Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav
                    className="-mb-px flex space-x-8 px-6 pt-5"
                    aria-label="Tabs"
                  >
                    <button
                      onClick={() => setActiveTab("uploads")}
                      className={`${
                        activeTab === "uploads"
                          ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2`}
                    >
                      <FontAwesomeIcon icon={faUpload} />
                      My Uploads
                    </button>
                    <button
                      onClick={() => setActiveTab("saved")}
                      className={`${
                        activeTab === "saved"
                          ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-300"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                      } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 flex items-center gap-2`}
                    >
                      <FontAwesomeIcon icon={faBookmark} />
                      Saved Resources
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="lg:p-5 p-3">
                  {activeTab === "uploads" && (
                    <>
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
                        Your Uploaded Resources
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {resources.length}{" "}
                        {resources.length === 1 ? "resource" : "resources"}{" "}
                        shared
                      </p>
                      {resources.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {resources.map((resource) => (
                            <UniversalResourceCard
                              key={resource._id}
                              resource={resource}
                              variant="profile"
                              onResourceDeleted={handleResourceDeleted}
                              showPreview={false}
                              showTags={false}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="p-12 text-center">
                          <div className="mx-auto max-w-md">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
                              <svg
                                className="h-8 w-8 text-blue-600 dark:text-blue-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                />
                              </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                              No resources uploaded yet
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                              Start sharing your knowledge by uploading study
                              materials!
                            </p>
                            <button
                              onClick={() => navigate("/upload")}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Upload Your First Resource
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
