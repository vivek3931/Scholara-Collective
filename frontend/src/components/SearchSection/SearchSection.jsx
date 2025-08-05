import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, BookOpen, FileText, FileQuestion, FileCheck2, GraduationCap, ChevronDown, RefreshCcw, X, Clock, Calculator, Atom, Bookmark, FlaskConical, } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useDebounce } from 'use-debounce';

const Dropdown = ({ label, icon: Icon, options, selectedValue, onSelect, className, loading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(option => option.value === selectedValue) || { label: 'All', icon: BookOpen };

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
      <button
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
        <ChevronDown className={`text-amber-600 dark:text-amber-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={20} />
      </button>

      {isOpen && (
        <ul className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-onyx/90 rounded-xl shadow-xl border border-gray-200 dark:border-onyx z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option.value}
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors font-poppins
                ${option.value === selectedValue
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200'
                  : 'hover:bg-gray-50 dark:hover:bg-amber-950/40 text-gray-700 dark:text-gray-200'
                }`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && <option.icon size={16} className="min-w-4 text-amber-600 dark:text-amber-200" />}
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const SearchSection = ({ searchQuery, setSearchQuery, filterType, setFilterType, filterCourse, setFilterCourse, resetFilters, showModal }) => {
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [filterSubject, setFilterSubject] = useState(''); // Initialize with a default value
  const [isFiltering, setIsFiltering] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    setRecentSearches(savedSearches);
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedSearchQuery.length > 2) {
      // Simulate API call - replace with actual fetch
      const mockSuggestions = [
        { _id: '1', title: `${debouncedSearchQuery} notes` },
        { _id: '2', title: `${debouncedSearchQuery} textbook` },
        { _id: '3', title: `${debouncedSearchQuery} exam paper` }
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
        ...recentSearches.filter(item => item !== searchQuery.trim()).slice(0, 4)
      ];
      setRecentSearches(updatedSearches);
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    }
    setShowSuggestions(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setSearchQuery('');
      inputRef.current.blur();
    }
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

  const handleReset = () => {
    resetFilters();
    setFilterSubject('All'); // Reset subject filter as well
    showModal({
      type: 'success',
      title: 'Filters Reset',
      message: 'All search filters have been cleared.',
      confirmText: 'OK',
    });
  };

  return (
    <section className="px-4 py-8 w-full bg-gray-50 dark:bg-transparent flex  justify-center">
      <div className="bg-white dark:bg-onyx/60 rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-onyx w-full max-w-[1150px]">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 font-poppins">
          <Search size={24} className="text-amber-600 dark:text-amber-200" />
          <span>Find Academic Resources</span>
        </h2>

        <form className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Search Input with Suggestions */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-amber-600 dark:text-amber-200" size={20} />
            </div>
            <input
              ref={inputRef}
              type="text"
              className="pl-10 pr-10 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx bg-white dark:bg-onyx/90 text-gray-700 dark:text-gray-200 placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-all duration-200 shadow-glow-sm"
              placeholder="Search by title, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="text-gray-400 hover:text-gray-600 dark:hover:text-amber-200" size={20} />
              </button>
            )}

            {/* Suggestions Dropdown */}
            {(showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)) && (
              <div className="absolute z-50 mt-1 w-full bg-white dark:bg-onyx rounded-lg shadow-xl border border-gray-200 dark:border-onyx max-h-60 overflow-auto">
                {suggestions.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                      Suggestions
                    </div>
                    {suggestions.map((item) => (
                      <div
                        key={item._id}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                        onMouseDown={() => {
                          setSearchQuery(item.title);
                          inputRef.current.focus();
                        }}
                      >
                        <Search size={16} className="text-amber-600 dark:text-amber-200" />
                        <span>{item.title}</span>
                      </div>
                    ))}
                  </>
                )}

                {recentSearches.length > 0 && (
                  <>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-amber-200 border-b border-gray-100 dark:border-onyx">
                      Recent Searches
                    </div>
                    {recentSearches.map((search, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-amber-950/40 cursor-pointer flex items-center gap-2"
                        onMouseDown={() => {
                          setSearchQuery(search);
                          inputRef.current.focus();
                        }}
                      >
                        <Clock size={16} className="text-amber-600 dark:text-amber-200" />
                        <span>{search}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Filter Dropdowns */}
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

          {/* Additional Filter - Subject */}
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
          {/* Recent Searches Chips */}
          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap max-w-full overflow-x-auto pb-2">
              <span className="text-sm text-gray-500 dark:text-amber-200 min-w-max">Recent:</span>
              <div className="flex gap-2"> {/* Added a wrapper div for consistent gap */}
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchQuery(search)}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-amber-950/40 hover:bg-gray-200 dark:hover:bg-amber-950/60 rounded-full flex items-center gap-1 whitespace-nowrap"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-amber-950/40 transition-colors duration-200 sm:ml-auto w-full sm:w-auto justify-center"
          >
            <RefreshCcw size={16} className="text-amber-600 dark:text-amber-200" />
            Reset Filters
          </button>
        </div>
      </div>
    </section>
  );
};

export default SearchSection;