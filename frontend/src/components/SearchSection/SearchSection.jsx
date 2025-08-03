import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, BookOpen, FileText, FileQuestion, FileCheck2, GraduationCap, ChevronDown, RefreshCcw } from 'lucide-react';

// Custom Dropdown component
const Dropdown = ({ label, icon: Icon, options, selectedValue, onSelect, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Find the selected option or default to a safe value
  const selectedOption = options.find(option => option.value === selectedValue) || { label: 'All', icon: BookOpen };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownRef]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        className="px-4 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx bg-white hover:bg-gray-50 dark:bg-onyx/90 dark:hover:bg-onyx text-gray-700 dark:text-gray-200 font-poppins focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 cursor-pointer hover:border-amber-400 dark:hover:border-amber-200 flex items-center justify-between shadow-glow-sm"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls="dropdown-options"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="text-amber-600 dark:text-amber-200" size={20} />}
          {selectedOption.label}
        </span>
        <ChevronDown className={`text-amber-600 dark:text-amber-200 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} size={20} />
      </button>
      {isOpen && (
        <ul
          id="dropdown-options"
          role="listbox"
          className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-onyx/90 rounded-xl shadow-xl border border-gray-200 dark:border-onyx z-50 overflow-hidden"
        >
          {options.map((option) => (
            <li
              key={option.value}
              role="option"
              aria-selected={option.value === selectedValue}
              className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-all duration-200 font-poppins text-gray-700 dark:text-gray-200 ${
                option.value === selectedValue
                  ? 'bg-amber-100 dark:bg-amber-950/70 font-semibold text-amber-800 dark:text-amber-200'
                  : 'hover:bg-gray-50 dark:hover:bg-amber-950/40'
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

  const handleReset = () => {
    resetFilters();
    showModal({
      type: 'success',
      title: 'Filters Reset',
      message: 'All search filters have been cleared.',
      confirmText: 'OK',
      onConfirm: null,
      isDismissible: true,
      showCloseButton: false,
    });
  };

  return (
    <section className="px-4 py-8 w-full bg-gray-50 flex justify-center dark:bg-onyx mx-auto md:mt-0 relative z-10 animate-fade-in">
      <div 
        className="bg-white w-full max-w-[1150px] dark:bg-onyx rounded-2xl shadow-lg p-6 md:p-8 border border-gray-200 dark:border-onyx transition-all duration-300 hover:shadow-md hover:shadow-amber-600/20"
      >
        <h2 
          className="text-2xl font-bold mb-6 flex items-center gap-2  font-poppins"
        >
          <Search size={24} className="text-amber-600 dark:text-amber-200" />
          <span>Find Academic Resources</span>
        </h2>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="text-amber-600 dark:text-amber-200" size={20} />
            </div>
            <input
              type="text"
              className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-300 dark:border-onyx bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 font-poppins placeholder-gray-500 dark:placeholder-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 dark:focus:ring-amber-200 dark:focus:border-transparent transition-all duration-200 shadow-glow-sm"
              placeholder="Search by title, subject..."
              aria-label="Search resources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dropdown
            label="Filter by type"
            icon={Filter}
            options={typeOptions}
            selectedValue={filterType}
            onSelect={setFilterType}
          />
          <Dropdown
            label="Filter by course"
            icon={GraduationCap}
            options={courseOptions}
            selectedValue={filterCourse}
            onSelect={setFilterCourse}
          />
        </form>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-onyx rounded-lg shadow-sm text-sm font-medium bg-white hover:bg-gray-50 dark:bg-onyx/90 text-gray-700 dark:text-gray-200 font-poppins hover:bg-gray-100 dark:hover:bg-amber-950/40 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-colors duration-200 shadow-glow-sm"
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