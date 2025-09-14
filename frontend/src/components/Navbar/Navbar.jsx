import React, { useState, useEffect, useRef } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
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
  Search,
  ArrowLeft,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUserFriends } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { useResource } from "../../context/ResourceContext/ResourceContext";
import logo from '../../assets/logo.svg';
import coin from '../../assets/coin.svg';

// Desktop NavLink component
const DesktopNavLink = ({ to, text }) => (
  <NavLink
    to={to}
    className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200 group overflow-hidden"
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
    className="flex items-center gap-3 p-3 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-white dark:hover:bg-gray-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors duration-200"
  >
    <span className="text-gray-500 dark:text-gray-400">{icon}</span>
    <span className="text-sm">{text}</span>
  </Link>
);

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const { isAuthenticated, user, logout } = useAuth();
  const { performSearch, fetchSuggestions, suggestions, clearSearchResults } = useResource();
  const navigate = useNavigate();
  const location = useLocation();
  const profileDropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const mobileProfileDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);
  const mobileProfileButtonRef = useRef(null); // New ref for the mobile profile button

  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

  // Body Scroll Lock Logic
  useEffect(() => {
    const body = document.body;
    if (isMobileMenuOpen) {
      body.style.overflow = "hidden";
    } else {
      body.style.overflow = "";
    }
    return () => {
      body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  // Focus search input when search becomes active
  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (isMobileSearchActive && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [isSearchActive, isMobileSearchActive]);

  // Fetch suggestions when search query changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchSuggestions(searchQuery);
      setSelectedSuggestionIndex(-1);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, fetchSuggestions]);

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e, isMobile = false) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const suggestion = suggestions[selectedSuggestionIndex];
      handleSuggestionClick(suggestion);
    }
  };

  // Mobile Menu Toggle with Animation Control
  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      setIsAnimating(false);
      setTimeout(() => {
        setIsMobileMenuOpen(false);
      }, 300);
    } else {
      setIsMobileMenuOpen(true);
      setIsProfileDropdownOpen(false);
      setTimeout(() => {
        setIsAnimating(true);
      }, 10);
    }
  };

  // Search Toggle Functions
  const toggleSearch = () => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setIsProfileDropdownOpen(false);
    }
    if (isSearchActive) {
      setSearchQuery("");
      setSelectedSuggestionIndex(-1);
      clearSearchResults();
    }
  };

  const toggleMobileSearch = () => {
    setIsMobileSearchActive(!isMobileSearchActive);
    if (!isMobileSearchActive) {
      setIsMobileMenuOpen(false);
      setIsProfileDropdownOpen(false);
    }
    if (isMobileSearchActive) {
      setSearchQuery("");
      setSelectedSuggestionIndex(-1);
      clearSearchResults();
    }
  };

  // Profile Dropdown Toggle
  const toggleProfileDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileDropdownOpen((prev) => !prev);
    // When opening profile dropdown, close other menus
    setIsSearchActive(false);
    setIsMobileSearchActive(false);
    setIsMobileMenuOpen(false);
  };

  // Handle profile dropdown item click
  const handleProfileDropdownClick = (callback) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileDropdownOpen(false);
    if (callback) {
      setTimeout(callback, 50);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    logout();
    navigate("/");
    setIsProfileDropdownOpen(false);
    if (isMobileMenuOpen) toggleMobileMenu();
  };

  // Handle NavLink click (closes mobile menu only)
  const handleNavLinkClick = () => {
    if (isMobileMenuOpen) {
      toggleMobileMenu();
    }
  };

  // Handle Search Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const filters = {
        subject: "",
        year: "",
        tags: "",
        sort: "newest",
      };
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      performSearch(searchQuery.trim(), filters, 1);
      setIsSearchActive(false);
      setIsMobileSearchActive(false);
      setSearchQuery("");
      setSelectedSuggestionIndex(-1);
    }
  };

  // Handle Suggestion Click
  const handleSuggestionClick = (suggestion) => {
    const searchTerm = suggestion.title;
    const filters = {
      subject: "",
      year: "",
      tags: "",
      sort: "newest",
    };

    setSearchQuery(searchTerm);
    setIsSearchActive(false);
    setIsMobileSearchActive(false);
    setSelectedSuggestionIndex(-1);

    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
    performSearch(searchTerm, filters, 1);

    setTimeout(() => setSearchQuery(""), 100);
  };

  // Close handlers for clicking outside dropdowns/menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickOnDesktopProfile = profileDropdownRef.current && profileDropdownRef.current.contains(event.target);
      const isClickOnDesktopButton = profileButtonRef.current && profileButtonRef.current.contains(event.target);
      const isClickOnMobileProfile = mobileProfileDropdownRef.current && mobileProfileDropdownRef.current.contains(event.target);
      const isClickOnMobileButton = mobileProfileButtonRef.current && mobileProfileButtonRef.current.contains(event.target);
      const isClickOnMobileMenu = mobileMenuRef.current && mobileMenuRef.current.contains(event.target);
      const isClickOnMobileMenuButton = event.target.closest('[aria-label="Toggle mobile menu"]');

      if (isProfileDropdownOpen) {
        if (!isClickOnDesktopProfile && !isClickOnDesktopButton && !isClickOnMobileProfile && !isClickOnMobileButton) {
          setIsProfileDropdownOpen(false);
        }
      }

      if (
        isMobileMenuOpen &&
        !isClickOnMobileMenu &&
        !isClickOnMobileMenuButton
      ) {
        toggleMobileMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen, isProfileDropdownOpen]);

  // Handle Escape Key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        if (isMobileMenuOpen) toggleMobileMenu();
        if (isProfileDropdownOpen) setIsProfileDropdownOpen(false);
        if (isSearchActive) {
          setIsSearchActive(false);
          setSearchQuery("");
          setSelectedSuggestionIndex(-1);
          clearSearchResults();
        }
        if (isMobileSearchActive) {
          setIsMobileSearchActive(false);
          setSearchQuery("");
          setSelectedSuggestionIndex(-1);
          clearSearchResults();
        }
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen, isProfileDropdownOpen, isSearchActive, isMobileSearchActive, clearSearchResults]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-onyx/60 backdrop-blur-lg transition-colors duration-300">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 h-18 flex items-center justify-between min-w-0">
        {/* Left Section - Logo */}
        <div className="flex items-center flex-shrink-0 min-w-0">
          {!isSearchActive && !isMobileSearchActive && (
            <Link to="/" className="flex items-center space-x-2 group flex-shrink-0">
              <img src={logo} alt="Scholara Collective Logo" className="h-10 w-auto flex-shrink-0 max-w-[120px] sm:max-w-[200px]" />
            </Link>
          )}
          {(isSearchActive || isMobileSearchActive) && (
            <button
              onClick={isMobileSearchActive ? toggleMobileSearch : toggleSearch}
              className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
              aria-label="Close search"
            >
              <ArrowLeft size={24} />
            </button>
          )}
        </div>

        {/* Center Section - Navigation Links or Search Bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="hidden lg:block">
            {isSearchActive ? (
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e)}
                    placeholder="Search resources..."
                    className="w-full px-4 py-2 pl-10 pr-12 text-gray-900 dark:text-white bg-gray-100 dark:bg-charcoal rounded-full border border-gray-300 dark:border-charcoal focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300 ease-in-out"
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors duration-200"
                  >
                    <Search size={14} />
                  </button>
                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-charcoal rounded-xl shadow-xl border border-gray-200 dark:border-charcoal z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion._id || index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                            index === selectedSuggestionIndex
                              ? "bg-gray-50 dark:bg-gray-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
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
              </form>
            ) : (
              <div className="flex items-center justify-center space-x-6 transition-all duration-300">
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
            )}
          </div>
          <div className="lg:hidden">
            {isMobileSearchActive && (
              <form onSubmit={handleSearchSubmit} className="w-full">
                <div className="relative">
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, true)}
                    placeholder="Search resources..."
                    className="w-full px-4 py-2 pl-10 pr-12 text-gray-900 dark:text-white bg-gray-100 dark:bg-charcoal rounded-full border border-gray-300 dark:border-charcoal focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all duration-300 ease-in-out"
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-full transition-colors duration-200"
                  >
                    <Search size={14} />
                  </button>
                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-charcoal rounded-xl shadow-xl border border-gray-200 dark:border-charcoal z-50 max-h-60 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion._id || index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0 ${
                            index === selectedSuggestionIndex
                              ? "bg-gray-50 dark:bg-gray-700"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
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
              </form>
            )}
          </div>
        </div>

        {(!isSearchActive && !isMobileSearchActive) && (
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0 min-w-0">
            <button
              onClick={toggleSearch}
              className="hidden lg:block p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={toggleProfileDropdown}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-charcoal rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-300 group relative overflow-hidden hover:shadow-glow-sm dark:hover:shadow-glow-sm transform active:scale-95 z-10"
                    aria-label="Profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <span className="hidden xl:block text-gray-700 dark:text-gray-200 font-medium text-sm whitespace-nowrap">
                      {user?.username || "User"}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`text-gray-500 dark:text-gray-400 transition-transform duration-200 flex-shrink-0 ${
                        isProfileDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isProfileDropdownOpen && (
                    <div
                      ref={profileDropdownRef}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal rounded-lg shadow-xl py-2 animate-fade-in ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
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
                      <div className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        <img src={coin} alt="Scholara Coins" className="w-4 h-4 mr-3" />
                        <span className="font-medium">{user?.scholaraCoins || 0} Coins</span>
                      </div>
                      <Link
                        to="/referral"
                        onClick={handleProfileDropdownClick(() => navigate("/referral"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <FontAwesomeIcon
                          icon={faUserFriends}
                          className="mr-3 text-amber-500 dark:text-amber-400"
                          size="sm"
                        />
                        Referrals
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={handleProfileDropdownClick(() => navigate("/admin"))}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <LayoutDashboard size={16} className="mr-3" /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={handleProfileDropdownClick(() => navigate("/profile"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <User size={16} className="mr-3" /> Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={handleProfileDropdownClick(() => navigate("/settings"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <Settings size={16} className="mr-3" /> Settings
                      </Link>
                      <div className="border-t border-gray-100 dark:border-charcoal my-1"></div>
                      <button
                        onClick={handleProfileDropdownClick(handleLogout)}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <LogOut size={16} className="mr-3" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2 xl:space-x-3">
                  <Link
                    to="/login"
                    className="px-3 xl:px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 rounded-lg transition-colors duration-200 whitespace-nowrap"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 xl:px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-glow-sm dark:hover:shadow-glow-sm transform active:scale-95 whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
            {/* START: Added a separate section for small screen logged-in user profile */}
            <div className="lg:hidden flex items-center space-x-2">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    ref={mobileProfileButtonRef}
                    onClick={toggleProfileDropdown}
                    className="flex items-center gap-2 px-2 py-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 transform active:scale-95"
                    aria-label="Profile menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </button>
                  {isProfileDropdownOpen && (
                    <div
                      ref={mobileProfileDropdownRef}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-charcoal rounded-lg shadow-xl py-2 animate-fade-in ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                    >
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
                      <div className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                        <img src={coin} alt="Scholara Coins" className="w-4 h-4 mr-3" />
                        <span className="font-medium">{user?.scholaraCoins || 0} Coins</span>
                      </div>
                      <Link
                        to="/referral"
                        onClick={handleProfileDropdownClick(() => navigate("/referral"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <FontAwesomeIcon
                          icon={faUserFriends}
                          className="mr-3 text-amber-500 dark:text-amber-400"
                          size="sm"
                        />
                        Referrals
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={handleProfileDropdownClick(() => navigate("/admin"))}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          <LayoutDashboard size={16} className="mr-3" /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        onClick={handleProfileDropdownClick(() => navigate("/profile"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <User size={16} className="mr-3" /> Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={handleProfileDropdownClick(() => navigate("/settings"))}
                        className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <Settings size={16} className="mr-3" /> Settings
                      </Link>
                      <div className="border-t border-gray-100 dark:border-charcoal my-1"></div>
                      <button
                        onClick={handleProfileDropdownClick(handleLogout)}
                        className="flex items-center w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      >
                        <LogOut size={16} className="mr-3" /> Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 rounded-lg transition-colors duration-200 whitespace-nowrap"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-glow-sm dark:hover:shadow-glow-sm transform active:scale-95 whitespace-nowrap"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
            {/* END: Added a separate section for small screen logged-in user profile */}
            <div className="lg:hidden flex items-center space-x-2">
              <button
                onClick={toggleMobileSearch}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 transform active:scale-95 flex-shrink-0"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 transform active:scale-95 flex-shrink-0"
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
        )}
      </div>
      {isMobileMenuOpen && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${
              isAnimating ? "opacity-100" : "opacity-0"
            }`}
            style={{ minHeight: "100vh", width: "100vw" }}
            onClick={toggleMobileMenu}
          />
          <div
            ref={mobileMenuRef}
            className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] bg-white/95 dark:bg-onyx/95 shadow-2xl transition-transform duration-300 ease-in-out ${
              isAnimating ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-charcoal bg-gray-50/80 dark:bg-onyx">
              <div className="flex items-center gap-2">
                <img src={logo} alt="Scholara Collective Logo" className="h-8 w-auto flex-shrink-0" />
              </div>
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Close menu"
              >
                <X size={20} className="text-gray-700 dark:text-gray-200" />
              </button>
            </div>
            <div className="flex flex-col h-[calc(100dvh-64px)]">
              <div className="flex-1 p-4 space-y-1 overflow-y-auto bg-white/90 dark:bg-onyx backdrop-blur-sm">
                <nav className="space-y-1">
                  {isAuthenticated && (
                    <div className="space-y-1">
                      <MobileNavLink
                        to="/profile"
                        icon={<User size={18} />}
                        text="Profile"
                        onClick={handleNavLinkClick}
                      />
                      <MobileNavLink
                        to="/settings"
                        icon={<Settings size={18} />}
                        text="Settings"
                        onClick={handleNavLinkClick}
                      />
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
                    </div>
                  )}
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
                  <MobileNavLink
                    to="/about"
                    icon={<Info size={18} />}
                    text="About"
                    onClick={handleNavLinkClick}
                  />
                  {isAuthenticated && (
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-3 rounded-lg text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-gray-800 transition-colors duration-200"
                    >
                      <LogOut size={18} className="text-red-500 dark:text-red-400" />
                      <span className="text-sm">Logout</span>
                    </button>
                  )}
                </nav>
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-charcoal bg-gray-50/80 dark:bg-onyx backdrop-blur-sm">
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/90 dark:bg-onyx/80 backdrop-blur-sm rounded-lg shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
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
                    <div className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200">
                      <img src={coin} alt="Scholara Coins" className="w-4 h-4 mr-3" />
                      <span className="font-medium">{user?.scholaraCoins || 0} Coins</span>
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