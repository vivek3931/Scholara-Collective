import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, BookOpen, FileText, FileQuestion, FileCheck2, GraduationCap, ChevronDown, RefreshCcw, X, Clock, Calculator, Atom, Bookmark, FlaskConical } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useDebounce } from 'use-debounce';
import { motion } from 'framer-motion';
import { useModal } from '../../context/ModalContext/ModalContext';

const SearchSection = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterCourse,
  setFilterCourse,
  filterSubject,
  setFilterSubject,
  resetFilters,
}) => {
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { showModal } = useModal();

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);
  }, []);

  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      const mockSuggestions = [
        { _id: '1', title: `${debouncedSearchQuery} notes` },
        { _id: '2', title: `${debouncedSearchQuery} textbook` },
        { _id: '3', title: `${debouncedSearchQuery} exam paper` },
      ];
      setSuggestions(mockSuggestions);
    } else {
      setSuggestions([]);
    }
  }, [debouncedSearchQuery]);

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const updatedSearches = [
        searchQuery.trim(),
        ...recentSearches.filter((item) => item !== searchQuery.trim()).slice(0, 4),
      ];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      navigate('/resources', {
        state: { searchQuery, filterType, filterCourse, filterSubject, focusInput: true },
      });
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      setShowSuggestions(false);
      inputRef.current.blur();
    }
  };

  const handleInputClick = (e) => {
    e.preventDefault();
    setShowSuggestions(true);
    navigate('/resources', {
      state: { searchQuery, filterType, filterCourse, filterSubject, focusInput: true },
    });
  };

  const typeOptions = [
    { value: 'All', label: 'All Types', icon: BookOpen },
    { value: 'Notes', label: 'Notes', icon: FileText },
    { value: 'Question Paper', label: 'Question Papers', icon: FileQuestion },
    { value: 'Model Answer', label: 'Model Answers', icon: FileCheck2 },
    { value: 'Revision Sheet', label: 'Revision Sheets', icon: FileText },
  ];

  const courseOptions = [
    { value: 'All', label: 'All Courses', icon: GraduationCap },
    { value: 'B.Sc.', label: 'B.Sc.', icon: GraduationCap },
    { value: 'B.Tech', label: 'B.Tech', icon: GraduationCap },
    { value: 'B.A.', label: 'B.A.', icon: GraduationCap },
    { value: 'M.Sc.', label: 'M.Sc.', icon: GraduationCap },
  ];

  const subjectOptions = [
    { value: 'All', label: 'All Subjects', icon: BookOpen },
    { value: 'Mathematics', label: 'Math', icon: Calculator },
    { value: 'Physics', label: 'Physics', icon: Atom },
    { value: 'Chemistry', label: 'Chemistry', icon: FlaskConical },
    { value: 'English', label: 'English', icon: Bookmark },
  ];

  const handleFilterSelect = (setter) => (value) => {
    setIsFiltering(true);
    setter(value);
    setTimeout(() => setIsFiltering(false), 300);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="px-4 py-8 w-full flex justify-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-charcoal/95 rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-[1150px]"
      >
        <motion.h2 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold mb-6 flex items-center gap-2 font-poppins"
        >
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              transition: { duration: 1.5, repeat: Infinity }
            }}
          >
            <Search size={24} className="text-amber-600 dark:text-amber-200" />
          </motion.div>
          <span>Find Academic Resources</span>
        </motion.h2>

        <form className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-amber-600 dark:text-amber-200" size={20} />
            </div>
            <motion.div
              whileFocus={{
                boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.5)",
                scale: 1.01
              }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              <input
                ref={inputRef}
                type="text"
                className="pl-10 pr-10 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx bg-white dark:bg-onyx/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-all duration-200 shadow-glow-sm"
                placeholder="Search by title, subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={handleInputClick}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
            </motion.div>
            {searchQuery && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="text-gray-400 hover:text-gray-600 dark:hover:text-amber-200" size={20} />
              </motion.button>
            )}

            {(showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)) && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.98 }}
                animate={{ opacity: 1, y: 10, scale: 1 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ 
                  type: "spring",
                  stiffness: 500,
                  damping: 30
                }}
                className="absolute z-50 mt-1 w-full bg-white dark:bg-onyx rounded-lg shadow-xl border border-gray-200 dark:border-onyx max-h-60 overflow-auto"
              >
                {suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                      Suggestions
                    </div>
                    {suggestions.map((item) => (
                      <motion.div
                        key={item._id}
                        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                        onMouseDown={() => {
                          setSearchQuery(item.title);
                          inputRef.current.focus();
                          navigate('/resources', {
                            state: { searchQuery: item.title, filterType, filterCourse, filterSubject, focusInput: true },
                          });
                        }}
                      >
                        <Search size={16} className="text-amber-600 dark:text-amber-200" />
                        <span>{item.title}</span>
                      </motion.div>
                    ))}
                  </>
                )}

                {recentSearches.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ backgroundColor: 'rgba(249, 250, 251, 0.5)' }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                        onMouseDown={() => {
                          setSearchQuery(search);
                          inputRef.current.focus();
                          navigate('/resources', {
                            state: { searchQuery: search, filterType, filterCourse, filterSubject, focusInput: true },
                          });
                        }}
                      >
                        <Clock size={16} className="text-amber-600 dark:text-amber-200" />
                        <span>{search}</span>
                      </motion.div>
                    ))}
                  </>
                )}
              </motion.div>
            )}
          </div>

          <Dropdown
            label="Filter by type"
            icon={Filter}
            options={typeOptions}
            selectedValue={filterType}
            onSelect={handleFilterSelect(setFilterType)}
            loading={isFiltering}
          />

          <Dropdown
            label="Filter by course"
            icon={GraduationCap}
            options={courseOptions}
            selectedValue={filterCourse}
            onSelect={handleFilterSelect(setFilterCourse)}
            loading={isFiltering}
          />

          <Dropdown
            label="Filter by subject"
            icon={Bookmark}
            options={subjectOptions}
            selectedValue={filterSubject}
            onSelect={handleFilterSelect(setFilterSubject)}
            loading={isFiltering}
          />
        </form>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {recentSearches.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto pb-2"
            >
              <span className="text-sm text-gray-500 dark:text-amber-200 min-w-max">Recent:</span>
              <div className="flex gap-2">
                {recentSearches.map((search, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchQuery(search);
                      navigate('/resources', {
                        state: { searchQuery: search, filterType, filterCourse, filterSubject, focusInput: true },
                      });
                    }}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-amber-950/40 hover:bg-gray-200 dark:hover:bg-amber-950/60 rounded-full flex items-center gap-1 whitespace-nowrap"
                  >
                    {search}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-amber-950/40 transition-colors duration-200 sm:ml-auto w-full sm:w-auto justify-center"
          >
            <RefreshCcw size={16} className="text-amber-600 dark:text-amber-200" />
            Reset Filters
          </motion.button>
        </div>
      </motion.div>
    </motion.section>
  );
};

