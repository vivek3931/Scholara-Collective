import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useTheme } from "../../context/ThemeProvider/ThemeProvider.jsx";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  User,
  Bell,
  Lock,
  Save,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";

// Import the useModal hook instead of CustomWarningModal component
import { useModal } from "../../context/ModalContext/ModalContext.jsx";

const Settings = () => {
  const { user, setUser } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();

  // Get showModal from the ModalContext
  const { showModal } = useModal();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    notifications: true,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Add a useEffect to update form data when the user object changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        notifications: user.notifications,
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.patch(
        "/api/auth/users/profile",
        {
          username: formData.username,
          email: formData.email,
          notifications: formData.notifications,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setUser(response.data.user);
      // Use showModal from context
      showModal({
        type: "success",
        title: "Profile Updated",
        message: "Your profile information has been successfully updated.",
      });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to update profile. Please try again.";
      // Use showModal from context
      showModal({ type: "error", title: "Update Failed", message: errorMessage });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      // Use showModal from context
      showModal({
        type: "error",
        title: "Password Mismatch",
        message: "The new passwords you entered do not match. Please try again.",
      });
      return;
    }

    try {
      await axios.post(
        "/api/auth/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Use showModal from context
      showModal({
        type: "success",
        title: "Password Changed",
        message: "Your password has been successfully updated.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowPasswords({ current: false, new: false, confirm: false });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to change password. Please check your current password.";
      // Use showModal from context
      showModal({ type: "error", title: "Change Failed", message: errorMessage });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx"></div>
      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="max-w-4xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your account preferences and security settings
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Settings Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-charcoal/50 p-6 sticky top-24 shadow-glow-sm">
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
                  {/* Notifications Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                    <div className="flex items-center gap-3">
                      <Bell size={20} className="text-amber-500" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Notifications
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      id="quickNotifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-amber-500 focus:ring-amber-500 border-gray-300 dark:border-charcoal rounded"
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Main Settings Panel */}
            <div className="lg:col-span-2 space-y-8">
              {/* Account Settings */}
              <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
                    <User size={20} className="text-white" />
                  </div>

                  <h2 className="text-2xl font-poppins font-semibold text-gray-800 dark:text-gray-200">
                    Account Information
                  </h2>
                </div>
                {/* Old error/success messages are removed */}
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Username
                      </label>

                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                        placeholder="Enter your username"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Email
                      </label>

                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 font-poppins"
                  >
                    <Save size={18} />
                    Save Changes
                  </button>
                </form>
              </section>
              {/* Password Settings */}
              <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
                    <Shield size={20} className="text-white" />
                  </div>

                  <h2 className="text-2xl font-poppins font-semibold text-gray-800 dark:text-gray-200">
                    Security
                  </h2>
                </div>
                {/* Old password error/success messages are removed */}
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        id="currentPassword"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                        placeholder="Enter current password"
                      />

                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        aria-label="Toggle current password visibility"
                      >
                        {showPasswords.current ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="newPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        New Password
                      </label>

                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          id="newPassword"
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("new")}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Toggle new password visibility"
                        >
                          {showPasswords.new ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="confirmNewPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Confirm New Password
                      </label>

                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          id="confirmNewPassword"
                          name="confirmNewPassword"
                          value={passwordData.confirmNewPassword}
                          onChange={handlePasswordChange}
                          className="block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("confirm")}
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          aria-label="Toggle confirm password visibility"
                        >
                          {showPasswords.confirm ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 font-poppins"
                  >
                    <Lock size={18} />
                    Change Password
                  </button>
                </form>
              </section>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      
    </div>
  );
};

export default Settings;