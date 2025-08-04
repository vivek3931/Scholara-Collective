import React, { useState } from "react";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./components/Hero/Hero";
import SearchSection from "./components/SearchSection/SearchSection";
import ResourcesSection from "./components/ResourceSection/ResourceSection.jsx";
import StatsSection from "./components/StatsSection/StatsSection";
import Footer from "./components/Footer/Footer";
import CustomWarningModal from "./components/CustomWarningModal/CustomWarningModal";
import ChatbotToggle from "./components/ChatbotToggle/ChatbotToggle";
import { useTheme } from "./ThemeProvider/ThemeProvider.jsx";
import "./index.css";

function App() {
  // Use the new hook to get the theme state and toggle function
  // The 'useTheme' hook is now available because we've imported it above.
  const { isDarkMode, toggleDarkMode } = useTheme();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterCourse, setFilterCourse] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [sortBy, setSortBy] = useState("recent"); // Modal state

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
    confirmText: "OK",
    onConfirm: null,
    cancelText: "Cancel",
    onCancel: null,
    showCloseButton: true,
    isDismissible: true,
  });

  const showModal = ({
    type = "warning",
    title = "Alert",
    message = "Something happened.",
    confirmText = "OK",
    onConfirm = null,
    cancelText = "Cancel",
    onCancel = null,
    showCloseButton = true,
    isDismissible = true,
  }) => {
    setModalState({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      onConfirm: onConfirm
        ? () => {
            onConfirm();
            hideModal();
          }
        : null,
      cancelText,
      onCancel: onCancel
        ? () => {
            onCancel();
            hideModal();
          }
        : null,
      showCloseButton,
      isDismissible,
    });
  };

  const hideModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterType("All");
    setFilterCourse("All");
    setFilterSubject("All");
    setSortBy("recent");
    showModal({
      type: "success",
      title: "Filters Reset",
      message: "All search filters have been cleared.",
      confirmText: "OK",
    });
  };

  return (
    <div
      className={`App min-h-screen bg-platinum/95 custom-scrollbar dark:bg-onyx text-gray-800 dark:text-gray-200 font-poppins transition-colors duration-300`}
    >
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      <Hero />

      <SearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCourse={filterCourse}
        setFilterCourse={setFilterCourse}
        filterSubject={filterSubject}
        setFilterSubject={setFilterSubject}
        resetFilters={resetFilters}
        showModal={showModal}
      />

      <ResourcesSection
        searchQuery={searchQuery}
        filterType={filterType}
        filterCourse={filterCourse}
        filterSubject={filterSubject}
        sortBy={sortBy}
        setSortBy={setSortBy}
        showModal={showModal}
      />

      <StatsSection />
      <Footer />

      <CustomWarningModal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        confirmText={modalState.confirmText}
        onConfirm={modalState.onConfirm}
        cancelText={modalState.cancelText}
        onCancel={modalState.onCancel}
        showCloseButton={modalState.showCloseButton}
        isDismissible={modalState.isDismissible}
      />

      <ChatbotToggle />
    </div>
  );
}

export default App;
