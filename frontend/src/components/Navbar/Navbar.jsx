import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Menu,
  X,
  Moon,
  Sun,
  Upload,
  Home,
  BookOpen,
  Info,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Bookmark,
  LayoutDashboard,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useNavigate } from "react-router-dom";
import logo from '../../assets/logo.svg'

// Desktop NavLink component
const DesktopNavLink = ({ to, text }) => (
  <NavLink
    to={to}
    className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 group overflow-hidden"
  >
    <span className="text-sm">{text}</span>
    <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-400 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
  </NavLink>
);

// Mobile NavLink component
const MobileNavLink = ({ to, icon, text, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-white dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
  >
    <span className="text-gray-500 dark:text-gray-400">{icon}</span>
    <span className="text-sm">{text}</span>
  </Link>
);

const Navbar = ({ isDarkMode, toggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const profileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  // Check if the user is an admin or superadmin
  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

  // --- Body Scroll Lock Logic ---
  useEffect(() => {
    const body = document.body;

    if (isMobileMenuOpen) {
      // Prevent scrolling
      body.style.overflow = "hidden";
    } else {
      // Restore scrolling
      body.style.overflow = "";
    }

    // Cleanup
    return () => {
      body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // --- Mobile Menu Toggle with Animation Control ---
  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsAnimating(false);
      setTimeout(() => {
        setIsMobileMenuOpen(false);
      }, 300);
    } else {
      setIsMobileMenuOpen(true);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    }
  };

  // --- Profile Dropdown Toggle ---
  const toggleProfileDropdown = () => {
    setIsProfileDropdownOpen((prev) => !prev);
  };

  // --- Handle Logout ---
  const handleLogout = () => {
    logout();
    navigate("/");
    setIsProfileDropdownOpen(false);
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  // --- Handle NavLink click (closes mobile menu and dropdown) ---
  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
    setIsProfileDropdownOpen(false);
  };

  // --- Close handlers for clicking outside dropdowns/menus ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Toggle mobile menu"]')
      ) {
        toggleMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // --- Handle Escape Key ---
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (isMobileMenuOpen) toggleMobileMenu();
        if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-onyx/60 backdrop-blur-lg shadow-lg border-b border-gray-200/50 dark:border-charcoal/50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 group">
          <img src={logo} alt="Scholara Collective Logo" className="h-full w-full" />
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden lg:flex items-center space-x-6">
          <DesktopNavLink to="/" text="Home" />
          <DesktopNavLink to="/resources" text="Resources" />
          {isAuthenticated && (
            <>
              <DesktopNavLink to="/saved" text="My Library" />
              <DesktopNavLink to="/upload" text="Upload" />
              {isAdmin && <DesktopNavLink to="/admin" text="Admin" />}
            </>
          )}
          <DesktopNavLink to="/about" text="About" />
        </div>

        {/* Right side: Auth/Profile, Dark Mode Toggle, Mobile Menu Button */}
        <div className="flex items-center space-x-4">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 transform active:scale-95"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
          </button>

          {/* User Profile / Auth Buttons (Desktop) */}
          {isAuthenticated ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-charcoal rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 group relative overflow-hidden hover:shadow-glow-sm dark:hover:shadow-glow-sm transform active:scale-95"
                aria-label="Profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden md:block text-gray-700 dark:text-gray-200 font-medium text-sm">
                  {user?.username || "User"}
                </span>
                <ChevronDown
                  size={16}
                  className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isProfileDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal rounded-lg shadow-xl py-2 animate-fade-in ring-1 ring-black ring-opacity-5 focus:outline-none">
                  {user && (
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-charcoal">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.username || "User"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                        {user.roles || "Member"}
                      </p>
                    </div>
                  )}
                  <Link
                    to="/saved"
                    onClick={handleNavLinkClick}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Bookmark size={16} className="mr-3" /> My Library
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={handleNavLinkClick}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      <LayoutDashboard size={16} className="mr-3" /> Admin
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={handleNavLinkClick}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <User size={16} className="mr-3" /> Profile
                  </Link>
                  <Link
                    to="/settings"
                    onClick={handleNavLinkClick}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <Settings size={16} className="mr-3" /> Settings
                  </Link>
                  <div className="border-t border-gray-100 dark:border-charcoal my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    <LogOut size={16} className="mr-3" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-colors duration-200"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 hover:shadow-glow-sm dark:hover:shadow-glow-sm transform active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button (Hamburger) */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 transform active:scale-95"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Side Navigation - Backdrop & Menu Container */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop - Fixed positioning to cover entire viewport */}
          <div
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ minHeight: "100vh", width: "100vw" }}
            onClick={toggleMobileMenu}
          />

          {/* Mobile Menu - Fixed positioning with transform */}
          <div
            ref={mobileMenuRef}
            className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-2xl transition-transform duration-300 ease-in-out ${
              isAnimating ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-charcoal bg-gray-50/80 dark:bg-onyx backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Scholara Collective Logo" className="h-8 w-auto" />
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-700 dark:text-gray-200" />
              </button>
            </div>

            {/* Navigation Content */}
            <div className="flex flex-col h-[calc(100dvh-64px)]">
              {/* Navigation Links */}
              <div className="flex-1 p-4 space-y-1 overflow-y-auto bg-white/90 dark:bg-onyx backdrop-blur-sm">
                <nav className="space-y-1">
                  <MobileNavLink
                    to="/"
                    icon={<Home size={18} />}
                    text="Home"
                    onClick={handleNavLinkClick}
                  />
                  <MobileNavLink
                    to="/resources"
                    icon={<BookOpen size={18} />}
                    text="Resources"
                    onClick={handleNavLinkClick}
                  />
                  {isAuthenticated && (
                    <>
                      <MobileNavLink
                        to="/saved"
                        icon={<Bookmark size={18} />}
                        text="My Library"
                        onClick={handleNavLinkClick}
                      />
                      <MobileNavLink
                        to="/upload"
                        icon={<Upload size={18} />}
                        text="Upload"
                        onClick={handleNavLinkClick}
                      />
                      {isAdmin && (
                        <MobileNavLink
                          to="/admin"
                          icon={<LayoutDashboard size={18} />}
                          text="Admin Dashboard"
                          onClick={handleNavLinkClick}
                        />
                      )}
                    </>
                  )}
                  <MobileNavLink
                    to="/about"
                    icon={<Info size={18} />}
                    text="About"
                    onClick={handleNavLinkClick}
                  />
                </nav>
              </div>

              {/* Fixed Auth Section at Bottom */}
              <div className="p-4 border-t border-gray-200 dark:border-charcoal bg-gray-50/80 dark:bg-onyx backdrop-blur-sm">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/90 dark:bg-onyx/80 backdrop-blur-sm rounded-lg shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user?.username || "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">
                          {user?.roles || "Member"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-charcoal/20 rounded-lg transition-colors duration-200"
                        onClick={handleNavLinkClick}
                      >
                        <User size={16} />
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-white/90 dark:hover:bg-gray-800/90 rounded-lg transition-colors duration-200"
                        onClick={handleNavLinkClick}
                      >
                        <Settings size={16} />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full p-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/90 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block w-full p-3 text-center border border-gray-300 dark:border-charcoal rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-white/90 dark:hover:bg-gray-800/90 transition-colors duration-200"
                      onClick={handleNavLinkClick}
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="block w-full p-3 text-center bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-300"
                      onClick={handleNavLinkClick}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar; 