import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBookmark, 
  faSearch, 
  faFilter, 
  faSort, 
  faTimes,
  faSpinner,
  faTrash,
  faDownload,
  faEye,
  faFileAlt,
  faStar,
  faExclamationTriangle,
  faHeart,
  faChevronDown,
  faChevronUp,
  faCalendarAlt,
  faGraduationCap,
  faTag
} from '@fortawesome/free-solid-svg-icons';

// Import your existing components and context
import { useAuth } from '../../context/AuthContext/AuthContext';
import ResourceCard from '../ResourceCard/ResourceCard'; // Adjust path as needed

// Modal component for confirmations
const Modal = ({ isOpen, onClose, config }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {config.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {config.message}
        </p>
        <div className="flex justify-end gap-3">
          {config.cancelText && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              {config.cancelText}
            </button>
          )}
          <button
            onClick={() => {
              if (config.onConfirm) config.onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md ${
              config.type === 'error' 
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : config.type === 'warning'
                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {config.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const SavedResourcesPage = () => {
  const { token, user , isAuthenticated} = useAuth();
  const [savedResources, setSavedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('savedDate');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_URL = import.meta.env.APP_API_URL || 'http://localhost:5000/api';
  console.log(user)

  // Fetch saved resources from backend
  const fetchSavedResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(token)
     const requestUrl = `${API_URL}/resources/my-library`;
console.log("Fetching from URL:", requestUrl);
      const response = await fetch(`${API_URL}/resources/my-library`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to fetch saved resources');
      }

      const data = await response.json();
      setSavedResources(data);
    } catch (err) {
      console.error('Error fetching saved resources:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedResources();
    }
  }, [isAuthenticated, fetchSavedResources]);

  // Modal handler
  const showModal = useCallback((config) => {
    setModalConfig(config);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setModalConfig(null);
  }, []);

  // Handle unsaving a resource
  const handleUnsave = useCallback(async (resourceId) => {
    try {
      const response = await fetch(`${API_URL}/resources/${resourceId}/unsave`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || 'Failed to unsave resource');
      }

      // Remove the resource from local state
      setSavedResources(prev => prev.filter(resource => resource._id !== resourceId));
      
      showModal({
        type: 'success',
        title: 'Resource Removed',
        message: 'The resource has been removed from your saved library.',
        confirmText: 'OK',
      });
    } catch (err) {
      console.error('Error unsaving resource:', err);
      showModal({
        type: 'error',
        title: 'Error',
        message: `Failed to remove resource: ${err.message}`,
        confirmText: 'OK',
      });
    }
  }, [isAuthenticated, showModal]);

  // Confirm unsave with modal
  const confirmUnsave = useCallback((resource) => {
    showModal({
      type: 'warning',
      title: 'Remove from Library?',
      message: `Are you sure you want to remove "${resource.title}" from your saved resources?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      onConfirm: () => handleUnsave(resource._id),
    });
  }, [handleUnsave, showModal]);

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const subjectSet = new Set(savedResources.map(resource => resource.subject));
    return Array.from(subjectSet).sort();
  }, [savedResources]);

  // Filter and sort resources
  const filteredAndSortedResources = useMemo(() => {
    let filtered = savedResources.filter(resource => {
      const matchesSearch = !searchTerm || 
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSubject = !selectedSubject || resource.subject === selectedSubject;

      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'pdf' && resource.fileType?.toLowerCase().includes('pdf')) ||
        (filterBy === 'image' && resource.fileType?.toLowerCase().includes('image')) ||
        (filterBy === 'document' && (
          resource.fileType?.toLowerCase().includes('doc') ||
          resource.fileType?.toLowerCase().includes('xls') ||
          resource.fileType?.toLowerCase().includes('ppt')
        ));

      return matchesSearch && matchesSubject && matchesFilter;
    });

    // Sort resources
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'rating':
          return (b.averageRating || 0) - (a.averageRating || 0);
        case 'downloads':
          return (b.downloads || 0) - (a.downloads || 0);
        case 'year':
          return (b.year || 0) - (a.year || 0);
        case 'savedDate':
        default:
          // Sort by creation date if savedAt isn't available
          return new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt);
      }
    });

    return filtered;
  }, [savedResources, searchTerm, selectedSubject, filterBy, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-onyx flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your saved resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <FontAwesomeIcon icon={faExclamationTriangle} size="2x" className="text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Resources
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchSavedResources}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-onyx">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FontAwesomeIcon icon={faBookmark} className="text-blue-500 text-2xl" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Saved Resources
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal library of saved academic resources
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-onyx rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FontAwesomeIcon 
                  icon={faSearch} 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
                />
                <input
                  type="text"
                  placeholder="Search your saved resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
              >
                <option value="savedDate">Recently Saved</option>
                <option value="title">Title A-Z</option>
                <option value="subject">Subject</option>
                <option value="rating">Highest Rated</option>
                <option value="downloads">Most Downloaded</option>
                <option value="year">Newest Year</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-gray-100 dark:bg-onyx text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
                <FontAwesomeIcon icon={showFilters ? faChevronUp : faChevronDown} />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
                  >
                    <option value="">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    File Type
                  </label>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-charcoal rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-onyx dark:text-white"
                  >
                    <option value="all">All Types</option>
                    <option value="pdf">PDF Documents</option>
                    <option value="image">Images</option>
                    <option value="document">Office Documents</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSubject('');
                      setFilterBy('all');
                      setSortBy('savedDate');
                    }}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-onyx rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faBookmark} className="text-blue-500 text-2xl mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {savedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Total Saved</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-onyx rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faGraduationCap} className="text-green-500 text-2xl mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {subjects.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Subjects</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-onyx rounded-lg shadow-sm border border-gray-200 dark:border-charcoal p-6">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faEye} className="text-purple-500 text-2xl mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredAndSortedResources.length}
                </p>
                <p className="text-gray-600 dark:text-gray-400">Showing</p>
              </div>
            </div>
          </div>
        </div>

        {/* Resources Grid */}
        {filteredAndSortedResources.length === 0 ? (
          <div className="text-center py-12">
            <FontAwesomeIcon icon={faBookmark} size="3x" className="text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {savedResources.length === 0 ? 'No Saved Resources Yet' : 'No Resources Found'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {savedResources.length === 0 
                ? 'Start building your library by saving resources you find interesting!'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {savedResources.length === 0 && (
              <button
                onClick={() => window.location.href = '/explore'} // Adjust route as needed
                className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Explore Resources
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedResources.map((resource) => (
              <div key={resource._id} className="relative">
                <ResourceCard
                  resource={resource}
                  onSave={() => {}} // Already saved, no action needed
                  onFlag={() => {}} // Handle flag if needed
                  showModal={showModal}
                />
                
                {/* Unsave button overlay */}
                <button
                  onClick={() => confirmUnsave(resource)}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all duration-200 opacity-90 hover:opacity-100"
                  title="Remove from saved resources"
                >
                  <FontAwesomeIcon icon={faTrash} size="sm" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        config={modalConfig}
      />
    </div>
  );
};

export default SavedResourcesPage;