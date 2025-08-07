import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from './components/Navbar/Navbar';
import Hero from './components/Hero/Hero';
import SearchSection from './components/SearchSection/SearchSection';
import ResourcesSection from './components/ResourcesSection/ResourcesSection';
import StatsSection from './components/StatsSection/StatsSection';
import Footer from './components/Footer/Footer';
import { useTheme } from './context/ThemeProvider/ThemeProvider';
import { useModal } from './context/ModalContext/ModalContext';
import './index.css';

// Animation variants for section transitions
const sectionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

function App() {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { showModal } = useModal();

  // Search and filter states with localStorage persistence
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('searchQuery') || '';
  });
  
  const [filterType, setFilterType] = useState(() => {
    return localStorage.getItem('filterType') || 'All';
  });
  
  const [filterCourse, setFilterCourse] = useState(() => {
    return localStorage.getItem('filterCourse') || 'All';
  });
  
  const [filterSubject, setFilterSubject] = useState(() => {
    return localStorage.getItem('filterSubject') || 'All';
  });
  
  const [sortBy, setSortBy] = useState(() => {
    return localStorage.getItem('sortBy') || 'recent';
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('searchQuery', searchQuery);
    localStorage.setItem('filterType', filterType);
    localStorage.setItem('filterCourse', filterCourse);
    localStorage.setItem('filterSubject', filterSubject);
    localStorage.setItem('sortBy', sortBy);
  }, [searchQuery, filterType, filterCourse, filterSubject, sortBy]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('All');
    setFilterCourse('All');
    setFilterSubject('All');
    setSortBy('recent');
    
    showModal({
      type: 'success',
      title: 'Filters Reset',
      message: 'All search filters have been cleared.',
      confirmText: 'OK',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`min-h-screen from-pearl via-ivory to-cream custom-scrollbar bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-800 dark:text-gray-200 font-poppins transition-colors duration-300`}
    >
      <Navbar isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
      
      <motion.div
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="space-y-12 pb-12"
      >
        <Hero />
        
        <motion.section variants={sectionVariants}>
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
        </motion.section>
        
        <motion.section variants={sectionVariants}>
          <ResourcesSection
            searchQuery={searchQuery}
            filterType={filterType}
            filterCourse={filterCourse}
            filterSubject={filterSubject}
            sortBy={sortBy}
            setSortBy={setSortBy}
            showModal={showModal}
            isFullPage={false}
            showSearchControls={false}
          />
        </motion.section>
        
        <motion.section variants={sectionVariants}>
          <StatsSection />
        </motion.section>
      </motion.div>
      
      <Footer />
    </motion.div>
  );
}

export default App;