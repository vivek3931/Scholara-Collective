import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UploadCloud,
  Coins,
  Share2,
  Award,
  Copy,
  CheckCircle,
  Sparkles,
  Users,
  TrendingUp,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useModal } from "../../context/ModalContext/ModalContext";
import { useAuth } from "../../context/AuthContext/AuthContext";
import coin from "../../assets/coin.svg";
import axios from "axios";

// Enhanced animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.5,
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const floatingVariants = {
  float: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

function ReferralPage() {
  const { user, token } = useAuth();
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);
  // UPDATED: Added new state variables for referral coins and total referrals
  const [publicStats, setPublicStats] = useState({
    resources: 0,
    students: 0,
    courses: 0,
    universities: 0,
    referralCoins: 0, // NEW: Total coins earned across the platform
    totalReferrals: 0, // NEW: Total referrals across the platform
  });
  const referralLink = `https://scholara.co/register?ref=${user?._id}`;
  const { showModal, hideModal } = useModal();
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    if (user && token) {
      const fetchReferralCount = async () => {
        try {
          const response = await axios.get(`${API_URL}/users/referrals`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setReferralCount(response.data.referralCount);
        } catch (err) {
          console.error("Failed to fetch referral count:", err);
          showModal({
            type: "error",
            title: "Error",
            message: "Could not fetch referral data. Please try again.",
          });
        }
      };

      const fetchPublicStats = async () => {
        try {
          const response = await axios.get(`${API_URL}/analytics/public-stats`);
          // UPDATED: Destructuring new data from the API response
          setPublicStats(response.data);
        } catch (err) {
          console.error("Failed to fetch public stats:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchReferralCount();
      fetchPublicStats();
    }
  }, [user, token, showModal, API_URL]);

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        showModal({
          type: "success",
          title: "Link Copied!",
          message: "Your referral link has been copied to your clipboard.",
          confirmText: "OK",
          onConfirm: hideModal,
          showCloseButton: true,
          isDismissible: true,
        });
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        showModal({
          type: "error",
          title: "Copy Failed",
          message:
            "Could not copy the link automatically. Please copy it manually.",
          confirmText: "OK",
          onConfirm: hideModal,
          showCloseButton: true,
          isDismissible: true,
        });
      });
  };

  return (
    <>
      <Helmet>
        <title>Refer & Earn - Scholara Collective</title>
        <meta
          name="description"
          content="Refer friends and earn Scholara Coins! Get 100 credits (100 coins) for every resource you upload. Share your knowledge, get rewarded."
        />
        <meta
          property="og:title"
          content="Refer & Earn with Scholara Collective"
        />
        <meta
          property="og:description"
          content="Upload resources, earn credits, and empower fellow students. Get 100 Scholara Coins for every contribution!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:image" content={coin} />
      </Helmet>

      <motion.div
        className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx font-poppins overflow-hidden relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl w-full ">
            {/* Hero Section */}
            <motion.div
              className="text-center mb-12"
              variants={sectionVariants}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black mb-6 leading-tight font-poppins">
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Empower & Earn
                </span>
                <br />
                <span className="text-gray-900 dark:text-white">
                  with Scholara
                </span>
              </h1>
              <p className="lg:text-lg  text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Share your knowledge, help fellow students succeed, and get
                rewarded with Scholara Coins. Building the future of
                collaborative learning, one resource at a time.
              </p>
            </motion.div>

            {/* Stats Section - NOW DYNAMIC */}
            <motion.div
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"
              variants={sectionVariants}
            >
              {/* Students Card - NOW DYNAMIC */}
              <motion.div
                className="text-center p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50"
                variants={cardVariants}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                  <Users className="text-white" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-poppins">
                  {loading ? "..." : `${publicStats.students}+`}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Active Students
                </p>
              </motion.div>

              {/* Resources Card - NOW DYNAMIC */}
              <motion.div
                className="text-center p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50"
                variants={cardVariants}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                  <UploadCloud className="text-white" size={32} />
                </div>
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-poppins">
                  {loading ? "..." : `${publicStats.resources}+`}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Resources Shared
                </p>
              </motion.div>

              {/* New Referral Count Card */}
              <motion.div
                className="text-center p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50"
                variants={cardVariants}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                  <Share2 className="text-white" size={32} />
                </div>
                {/* UPDATED: Changed the displayed count to the user's personal referrals */}
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-poppins">
                  {loading ? (
                    <div className="animate-pulse">...</div>
                  ) : (
                    referralCount
                  )}
                </h3>
                {/* UPDATED: Changed the label to clarify it's a personal stat */}
                <p className="text-gray-600 dark:text-gray-300">
                  Your Referrals
                </p>
              </motion.div>
              
              {/* NEW: Card to display total referrals on the platform */}
              <motion.div
                className="text-center p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50"
                variants={cardVariants}
              >
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow-sm">
                  <Coins className="text-white" size={32} />
                </div>
                {/* UPDATED: Used the new data from the API */}
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-2 font-poppins">
                  {loading ? "..." : `${publicStats.referralCoins}+`}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">Coins Earned</p>
              </motion.div>
            </motion.div>

            {/* Main Content Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Upload Incentive Card */}
              <motion.div
                className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 hover:shadow-glow-sm transition-all duration-300"
                variants={cardVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
                    <UploadCloud className="text-white" size={32} />
                  </div>
                  <motion.div
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-700/50"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <Coins
                      className="text-amber-600 dark:text-amber-400"
                      size={20}
                    />
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-poppins">
                      100 Coins
                    </span>
                  </motion.div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-poppins">
                  Upload & Earn
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                  Every validated resource you share earns you{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    100 Scholara Coins
                  </span>
                  . Help students learn while building your coin balance!
                </p>

                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Instant validation</span>
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Quality assured</span>
                </div>
              </motion.div>

              {/* Referral Incentive Card */}
              <motion.div
                className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 hover:shadow-glow-sm transition-all duration-300"
                variants={cardVariants}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
                    <Share2 className="text-white" size={32} />
                  </div>
                  <motion.div
                    className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 px-4 py-2 rounded-full border border-amber-200 dark:border-amber-700/50"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 1,
                    }}
                  >
                    <Award
                      className="text-amber-600 dark:text-amber-400"
                      size={20}
                    />
                    <span className="font-bold text-amber-700 dark:text-amber-300 font-poppins">
                      50 Coins
                    </span>
                  </motion.div>
                </div>

                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 font-poppins">
                  Refer & Earn
                </h3>

                <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed mb-6">
                  Invite friends to join Scholara Collective and earn{" "}
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    50 Scholara Coins
                  </span>
                  when they make their first upload!
                </p>

                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Unlimited referrals</span>
                  <CheckCircle size={16} className="text-green-500" />
                  <span>Instant rewards</span>
                </div>
              </motion.div>
            </div>

            {/* Referral Link Section */}
            <motion.div
              className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg p-8 rounded-2xl shadow-lg border border-gray-200/50 dark:border-charcoal/50 mb-12"
              variants={sectionVariants}
            >
              <div className="text-center mb-8">
                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 font-poppins">
                  Your Personal Referral Link
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Share this unique link with friends and start earning together
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
                <div className="relative flex-1">
                  <input
                    type="text"
                    readOnly
                    value={referralLink}
                    className="w-full p-4 pr-12 rounded-xl border border-gray-300 dark:border-charcoal bg-white/95 dark:bg-onyx/95 text-gray-700 dark:text-gray-300 font-mono text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 hover:shadow-glow-sm"
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Share2 className="text-gray-400" size={20} />
                  </div>
                </div>

                <motion.button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-semibold hover:from-amber-600 hover:to-orange-500 transition-all duration-300 shadow-glow-sm hover:shadow-glow-sm transform hover:scale-105 active:scale-95 font-poppins"
                  whileTap={{ scale: 0.95 }}
                >
                  <Copy size={20} className="mr-2" />
                  Copy Link
                </motion.button>
              </div>
            </motion.div>

            {/* CTA Section */}
            <motion.div className="text-center" variants={sectionVariants}>
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 font-poppins">
                Ready to Start Earning?
              </h3>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of students who are already earning while sharing
                knowledge. Your first upload is just a click away!
              </p>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/upload"
                  className="inline-flex items-center justify-center px-8 py-3 lg:px-12 lg:py-5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-2xl shadow-glow-sm hover:shadow-glow-sm transition-all duration-300 font-bold lg:text-lg text-sm group font-poppins"
                >
                  <UploadCloud
                    size={28}
                    className="mr-3  group-hover:animate-bounce"
                  />
                  Upload Your First Resource
                  <Sparkles
                    size={20}
                    className="ml-3 group-hover:animate-pulse"
                  />
                </Link>
              </motion.div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
                Start earning immediately • No hidden fees • 100% secure
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default ReferralPage;