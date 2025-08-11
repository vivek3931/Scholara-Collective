import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ContributorsPage = () => {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [userContributionCount, setUserContributionCount] = useState(null);
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchContributors = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/analytics/contributors`);
        setContributors(response.data);
      } catch (err) {
        console.error('Failed to fetch contributors:', err);
        setError('Failed to load contributors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${API_URL}/user/me`, {
          withCredentials: true,
        });
        const fetchedContributionCount = response.data.contributionCount || 0;
        setUserContributionCount(fetchedContributionCount);
        // ⭐ DEBUGGING: Log the fetched user contribution count
        console.log('User contribution count:', fetchedContributionCount);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUserContributionCount(0);
        // ⭐ DEBUGGING: Log when user data fetch fails
        console.log('User data fetch failed, assuming 0 contributions.');
      }
    };

    fetchContributors();
    fetchUserData();
  }, [API_URL]);

  const filteredContributors = useMemo(() => {
    let result = [...contributors];

    if (searchTerm) {
      result = result.filter(contributor =>
        contributor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contributor.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return result.sort((a, b) => {
      if (sortOption === 'name-asc') {
        return (a.name || 'Anonymous').localeCompare(b.name || 'Anonymous');
      } else if (sortOption === 'name-desc') {
        return (b.name || 'Anonymous').localeCompare(a.name || 'Anonymous');
      } else if (sortOption === 'contributions-desc') {
        return b.contributionCount - a.contributionCount;
      } else if (sortOption === 'contributions-asc') {
        return a.contributionCount - b.contributionCount;
      }
      return 0;
    });
  }, [contributors, searchTerm, sortOption]);

  const handleUploadRedirect = () => {
    navigate('/upload');
  };

  const containerVariants = {
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx text-gray-800 dark:text-gray-200 transition-colors duration-300">
        <div
          className="w-12 h-12 border-4 border-t-orange-500 border-silver/30 dark:border-charcoal/60 rounded-full animate-spin"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx text-red-500">
        <p className="text-lg font-medium">{error}</p>
      </div>
    );
  }

  // Determine button text based on userContributionCount
  // The button only appears if userContributionCount is not null (meaning fetchUserData has completed)
  const contributionButtonText = userContributionCount > 0 ? "Contribute More!" : "Become a Contributor!";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-onyx py-12 px-4 sm:px-6 lg:px-8 font-inter custom-scrollbar transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <h1
          className="text-4xl lg:text-5xl font-bold mb-4 text-center bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent"
        >
          Our Valued Contributors
        </h1>
        <p className="text-lg text-graphite dark:text-platinum max-w-2xl mx-auto text-center mb-10">
          Meet the individuals who power our community with their amazing contributions!
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-orange-400 to-amber-500 mx-auto mb-12 rounded-full"></div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-center">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search contributors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/90 dark:bg-onyx/90 border border-silver/30 dark:border-charcoal/60 text-graphite dark:text-platinum focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              aria-label="Search contributors"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-graphite/80 dark:text-platinum/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/90 dark:bg-onyx/90 border border-silver/30 dark:border-charcoal/60 text-graphite dark:text-platinum focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            aria-label="Sort contributors"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="contributions-desc">Contributions (High to Low)</option>
            <option value="contributions-asc">Contributions (Low to High)</option>
          </select>
        </div>

        {filteredContributors.length === 0 ? (
          <p className="text-center text-graphite/80 dark:text-platinum/80 text-lg">
            No contributors found. Be the first to contribute!
          </p>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8"
          >
            <AnimatePresence>
              {filteredContributors.map((contributor) => (
                <motion.div
                  key={contributor.userId}
                  variants={itemVariants}
                  className="relative overflow-hidden bg-white/90 dark:bg-onyx/70 backdrop-blur-sm rounded-2xl shadow-xl dark:shadow-glow-sm border border-silver/30 dark:border-charcoal/60 p-8 text-center transition-all duration-300 hover:shadow-2xl dark:hover:shadow-glow-lg hover:-translate-y-1"
                >
                  <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-100/30 dark:bg-amber-400/10 blur-xl"></div>
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-orange-100/20 dark:bg-orange-400/10 blur-lg"></div>
                  <div className="relative z-10">
                    <div className="flex justify-center mb-4">
                      {contributor.profilePicture ? (
                        <img
                          src={contributor.profilePicture}
                          alt={contributor.name || 'Contributor'}
                          className="w-24 h-24 rounded-full object-cover border-4 border-amber-500 dark:border-amber-400"
                          onError={(e) => { e.target.src = "https://placehold.co/96x96/E5E7EB/4B5563?text=User"; }}
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-amber-200 dark:bg-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-100 text-4xl font-bold border-4 border-amber-300 dark:border-amber-600 shadow-md">
                          {contributor.name ? contributor.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <h2 className="text-xl font-semibold text-slate dark:text-white mb-2">
                      {contributor.name || 'Anonymous Contributor'}
                    </h2>
                    <p className="text-sm text-graphite/80 dark:text-platinum/80 mb-4">
                      {contributor.email}
                    </p>
                    <div className="flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-300 shadow-inner dark:shadow-charcoal/50 border border-orange-100/50 dark:border-amber-900/30">
                      <span className="mr-2">🏆</span>
                      {contributor.contributionCount} Contributions
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Contribution button displayed based on userContributionCount */}
        {userContributionCount !== null && (
          <div className="text-center mt-16">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleUploadRedirect}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold rounded-xl shadow-orange-md hover:shadow-orange-lg transition-all duration-300 relative overflow-hidden group"
              aria-label={contributionButtonText}
            >
              <span className="relative z-10">{contributionButtonText}</span>
              <span className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContributorsPage;
