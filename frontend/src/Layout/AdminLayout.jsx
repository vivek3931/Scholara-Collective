import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext/AuthContext";
import AdminHeader from "../components/AdminHeader/AdminHeader";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";


const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const mobileBreakpoint = 1024;
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    window.innerWidth >= mobileBreakpoint
  );
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      return savedTheme === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Update theme based on isDarkMode state
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  // Handle window resize to manage sidebar state
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= mobileBreakpoint);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-platinum/95 dark:bg-onyx/95 transition-colors duration-300">
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        handleLogout={handleLogout}
        location={location}
        mobileBreakpoint={mobileBreakpoint}
      />

      {/* Main Content Area */}
      <div
        className={`min-h-screen transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          toggleDarkMode={toggleDarkMode}
          isDarkMode={isDarkMode}
          user={user}
          location={location}
        />
        <main className="p-2 lg:p-5 bg-gray-50 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx min-h-screen transition-colors duration-300">
          <div className="max-w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