const Dropdown = ({ label, icon: Icon, options, selectedValue, onSelect, className, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find((option) => option.value === selectedValue) || {
    label: 'All',
    icon: BookOpen,
  };

  const toggleDropdown = () => !loading && setIsOpen(!isOpen);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        className={`px-4 py-3 w-full rounded-xl border transition-all duration-200 flex items-center justify-between shadow-glow-sm
          ${loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-amber-400 dark:hover:border-amber-200'}
          border-gray-300 dark:border-onyx bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200`}
        onClick={toggleDropdown}
        disabled={loading}
      >
        <span className="flex items-center gap-2">
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin className="text-amber-600 dark:text-amber-200" />
          ) : (
            Icon && <Icon className="text-amber-600 dark:text-amber-200" size={20} />
          )}
          {selectedOption.label}
        </span>
        <ChevronDown
          className={`text-amber-600 dark:text-amber-200 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          size={20}
        />
      </motion.button>

      {isOpen && (
        <motion.ul
          initial={{ opacity: 0, y: -5, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-onyx/90 rounded-xl shadow-xl border border-gray-200 dark:border-onyx z-50 max-h-60 overflow-auto"
        >
          {options.map((option) => (
            <motion.li
              key={option.value}
              whileHover={{ 
                backgroundColor: option.value === selectedValue 
                  ? 'rgba(253, 230, 138, 0.5)' 
                  : 'rgba(249, 250, 251, 0.5)',
                dark: {
                  backgroundColor: option.value === selectedValue
                    ? 'rgba(120, 53, 15, 0.7)'
                    : 'rgba(68, 64, 60, 0.4)'
                }
              }}
              whileTap={{ scale: 0.98 }}
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors font-poppins
                ${
                  option.value === selectedValue
                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200'
                    : 'hover:bg-gray-50 dark:hover:bg-amber-950/40 text-gray-700 dark:text-gray-200'
                }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && (
                <option.icon size={16} className="min-w-4 text-amber-600 dark:text-amber-200" />
              )}
              {option.label}
            </motion.li>
          ))}
        </motion.ul>
      )}
    </div>
  );
};

export default SearchSection;