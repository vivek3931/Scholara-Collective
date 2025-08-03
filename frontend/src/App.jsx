import React, { useState, useEffect } from 'react';
// These are the original component imports from your code.
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import SearchSection from './components/SearchSection/SearchSection';
import ResourcesSection from './components/ResourceSection/ResourceSection';
import StatsSection from './components/StatsSection/StatsSection';
import Footer from './components/Footer/Footer';
import CustomWarningModal from './components/CustomWarningModal/CustomWarningModal';
import './index.css';

// The App component no longer includes mock components.
// It uses your existing imports as you originally intended.
function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCourse, setFilterCourse] = useState('All');
  const [sortBy, setSortBy] = useState('recent');

  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null,
    cancelText: 'Cancel',
    onCancel: null,
    showCloseButton: true,
    isDismissible: true,
  });

  const showModal = ({
    type = 'warning',
    title = 'Alert',
    message = 'Something happened.',
    confirmText = 'OK',
    onConfirm = null,
    cancelText = 'Cancel',
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
      onConfirm: onConfirm ? () => { onConfirm(); hideModal(); } : null,
      cancelText,
      onCancel: onCancel ? () => { onCancel(); hideModal(); } : null,
      showCloseButton,
      isDismissible,
    });
  };

  const hideModal = () => {
    setModalState(prevState => ({ ...prevState, isOpen: false }));
  };

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('All');
    setFilterCourse('All');
    setSortBy('recent');
  };

  return (
    // This is the core fix: The `text-transparent bg-clip-text` classes
    // have been replaced with `text-gray-800 dark:text-gray-200` to ensure
    // all text is readable in both light and dark modes.
    <div className="App min-h-screen bg-platinum/95 dark:bg-onyx/95 text-gray-800 dark:text-gray-200 font-poppins transition-colors duration-300">
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      <Hero />
      <SearchSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterCourse={filterCourse}
        setFilterCourse={setFilterCourse}
        resetFilters={resetFilters}
        showModal={showModal}
      />
      <ResourcesSection
        searchQuery={searchQuery}
        filterType={filterType}
        filterCourse={filterCourse}
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
    </div>
  );
}

export default App;
