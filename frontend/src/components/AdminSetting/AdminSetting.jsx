import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useTheme } from "../../context/ThemeProvider/ThemeProvider.jsx";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  BarChart2, // For analytics
  CheckCircle, // For success icons
  XCircle, // For error icons
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

// Import the CustomWarningModal component (assuming it's in the same relative path)
import CustomWarningModal from "../CustomWarningModal/CustomWarningModal.jsx";

const AdminSettings = () => {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // State for the custom modal
  const [modal, setModal] = useState({
    isOpen: false,
    type: "",
    title: "",
    message: "",
    onConfirm: () => {}, // Callback for confirm action
    showCancel: false, // Whether to show a cancel button
  });

  // State for analytics data only
  const [analyticsSummary, setAnalyticsSummary] = useState(null);
  const [publicStats, setPublicStats] = useState(null); // To display public-facing stats
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  console.log("Analytics summary in admin setting ",analyticsSummary)

  // Function to open the modal with specific content
  const openModal = (type, title, message, onConfirm = () => {}, showCancel = false) => {
    setModal({ isOpen: true, type, title, message, onConfirm, showCancel });
  };

  // Function to close the modal
  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // Check if the user has admin or superadmin role for access
  useEffect(() => {
    if (user && (user.roles?.includes("admin") || user.roles?.includes("superadmin"))) {
      fetchAnalyticsData();
    } else if (user) {
      // If user is logged in but not an admin, redirect them
      openModal(
        "error",
        "Access Denied",
        "You do not have administrative privileges to view this page.",
        () => navigate("/dashboard") // Redirect to dashboard on close
      );
    }
  }, [user, navigate]); // Depend on user and navigate

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      openModal("error", "Authentication Error", "No authentication token found. Please log in again.", () => navigate("/login"));
      setLoading(false);
      return;
    }

    try {
      // Fetch analytics summary from the new analyticsRoutes
      const summaryResponse = await axios.get("/api/analytics/summary", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalyticsSummary(summaryResponse.data);

      // Fetch public stats from the new analyticsRoutes
      const publicStatsResponse = await axios.get("/api/analytics/public-stats", {
        // This endpoint might not require admin token, but including for consistency if it's part of admin view
        headers: { Authorization: `Bearer ${token}` },
      });
      setPublicStats(publicStatsResponse.data);

    } catch (err) {
      console.error("Error fetching analytics data:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to fetch analytics data. You might not have sufficient permissions.";
      setError(errorMessage);
      openModal("error", "Data Fetch Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if the user has admin or superadmin role for rendering
  if (!user || (!user.roles?.includes("admin") && !user.roles?.includes("superadmin"))) {
    // Render nothing or a loading spinner while the redirect happens via useEffect
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-800 dark:text-gray-200">
        <p>Checking permissions...</p>
        <CustomWarningModal
          isOpen={modal.isOpen}
          onClose={closeModal}
          type={modal.type}
          title={modal.title}
          message={modal.message}
          onConfirm={modal.onConfirm}
          showCancel={modal.showCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* The CustomWarningModal component is rendered here, controlled by the `modal` state */}
      <CustomWarningModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        showCancel={modal.showCancel}
      />

      

      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx"></div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white mb-2">
              Admin System Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Configure system-wide settings and view platform analytics.
            </p>
          </div>

          {loading && (
            <div className="text-center text-gray-700 dark:text-gray-300">
              Loading admin data...
            </div>
          )}

          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <XCircle size={20} />
              <span>Error: {error}</span>
            </div>
          )}

          {!loading && !error && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Quick Settings / Theme Toggle */}
              <div className="lg:col-span-1">
                <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-6 sticky top-24 mb-8">
                  <h2 className="text-lg font-poppins font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Quick Settings
                  </h2>
                  <div className="space-y-4">
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                      <div className="flex items-center gap-3">
                        {isDarkMode ? (
                          <Moon size={20} className="text-amber-500" />
                        ) : (
                          <Sun size={20} className="text-orange-400" />
                        )}
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {isDarkMode ? "Dark Mode" : "Light Mode"}
                        </span>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-amber-500/20 border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 dark:focus:ring-offset-charcoal"
                        aria-label="Toggle dark mode"
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-amber-500 transition-transform duration-200 shadow-md ${
                            isDarkMode ? "translate-x-5" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Analytics Panel */}
              <div className="lg:col-span-2 space-y-8">
                {/* Analytics Overview */}
                <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-8">
                  <div className="flex items-center gap-3 mb-6 ">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
                      <BarChart2 size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-poppins font-semibold text-gray-800 dark:text-gray-200">
                      Platform Analytics
                    </h2>
                  </div>
                  {analyticsSummary && publicStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-amber-500">
                          {analyticsSummary.totalUsers}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Users (Platform)
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-orange-400">
                          {analyticsSummary.totalResources}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Resources (Platform)
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-blue-500">
                          {analyticsSummary.totalDownloads}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total Downloads
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-red-500">
                          {analyticsSummary.totalFlaggedResources}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Flagged Resources
                        </p>
                      </div>
                      {/* Public facing stats from /api/analytics/public-stats */}
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-purple-500">
                          {publicStats.students}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Public Students
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-green-500">
                          {publicStats.resources}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Public Resources
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-cyan-500">
                          {publicStats.courses}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Unique Courses (Public)
                        </p>
                      </div>
                      <div className="bg-gray-50 dark:bg-onyx/50 p-4 rounded-xl border border-gray-200 dark:border-charcoal">
                        <p className="text-4xl font-bold text-yellow-500">
                          {publicStats.universities}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Unique Institutions (Public)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-600 dark:text-gray-400">
                      No analytics data available.
                    </p>
                  )}
                </section>
                {/* Add other system configuration sections here as needed */}
                <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-8">
                  <h2 className="text-2xl font-poppins font-semibold text-gray-800 dark:text-gray-200 mb-4">
                    Other System Configurations
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    This section can be expanded to include other global settings like:
                    <ul className="list-disc list-inside mt-2 ml-4">
                        <li>User registration settings (e.g., enable/disable new registrations)</li>
                        <li>Content moderation settings</li>
                        <li>Email notification preferences for system alerts</li>
                        <li>API key management (if applicable)</li>
                    </ul>
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      
    </div>
  );
};

export default AdminSettings;
