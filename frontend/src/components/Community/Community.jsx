import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext/AuthContext';
import { useTheme } from '../../context/ThemeProvider/ThemeProvider';
import { useModal } from '../../context/ModalContext/ModalContext';
import {
  Users,
  MessageSquare,
  Star,
  Download,
  BookOpen,
  TrendingUp,
  Award,
  Activity,
  Search,
  Filter,
  ExternalLink,
  User,
  Clock,
  ThumbsUp,
  Upload,
  Hash,
  Building,
} from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const CommunityHub = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { showModal } = useModal();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('feed');
  const [communityStats, setCommunityStats] = useState({
    resources: 0,
    students: 0,
    courses: 0,
    universities: 0,
  });
  const [feedData, setFeedData] = useState([]);
  const [trendingResources, setTrendingResources] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Fetch community stats
  const fetchCommunityStats = async () => {
    try {
      const response = await axios.get('/api/resources/analytics/stats');
      setCommunityStats(response.data);
    } catch (error) {
      console.error('Error fetching community stats:', error);
    }
  };

  // Fetch community feed
  const fetchCommunityFeed = async () => {
  if (!user) return;

  try {
    setLoading(true);
    const response = await axios.get('/api/resources/community/feed', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    // Check if the response data is an array before setting the state
    if (Array.isArray(response.data)) {
      setFeedData(response.data);
    } else {
      console.error('API response for community feed is not an array.');
      // Set to an empty array to prevent further errors
      setFeedData([]); 
    }
  } catch (error) {
    console.error('Error fetching community feed:', error);
    // Always set to an empty array on error
    setFeedData([]);
    showModal({
      type: 'error',
      title: 'Feed Error',
      message: 'Failed to load community feed. Please try again.',
    });
  } finally {
    setLoading(false);
  }
};
  // Fetch trending resources
  const fetchTrendingResources = async () => {
    try {
      const response = await axios.get('/api/resources/trending');
      setTrendingResources(response.data);
    } catch (error) {
      console.error('Error fetching trending resources:', error);
    }
  };

  // Fetch top contributors
  const fetchTopContributors = async () => {
    try {
        // Correct endpoint as per the user's request
        const response = await axios.get('/api/resources/analytics/contributors');
        
        // Ensure the response data is an array before setting the state
        if (Array.isArray(response.data)) {
            // Map the response to match the format expected by the frontend
            const formattedContributors = response.data.map(contributor => ({
                _id: contributor.userId,
                username: contributor.name,
                uploads: contributor.contributionCount,
                // Assuming your backend also calculates a rating or you can add a default
                rating: contributor.averageRating || 0,
            }));
            
            setTopContributors(formattedContributors);
        } else {
            console.error('API response for top contributors is not an array.');
            setTopContributors([]);
        }
    } catch (error) {
        console.error('Error fetching top contributors:', error);
        // Fallback to an empty array in case of an error
        setTopContributors([]);
        showModal({
            type: 'error',
            title: 'API Error',
            message: 'Failed to load top contributors. Please try again later.'
        });
    }
};

  useEffect(() => {
    fetchCommunityStats();
    fetchTrendingResources();
    fetchTopContributors();
  }, []); // Empty dependency array: runs only once on component mount

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchCommunityFeed();
    }
  }, [activeTab, user]); // Added dependency array to re-run when activeTab or user changes

  const handleGoBack = () => {
    navigate(-1);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'rating':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'upload':
        return <Upload className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleResourceClick = (resourceId) => {
    navigate(`/resources/${resourceId}`);
  };

  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const renderStatsCard = (icon, label, value, color) => (
    <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6 hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium font-poppins">
            {label}
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1 font-poppins">
      {(value ?? 0).toLocaleString()}
          </p>
        </div>
        <div className={`p-3 rounded-xl ${color} shadow-glow-sm`}>{icon}</div>
      </div>
    </div>
  );

  const renderFeedActivity = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent"></div>
        </div>
      ) : feedData.length === 0 ? (
        <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-12 text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
            No Activity Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to contribute to the community!
          </p>
        </div>
      ) : (
        feedData
          .filter(
            (activity) => filterType === 'all' || activity.type === filterType
          )
          .filter(
            (activity) =>
              searchQuery === '' ||
              activity.user?.username
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
              activity.resource?.title
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())
          )
          .map((activity) => (
            <div
              key={activity._id}
              className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6 hover:shadow-glow-sm transition-all duration-300"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl shadow-glow-sm">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <button
                      onClick={() => handleUserClick(activity.user._id)}
                      className="font-semibold text-gray-900 dark:text-white hover:text-amber-500 dark:hover:text-amber-400 transition-colors font-poppins"
                    >
                      {activity.user.username}
                    </button>
                    <span className="text-gray-600 dark:text-gray-400">
                      {activity.action}
                    </span>
                    {activity.type === 'rating' && (
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {activity.rating}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleResourceClick(activity.resource._id)}
                    className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-medium transition-colors"
                  >
                    {activity.resource.title}
                  </button>
                  {activity.content && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-2 italic bg-gray-50 dark:bg-onyx/50 p-3 rounded-xl">
                      "{activity.content}"
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimeAgo(activity.createdAt)}</span>
                    </span>
                    <button className="flex items-center space-x-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      <ThumbsUp className="h-3 w-3" />
                      <span>Like</span>
                    </button>
                    <button className="flex items-center space-x-1 hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                      <MessageSquare className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
      )}
    </div>
  );

  const renderTrendingResources = () => (
    <div className="space-y-4">
      {trendingResources.map((resource, index) => (
        <div
          key={resource._id}
          className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6 hover:shadow-glow-sm transition-all duration-300"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center shadow-glow-sm">
                  <span className="text-white font-bold text-sm font-poppins">
                    {index + 1}
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <button
                  onClick={() => handleResourceClick(resource._id)}
                  className="font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer transition-colors font-poppins text-left"
                >
                  {resource.title}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {resource.subject}
                </p>
                <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{resource.uploadedBy.username}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Download className="h-3 w-3" />
                    <span>{resource.downloads}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    <span>{resource.averageRating}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <button
                onClick={() => handleResourceClick(resource._id)}
                className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTopContributors = () => (
    <div className="space-y-4">
      {topContributors.map((contributor, index) => (
        <div
          key={contributor._id}
          className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6 hover:shadow-glow-sm transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center shadow-glow-sm">
                <span className="text-white font-bold text-lg font-poppins">
                  {contributor.username[0].toUpperCase()}
                </span>
              </div>
              <div>
                <button
                  onClick={() => handleUserClick(contributor._id)}
                  className="font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-poppins"
                >
                  {contributor.username}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {contributor.uploads} uploads
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {contributor.rating}
                </span>
              </div>
              {index < 3 && <Award className="h-5 w-5 text-yellow-500" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back Button */}
      <button
        onClick={handleGoBack}
        className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white/95 dark:bg-onyx/95 backdrop-blur-lg shadow-glow-sm hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-midnight hover:scale-105 transition-all duration-200 rounded-xl border border-gray-200/50 dark:border-charcoal/50"
      >
        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
        <span>Back</span>
      </button>

      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx"></div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-16 flex-1">
        <div className="max-w-7xl mx-auto animate-fade-in">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-poppins font-bold text-gray-900 dark:text-white mb-2">
              Community Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect with fellow students and discover trending resources
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {renderStatsCard(
              <Users className="h-6 w-6 text-white" />,
              'Active Students',
              communityStats.students,
              'bg-gradient-to-br from-blue-500 to-blue-600'
            )}
            {renderStatsCard(
              <BookOpen className="h-6 w-6 text-white" />,
              'Total Resources',
              communityStats.resources,
              'bg-gradient-to-br from-green-500 to-green-600'
            )}
            {renderStatsCard(
              <Hash className="h-6 w-6 text-white" />,
              'Courses',
              communityStats.courses,
              'bg-gradient-to-br from-purple-500 to-purple-600'
            )}
            {renderStatsCard(
              <Building className="h-6 w-6 text-white" />,
              'Universities',
              communityStats.universities,
              'bg-gradient-to-br from-orange-500 to-orange-600'
            )}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Navigation Tabs */}
              <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 mb-6">
                <div className="border-b border-gray-200/50 dark:border-charcoal/50">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { key: 'feed', label: 'Activity Feed', icon: Activity },
                      { key: 'trending', label: 'Trending', icon: TrendingUp },
                      { key: 'contributors', label: 'Top Contributors', icon: Award },
                    ].map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveTab(key)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors font-poppins ${
                          activeTab === key
                            ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </nav>
                </div>

                {/* Search and Filter Bar */}
                {activeTab === 'feed' && user && (
                  <div className="p-6 border-b border-gray-200/50 dark:border-charcoal/50">
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search activities..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-3 w-full border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <select
                          value={filterType}
                          onChange={(e) => setFilterType(e.target.value)}
                          className="pl-10 pr-8 py-3 border border-gray-300 dark:border-charcoal rounded-xl bg-white/95 dark:bg-onyx/95 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent appearance-none transition-all duration-200 hover:shadow-glow-sm"
                        >
                          <option value="all">All Activities</option>
                          <option value="comment">Comments</option>
                          <option value="rating">Ratings</option>
                          <option value="upload">Uploads</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Area */}
              <div>
                {activeTab === 'feed' && (
                  <div>
                    <h2 className="text-2xl font-poppins font-semibold text-gray-900 dark:text-white mb-6">
                      Recent Activity
                    </h2>
                    {!user ? (
                      <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-12 text-center">
                        <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 font-poppins">
                          Login Required
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Please log in to view the community activity feed.
                        </p>
                        <button
                          onClick={() => navigate('/login')}
                          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 font-poppins"
                        >
                          Login to Continue
                        </button>
                      </div>
                    ) : (
                      renderFeedActivity()
                    )}
                  </div>
                )}

                {activeTab === 'trending' && (
                  <div>
                    <h2 className="text-2xl font-poppins font-semibold text-gray-900 dark:text-white mb-6">
                      Trending Resources
                    </h2>
                    {renderTrendingResources()}
                  </div>
                )}

                {activeTab === 'contributors' && (
                  <div>
                    <h2 className="text-2xl font-poppins font-semibold text-gray-900 dark:text-white mb-6">
                      Top Contributors
                    </h2>
                    {renderTopContributors()}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6 sticky top-24">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6 font-poppins text-lg">
                  Community Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Today's Downloads
                    </span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      247
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      New Comments
                    </span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      89
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Resources Uploaded
                    </span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                      12
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50 dark:bg-onyx/50 border border-gray-200 dark:border-charcoal">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">
                      Average Rating
                    </span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      4.7 ⭐
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Contributors */}
              <div className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6 font-poppins text-lg">
                  Recently Active
                </h3>
                <div className="space-y-4">
                  {topContributors.slice(0, 3).map((contributor) => (
                    <div
                      key={contributor._id}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-400 rounded-xl flex items-center justify-center shadow-glow-sm">
                        <span className="text-white text-sm font-bold font-poppins">
                          {contributor.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => handleUserClick(contributor._id)}
                          className="text-sm font-medium text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-poppins"
                        >
                          {contributor.username}
                        </button>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Online now</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Community Guidelines */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-6 border border-amber-200/50 dark:border-amber-700/50 backdrop-blur-lg">
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-4 font-poppins text-lg">
                  Community Guidelines
                </h3>
                <ul className="space-y-3 text-sm text-amber-800 dark:text-amber-200">
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Share high-quality, original content</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Be respectful and helpful to others</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Provide constructive feedback</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>Report inappropriate content</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityHub;