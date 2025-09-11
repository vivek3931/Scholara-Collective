import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ZoomOut,
  ZoomIn,
  Maximize2,
  Minimize2,
  Eye,
  Download,
  GraduationCap,
  Star,
  AlertCircle,
  BookOpen,
  Send,
  Bookmark,
  Calculator,
  Atom,
  FlaskConical,
  FileText,
  FileQuestion,
  FileCheck2,
  RefreshCw,
  Share2,
  Clock,
  Users,
  TrendingUp,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faStar as faSolidStar,
  faArrowLeft,
  faTimes,
  faDownload,
  faImage,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { debounce, throttle } from "lodash";
import { Document, Page, pdfjs } from "react-pdf";
import coin from "../../assets/coin.svg";
// Set PDF.js worker to a reliable CDN
pdfjs.GlobalWorkerOptions.workerSrc = `../../../workers/pdf.worker.min.js`;
const API_BASE_URL = import.meta.env.VITE_API_URL;
// Utility functions
const getIconForType = (type, size = 20) => {
  const iconMap = {
    "Notes": <FileText size={size} className="text-blue-500 dark:text-blue-300" />,
    "Question Paper": <FileQuestion size={size} className="text-purple-500 dark:text-purple-300" />,
    "Model Answer": <FileCheck2 size={size} className="text-green-500 dark:text-green-300" />,
    "Revision Sheet": <FileText size={size} className="text-teal-500 dark:text-teal-300" />,
    default: <BookOpen size={size} className="text-gray-500 dark:text-gray-300" />
  };
  return iconMap[type] || iconMap.default;
};
const getIconForSubject = (subject, size = 20) => {
  const iconMap = {
    "Mathematics": <Calculator size={size} className="text-red-500 dark:text-red-300" />,
    "Physics": <Atom size={size} className="text-indigo-500 dark:text-indigo-300" />,
    "Chemistry": <FlaskConical size={size} className="text-emerald-500 dark:text-emerald-300" />,
    "English": <Bookmark size={size} className="text-yellow-500 dark:text-yellow-300" />,
    default: <BookOpen size={size} className="text-gray-500 dark:text-gray-300" />
  };
  return iconMap[subject] || iconMap.default;
};
// Loading Spinner
const LoadingSpinner = ({ size = "md", text = "Loading..." }) => {
  const sizeMap = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl"
  };
  return (
    <div className="flex items-center justify-center py-8">
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        className={`text-amber-600 dark:text-amber-200 ${sizeMap[size]} mr-3`}
      />
      <span className="text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
};
// Error Display
const ErrorDisplay = ({ error, onRetry, actionText = "Retry" }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-red-100 dark:bg-red-950 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle size={20} className="mr-2" />
        <span>{error}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="ml-4 px-3 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors flex items-center gap-1"
        >
          <RefreshCw size={14} />
          {actionText}
        </button>
      )}
    </div>
  </motion.div>
);
// StarRating Component
const StarRating = React.memo(
  ({ rating = 0, onRate, editable = true, starSize = 24, showValue = false, isLoading = false, className = "" }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localRating, setLocalRating] = useState(rating);
    const [feedback, setFeedback] = useState("");
    useEffect(() => {
      setLocalRating(rating);
    }, [rating]);
    const debouncedRate = useCallback(
      debounce(async (starValue) => {
        if (!editable || isLoading || isSubmitting || !onRate) return;
        setLocalRating(starValue);
        setIsSubmitting(true);
        setFeedback("Saving rating...");
        try {
          await onRate(starValue);
          setFeedback("Rating saved!");
          setTimeout(() => setFeedback(""), 2000);
        } catch (error) {
          console.error("Error submitting rating:", error);
          setLocalRating(rating);
          setFeedback("Failed to save rating");
          setTimeout(() => setFeedback(""), 3000);
        } finally {
          setIsSubmitting(false);
        }
      }, 300),
      [editable, isLoading, isSubmitting, onRate, rating]
    );
    const displayRating = hoverRating || localRating;
    return (
     
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              className={`outline-none transition-all duration-200 ${
                editable ? "cursor-pointer hover:scale-110" : "cursor-default"
              }`}
              onClick={() => debouncedRate(star)}
              onMouseEnter={() => editable && setHoverRating(star)}
              onMouseLeave={() => editable && setHoverRating(0)}
              disabled={!editable || isLoading || isSubmitting}
              whileHover={editable ? { scale: 1.1 } : {}}
              whileTap={editable ? { scale: 0.95 } : {}}
            >
              <FontAwesomeIcon
                icon={displayRating >= star ? faSolidStar : faRegularStar}
                className={`transition-colors duration-200 ${
                  displayRating >= star ? "text-yellow-400 dark:text-yellow-300" : "text-gray-300 dark:text-gray-600"
                }`}
                style={{ fontSize: `${starSize}px` }}
              />
            </motion.button>
          ))}
          {showValue && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 font-medium">
              {localRating.toFixed(1)}
            </span>
          )}
        </div>
        <AnimatePresence>
          {feedback && (
            <motion.span
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1"
            >
              {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin size="sm" /> : <FontAwesomeIcon icon={faCheckCircle} />}
              {feedback}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    );
  }
);
// Comment Component
const Comment = React.memo(({ comment, onReply, currentUserId, userName, isSubmittingReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const formattedDate = useMemo(() =>
    comment.timestamp ? new Date(comment.timestamp).toLocaleString() : "N/A",
    [comment.timestamp]
  );
  const handleReplySubmit = useCallback(async () => {
    if (!replyText.trim()) return;
    setIsLoading(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText("");
      setShowReplyInput(false);
      setShowReplies(true);
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
      setIsLoading(false);
    }
  }, [replyText, onReply, comment.id]);
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleReplySubmit();
    }
  }, [handleReplySubmit]);
  return (
    <motion.div
      layout
      className="bg-gray-50 dark:bg-onyx/70 p-4 rounded-lg mb-4 shadow-sm border border-gray-100 dark:border-charcoal"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-amber-600 dark:bg-amber-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {comment.userName ? comment.userName[0].toUpperCase() : "U"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
              {comment.userName || "Anonymous"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock size={12} />
              {formattedDate}
            </p>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
            {comment.text}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentUserId && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              disabled={isLoading}
              className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50 transition-colors"
            >
              {showReplyInput ? "Cancel" : "Reply"}
            </button>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <Users size={14} />
              {showReplies ? "Hide" : "Show"} {comment.replies.length} replies
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showReplyInput && currentUserId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <div className="bg-white dark:bg-charcoal rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <textarea
                className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 resize-none"
                rows="2"
                placeholder={`Replying to ${comment.userName}... (Ctrl+Enter to submit)`}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                maxLength={500}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {replyText.length}/500 characters
                </span>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReplySubmit}
                  disabled={!replyText.trim() || isLoading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-md flex items-center gap-2 text-sm hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? <FontAwesomeIcon icon={faSpinner} spin size="sm" /> : <Send size={16} />}
                  {isLoading ? "Posting..." : "Post Reply"}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-8 mt-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-2"
          >
            {comment.replies.map((reply, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-100 dark:bg-charcoal/80 p-3 rounded-lg shadow-xs"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-300 flex items-center justify-center text-white text-xs font-bold">
                    {reply.userName ? reply.userName[0].toUpperCase() : "U"}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">
                      {reply.userName || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      {reply.timestamp ? new Date(reply.timestamp).toLocaleString() : "N/A"}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap break-words">
                  {reply.text}
                </p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
// ResourceCommentsSection Component
const ResourceCommentsSection = React.memo(({ resourceId, currentUserId, userName }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [errorComments, setErrorComments] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const { token, isAuthenticated } = useAuth();
  const pollIntervalRef = useRef(null);
  const textareaRef = useRef(null);
  const refreshComments = useCallback(async (showLoading = false) => {
    if (!resourceId) return;
    if (showLoading) setIsLoadingComments(true);
    setErrorComments(null);
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/comments`);
      if (!response.ok) throw new Error(`Failed to fetch comments: ${response.status}`);
      const data = await response.json();
      const processedComments = data.map((c) => ({
        id: c._id,
        userId: c.postedBy._id,
        userName: c.postedBy.username,
        text: c.text,
        timestamp: c.createdAt,
        replies: c.replies
          ? c.replies.map((r) => ({
              userId: r.postedBy._id,
              userName: r.postedBy.username,
              text: r.text,
              timestamp: r.createdAt,
            }))
          : [],
      }));
      setComments(processedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setErrorComments("Failed to load comments.");
    } finally {
      if (showLoading) setIsLoadingComments(false);
    }
  }, [resourceId]);
  const sortedComments = useMemo(() => {
    const sorted = [...comments];
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      case 'mostReplies':
        return sorted.sort((a, b) => (b.replies?.length || 0) - (a.replies?.length || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
  }, [comments, sortBy]);
  useEffect(() => {
    console.log('useEffect: Comments polling');
    if (resourceId) {
      refreshComments(true);
      pollIntervalRef.current = setInterval(() => refreshComments(false), 15000);
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [resourceId, refreshComments]);
  const handleCommentSubmit = useCallback(async () => {
    if (!isAuthenticated || !resourceId || !newCommentText.trim()) {
      setErrorComments("You must be logged in and provide comment text.");
      return;
    }
    setIsSubmittingComment(true);
    setErrorComments(null);
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText.trim() }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to post comment: ${response.status}`);
      }
      setNewCommentText("");
      await refreshComments(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (e) {
      console.error("Error adding comment:", e);
      setErrorComments(`Failed to post comment: ${e.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  }, [isAuthenticated, resourceId, newCommentText, token, refreshComments]);
  const handleReplySubmit = useCallback(async (commentId, replyText) => {
    if (!isAuthenticated || !resourceId || !commentId || !replyText.trim()) {
      setErrorComments("You must be logged in and provide reply text.");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/resources/${resourceId}/comments/${commentId}/replies`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: replyText.trim() }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to post reply: ${response.status}`);
      }
      await refreshComments(false);
    } catch (e) {
      console.error("Error adding reply:", e);
      setErrorComments(`Failed to post reply: ${e.message}`);
    }
  }, [isAuthenticated, resourceId, token, refreshComments]);
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleCommentSubmit();
    }
  }, [handleCommentSubmit]);
  if (isLoadingComments) {
    return (
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-charcoal">
        <LoadingSpinner size="lg" text="Loading comments..." />
      </div>
    );
  }
  return (
    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-charcoal">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Send size={24} />
          Comments ({comments.length})
        </h2>
        {comments.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-sm bg-white dark:bg-charcoal border border-gray-300 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="mostReplies">Most replies</option>
            </select>
          </div>
        )}
      </div>
      {errorComments && (
        <ErrorDisplay
          error={errorComments}
          onRetry={() => setErrorComments(null)}
          actionText="Dismiss"
        />
      )}
      {isAuthenticated ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-white dark:bg-charcoal rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-600 dark:bg-amber-400 flex items-center justify-center text-white text-sm font-bold">
              {userName ? userName[0].toUpperCase() : "U"}
            </div>
            Leave a Comment
          </h3>
          <textarea
            ref={textareaRef}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx/80 text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-all duration-200 resize-none"
            rows="4"
            placeholder="Share your thoughts about this resource... (Ctrl+Enter to submit)"
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSubmittingComment}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <TrendingUp size={12} />
              {newCommentText.length}/1000 characters
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCommentSubmit}
              disabled={!newCommentText.trim() || isSubmittingComment}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow-md hover:bg-amber-700 transition-colors duration-300 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? <FontAwesomeIcon icon={faSpinner} spin /> : <Send size={20} />}
              {isSubmittingComment ? "Posting..." : "Post Comment"}
            </motion.button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-gray-50 dark:bg-onyx/50 rounded-lg border border-gray-200 dark:border-charcoal text-center"
        >
          <Users size={48} className="mx-auto mb-3 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">Join the conversation!</p>
          <p className="text-sm text-gray-500 dark:text-gray-500">Please log in to post comments and engage with the community.</p>
        </motion.div>
      )}
      {comments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Send size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-2">No comments yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share your thoughts!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {sortedComments.map((comment, index) => (
              <Comment
                key={comment.id}
                comment={comment}
                onReply={handleReplySubmit}
                currentUserId={currentUserId}
                userName={userName}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});


const ResourceDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const { resource: initialResourceFromState } = location.state || {};

  // Core state
  const [resource, setResource] = useState(initialResourceFromState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  // Preview state
  const [zoom, setZoom] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 500, height: 707 });
  const [previewRetryCount, setPreviewRetryCount] = useState(0);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);

  // Purchase state
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showStats, setShowStats] = useState(false);

  // Refs
  const pollIntervalRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);

  // Computed values
  const userId = user?._id;
  const userName = user?.username || "Anonymous User";
  const isAdmin = user?.roles === "admin";
  const userCoins = user?.scholaraCoins || 0;
  const cost = 30;
  const canDownload = useMemo(() => {
    if (!isAuthenticated) return false;
    if (isAdmin) return true;
    return isPurchased;
  }, [isAuthenticated, isAdmin, isPurchased]);
  const fileUrl = useMemo(() => {
    if (!resource) return null;
    return (
      resource.fileUrl ||
      resource.filePath ||
      resource.file ||
      resource.url ||
      resource.downloadUrl ||
      resource.cloudinaryUrl
    );
  }, [resource]);

  // Handle fullscreen body overflow
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  // Window resize handler
  useEffect(() => {
    const handleResize = throttle(() => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.clientWidth;
        const maxWidth = newIsMobile ? containerWidth - 20 : Math.min(containerWidth - 40, 800);
        const aspectRatio = 1.414; // Standard A4 aspect ratio
        setPdfDimensions({
          width: maxWidth,
          height: maxWidth * aspectRatio,
        });
      }
    }, 100);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      handleResize.cancel();
    };
  }, []);

  // Resource loading
  useEffect(() => {
    if (!resourceId) {
      setError("No resource ID provided");
      setLoading(false);
      return;
    }
    const loadResource = async () => {
      setLoading(true);
      setError(null);
      try {
        let fetchedResource = initialResourceFromState;
        const cacheKey = `resource_${resourceId}`;
        const cachedResource = sessionStorage.getItem(cacheKey);
        if (cachedResource && !fetchedResource) {
          fetchedResource = JSON.parse(cachedResource);
        }
        if (!fetchedResource || fetchedResource._id !== resourceId) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            signal: controller.signal,
            headers: { Authorization: `Bearer ${token}` }, // Add token if required
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          fetchedResource = await response.json();
          fetchedResource = fetchedResource.resource || fetchedResource;
          sessionStorage.setItem(cacheKey, JSON.stringify(fetchedResource));
        }
        setResource(fetchedResource);
      } catch (err) {
        console.error("Error fetching resource:", err);
        setError(`Failed to load resource: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadResource();
  }, [resourceId, initialResourceFromState, token]);

  // Purchase status fetching
  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!isAuthenticated || !token || !user || !resource?._id) {
        setIsPurchased(false);
        return;
      }
      if (isAdmin) {
        setIsPurchased(true);
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(`${API_BASE_URL}/resources/${resource._id}/purchase-status`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (response.ok) {
          const data = await response.json();
          setIsPurchased(data.isPurchased || false);
        } else {
          const purchased = user.purchasedResources?.includes(resource._id) || false;
          setIsPurchased(purchased);
        }
      } catch (error) {
        const purchased = user.purchasedResources?.includes(resource._id) || false;
        setIsPurchased(purchased);
      }
    };
    fetchPurchaseStatus();
  }, [isAuthenticated, token, user?.purchasedResources, resource?._id, user, isAdmin]);

  // Ratings fetching
  const refreshRatings = useCallback(async () => {
    if (!resourceId) return;
    setIsRatingLoading(true);
    try {
      const url = `${API_BASE_URL}/resources/${resourceId}/ratings${userId ? `?userId=${userId}` : ""}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ratings`);
      }
      const data = await response.json();
      setOverallRating(data.overallRating ?? overallRating);
      if (userId) setUserRating(data.userRating ?? userRating);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setIsRatingLoading(false);
    }
  }, [resourceId, userId, overallRating, userRating]);

  useEffect(() => {
    if (resourceId) {
      refreshRatings();
      pollIntervalRef.current = setInterval(refreshRatings, 60000);
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [resourceId, refreshRatings]);

  // Rating handler
  const handleRate = useCallback(async (value) => {
    if (!isAuthenticated || !resourceId) {
      setError("Please login to rate");
      return;
    }
    setUserRating(value);
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Rating failed: ${response.status}`);
      }
      const data = await response.json();
      setUserRating(data.userRating);
      setOverallRating(data.overallRating);
    } catch (e) {
      console.error("Rating error:", e);
      setError(e.message);
      setUserRating(userRating);
      setOverallRating(overallRating);
    }
  }, [isAuthenticated, resourceId, token, userRating, overallRating]);

  // Preview handler
  const handlePreview = useCallback(async () => {
    if (!isAuthenticated) {
      setError("You need to be logged in to preview resources.");
      navigate('/login'); // Redirect to login
      return;
    }
    if (previewDataUrl) return; // Skip if already loaded
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewRetryCount(0); // Reset retry count
    try {
      // Clear stale sessionStorage entry
      sessionStorage.removeItem(`preview_${resourceId}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`Failed to fetch preview: HTTP ${response.status}`);
      }
      const blob = await response.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("Invalid PDF file received");
      }
      const url = URL.createObjectURL(blob);
      setPreviewDataUrl(url);
      sessionStorage.setItem(`preview_${resourceId}`, url);
    } catch (err) {
      console.error("Preview failed:", err);
      let errorMessage = err.name === 'AbortError' ? "Preview request timeout - please try again" : err.message;
      if (err.message.includes("401")) {
        errorMessage = "Authentication failed. Please log in again.";
        navigate('/login');
      }
      setPreviewError(errorMessage);
      if (previewRetryCount < 3) { // Increased retry limit to 3
        setPreviewRetryCount(prev => prev + 1);
        setTimeout(() => handlePreview(), 2000);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [isAuthenticated, resourceId, token, previewDataUrl, previewRetryCount, navigate]);

  // Automatically trigger preview on mount
  useEffect(() => {
    
    return () => {
      if (previewDataUrl) {
        URL.revokeObjectURL(previewDataUrl);
        sessionStorage.removeItem(`preview_${resourceId}`);
        setPreviewDataUrl(null);
      }
    };
  }, [isAuthenticated, resourceId, handlePreview, previewDataUrl]);

  // PDF document handlers
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setPreviewLoading(false);
    setPreviewError(null);
    setCurrentPage(1);
    setPreviewRetryCount(0); // Reset retry count on success
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading PDF document:", error);
    setPreviewError("Failed to load PDF preview. Please try downloading or refreshing.");
    setPreviewLoading(false);
    if (previewRetryCount < 3) { // Increased retry limit to 3
      setPreviewRetryCount(prev => prev + 1);
      setTimeout(() => {
        sessionStorage.removeItem(`preview_${resourceId}`);
        handlePreview();
      }, 2000);
    }
  }, [previewRetryCount, resourceId, handlePreview]);

  // Zoom handlers
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  const handleMobileFullscreen = useCallback(async () => {
    if (!isAuthenticated) {
      setError("You need to be logged in to preview resources.");
      navigate('/login');
      return;
    }
    if (!previewDataUrl && !previewLoading) {
      await handlePreview();
    }
    setIsFullscreen(true);
  }, [isAuthenticated, previewDataUrl, previewLoading, handlePreview, navigate]);

  // Download validation and handler
  const validateDownload = useCallback(() => {
    if (!isAuthenticated) {
      alert("You need to be logged in to download resources.");
      return false;
    }
    if (!canDownload) {
      alert(`This resource requires purchase (${cost} coins). You currently have ${userCoins} coins.`);
      return false;
    }
    return true;
  }, [isAuthenticated, canDownload, cost, userCoins]);

  const handleDownload = useCallback(async () => {
    if (!validateDownload()) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "*/*" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.msg || "Download failed due to server error.");
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${resource.title.replace(/[^a-z0-9._-]/gi, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      await fetch(`${API_BASE_URL}/resources/${resourceId}/increment-download`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Download failed:", err);
      const errorMessage = err.name === 'AbortError' ? "Download timeout - please try again" : `Download failed: ${err.message}`;
      setError(errorMessage);
      alert(errorMessage);
    }
  }, [resourceId, token, resource?.title, validateDownload]);

  // Purchase handler
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setError("You need to be logged in to purchase resources.");
      navigate('/login');
      return;
    }
    if (userCoins < cost) {
      alert(
        `You need ${cost} ScholaraCoins to purchase this resource. You currently have ${userCoins} coins. Earn more coins by uploading resources or referring friends!`
      );
      return;
    }
    setPurchasing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/purchase`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ cost }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsPurchased(true);
        if (updateUser && data.user) {
          updateUser(data.user);
        } else if (updateUser) {
          updateUser({
            ...user,
            scholaraCoins: data.scholaraCoins,
            purchasedResources: data.purchasedResources || [...(user.purchasedResources || []), resourceId],
          });
        }
        alert("Resource unlocked successfully! You can now download it.");
      } else {
        throw new Error(data.message || "Purchase failed.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      setIsPurchased(false);
      setError("Purchase failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // Fullscreen scroll handler
  const showAndScheduleHide = useCallback(() => {
    setShowFullscreenControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    hideControlsTimeoutRef.current = setTimeout(() => {
      setShowFullscreenControls(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (!pdfContainerRef.current) {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      return;
    }
    const handleScroll = throttle(showAndScheduleHide, 200);
    const handleTouchMove = showAndScheduleHide;
    const container = pdfContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    container.addEventListener('touchmove', handleTouchMove);
    if (isFullscreen) {
      showAndScheduleHide();
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('touchmove', handleTouchMove);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      handleScroll.cancel();
    };
  }, [isFullscreen, showAndScheduleHide]);

  // Render PDF pages
  const renderPdfPages = useMemo(() => {
    if (!numPages) return null;
    const pagesToRender = [];
    for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
      pagesToRender.push(
        <div
          key={pageNumber}
          className="mb-4 flex justify-center"
          style={{
            minHeight: pdfDimensions.height * zoom,
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            className="bg-gray-100 dark:bg-charcoal rounded-lg shadow-lg"
            style={{
              width: pdfDimensions.width * zoom,
              height: pdfDimensions.height * zoom,
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={pdfDimensions.width}
              scale={zoom}
              className="rounded-lg"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              onRenderSuccess={() => console.log(`Page ${pageNumber} rendered successfully`)}
              onRenderError={(error) => console.error(`Page ${pageNumber} render error:`, error)}
              loading={
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-xl mb-2" />
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Loading page {pageNumber}...</span>
                  </div>
                </div>
              }
            />
          </div>
        </div>
      );
    }
    return pagesToRender;
  }, [numPages, zoom, pdfDimensions]);

  // Page Indicator Component
  const PageIndicator = ({ className = "" }) => {
    const pageRef = useRef(1);
    const scrollContainerRef = pdfContainerRef;

    useEffect(() => {
      if (!scrollContainerRef.current || !numPages || numPages <= 1) {
        return;
      }
      const handleScroll = throttle(() => {
        const { scrollTop } = scrollContainerRef.current;
        const pageHeight = pdfDimensions.height * zoom + 16;
        const newPage = Math.min(Math.ceil(scrollTop / pageHeight) + 1, numPages);
        if (newPage !== pageRef.current) {
          pageRef.current = newPage;
          setCurrentPage(newPage);
        }
        showAndScheduleHide();
      }, 200);
      scrollContainerRef.current.addEventListener('scroll', handleScroll);
      scrollContainerRef.current.addEventListener('touchmove', showAndScheduleHide);
      return () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener('scroll', handleScroll);
          scrollContainerRef.current.removeEventListener('touchmove', showAndScheduleHide);
        }
        handleScroll.cancel();
      };
    }, [numPages, pdfDimensions, showAndScheduleHide]);

    return (
      <AnimatePresence>
        {showFullscreenControls && numPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className={`absolute top-12 right-4 z-50 flex items-center gap-3 px-4 py-2 bg-black/70 text-white rounded-lg backdrop-blur-sm ${className}`}
          >
            <span className="text-sm font-medium">
              Page {currentPage} of {numPages}
            </span>
            {numPages > 5 && (
              <div className="flex items-center gap-1">
                <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${(currentPage / numPages) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Stats Card Component
  const StatsCard = React.memo(({ icon, label, value, trend }) => (
    <div className="flex items-center gap-3 bg-white dark:bg-charcoal p-4 rounded-xl shadow-inner">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <span className="text-xs font-semibold text-green-500 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  ));

  const formatCount = useCallback((count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'k';
    }
    return count;
  }, []);

  const downloadStats = useMemo(() => {
    return resource?.downloads ? formatCount(resource.downloads) : 'N/A';
  }, [resource?.downloads, formatCount]);

  const viewStats = useMemo(() => {
    return resource?.viewCount ? formatCount(resource.viewCount) : 'N/A';
  }, [resource?.viewCount, formatCount]);

  const stats = useMemo(() => [
    {
      icon: <Eye className="text-blue-500" />,
      label: "Views",
      value: viewStats,
      trend: resource?.viewTrend,
    },
    {
      icon: <Download className="text-green-500" />,
      label: "Downloads",
      value: downloadStats,
      trend: resource?.downloadTrend,
    },
    {
      icon: <Star className="text-yellow-500" />,
      label: "Rating",
      value: overallRating > 0 ? overallRating.toFixed(1) : "N/A",
    },
  ], [viewStats, downloadStats, overallRating, resource?.viewTrend, resource?.downloadTrend]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-onyx">
        <LoadingSpinner size="lg" text="Fetching resource details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-onyx p-4">
        <ErrorDisplay error={error} onRetry={() => navigate(0)} actionText="Reload Page" />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-onyx p-4">
        <ErrorDisplay error="Resource not found." />
      </div>
    );
  }

  // Render functions
  const renderPreview = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm overflow-hidden p-4 lg:p-8 relative"
    >
      <div
        className="mt-8 bg-gray-200 dark:bg-charcoal rounded-xl shadow-lg relative"
        style={{
          backgroundImage: !previewDataUrl ? `url(${resource.thumbnailUrl || ''})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          width: '100%',
          maxWidth: isFullscreen ? '100vw' : '100%',
          height: isFullscreen ? '100vh' : 'calc(100vh - 200px)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {previewLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <LoadingSpinner text="Preparing preview..." size="lg" />
          </div>
        ) : previewError ? (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <ErrorDisplay
              error={previewError}
              onRetry={handlePreview}
              actionText="Try Again"
            />
          </div>
        ) : (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full flex flex-col items-center custom-scrollbar"
            ref={pdfContainerRef}
            style={{
              maxWidth: isFullscreen ? '100%' : pdfDimensions.width * zoom + 40,
              margin: '0 auto',
              padding: '20px 0',
            }}
          >
            {previewDataUrl ? (
              <Document
                file={previewDataUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                className="w-full"
                loading={
                  <div className="w-full h-full flex items-center justify-center">
                    <LoadingSpinner text="Loading PDF..." />
                  </div>
                }
              >
                {renderPdfPages}
              </Document>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePreview}
                  className="flex items-center gap-3 px-6 py-4 bg-amber-600 text-white font-semibold rounded-lg shadow-lg hover:bg-amber-700 transition-colors z-10"
                >
                  <Eye size={24} />
                  Preview Resource
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </div>
      {previewDataUrl && numPages && !isFullscreen && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
          <div className="p-2 flex items-center gap-2 bg-black/70 rounded-lg text-white backdrop-blur-sm shadow-xl">
            <motion.button
              onClick={() => {
                handleZoomOut();
                if (isMobile && isFullscreen) showAndScheduleHide();
              }}
              disabled={zoom <= 0.5}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <ZoomOut size={20} />
            </motion.button>
            <motion.button
              onClick={() => {
                handleZoomIn();
                if (isMobile && isFullscreen) showAndScheduleHide();
              }}
              disabled={zoom >= 2}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
            >
              <ZoomIn size={20} />
            </motion.button>
            <motion.button
              onClick={() => {
                toggleFullscreen();
                if (isMobile && isFullscreen) showAndScheduleHide();
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </motion.button>
          </div>
        </div>
      )}
      {previewDataUrl && numPages && !isFullscreen && (
        <PageIndicator />
      )}
    </motion.div>
  );

  const renderTitleAndInfo = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm overflow-hidden p-4 lg:p-8"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-xl">
            {getIconForType(resource.type, 36)}
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-1 leading-tight">
              {resource.title}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              by <span className="font-medium text-gray-700 dark:text-gray-300">{resource?.uploadedBy?.username || "Anonymous"}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderSidebar = () => (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="w-full lg:w-1/3 lg:sticky lg:top-24 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto custom-scrollbar"
    >
      <motion.div
        className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Actions</h2>
        <div className="space-y-4">
          <button
            onClick={handleDownload}
            disabled={!canDownload}
            className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={20} />
            {canDownload ? "Download" : "Purchase to Download"}
          </button>
          {!isPurchased && (
            <button
              onClick={handlePurchase}
              disabled={purchasing || userCoins < cost}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {purchasing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Purchasing...
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <img src={coin} alt="coin" className="w-5 h-5" />
                    <span>{cost}</span>
                  </div>
                  Unlock & Download
                </>
              )}
            </button>
          )}
          <button
            onClick={handleMobileFullscreen}
            className="w-full lg:hidden flex items-center justify-center gap-3 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg shadow-glow-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-300"
          >
            <Maximize2 size={20} />
            View Fullscreen
          </button>
        </div>
      </motion.div>
      <motion.div
        className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mt-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Details</h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-center gap-3">
            <GraduationCap size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Subject:</span>
            <span className="flex items-center gap-2">
              {getIconForSubject(resource.subject, 18)}
              {resource.subject}
            </span>
          </li>
          <li className="flex items-center gap-3">
            <FileText size={20} className="text-gray-500 dark:text-gray-400" />
            <span className="font-medium">Type:</span>
            <span>{resource.type}</span>
          </li>
          <li className="flex items-center gap-3">
            <Star size={20} className="text-yellow-500 dark:text-yellow-400" />
            <span className="font-medium">Your Rating:</span>
            <StarRating
              rating={userRating}
              onRate={handleRate}
              isLoading={isRatingLoading}
              editable={isAuthenticated}
              starSize={20}
            />
          </li>
        </ul>
      </motion.div>
      <motion.div
        className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mt-6"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Statistics</h2>
          <motion.button
            whileHover={{ rotate: 180 }}
            onClick={() => setShowStats(!showStats)}
            className="text-gray-500 dark:text-gray-400 p-1"
          >
            <RefreshCw size={18} />
          </motion.button>
        </div>
        <AnimatePresence>
          {showStats && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {!showStats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {stats.slice(0, 2).map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );

  const renderComments = () => (
    <motion.div
      className="max-w-6xl p-4 lg:p-8 mx-auto bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm overflow-hidden mt-4 sm:mt-8"
      animate={{ opacity: isFullscreen ? 0 : 1, y: isFullscreen ? 50 : 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
        opacity: { duration: isFullscreen ? 0.1 : 0.3 },
      }}
    >
      <ResourceCommentsSection
        resourceId={resourceId}
        currentUserId={userId}
        userName={userName}
      />
    </motion.div>
  );

  const renderFullscreen = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] bg-onyx/95 flex flex-col items-center justify-center p-4"
    >
      <AnimatePresence>
        {showFullscreenControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 z-10 flex lg:justify-end justify-between w-[90%] items-center gap-4"
          >
            <motion.div
              className="flex items-center gap-3 px-4 py-2 bg-black/70 text-white shadow-glow-sm rounded-lg backdrop-blur-sm"
            >
              <span className="text-sm font-medium">
                Page {currentPage} of {numPages}
              </span>
              {numPages > 5 && (
                <div className="lg:flex hidden items-center gap-1">
                  <div className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${(currentPage / numPages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
            <motion.button
              onClick={() => {
                toggleFullscreen();
                if (isMobile) showAndScheduleHide();
              }}
              className="p-3 bg-black/20 text-white rounded-full backdrop-blur-sm"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Minimize2 size={24} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {previewDataUrl && (
        <div
          className="w-full h-full flex flex-col items-center overflow-auto custom-scrollbar"
          ref={pdfContainerRef}
          style={{
            maxWidth: '100%',
            padding: '20px 0',
          }}
        >
          <Document
            file={previewDataUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            className="w-full"
          >
            {renderPdfPages}
          </Document>
        </div>
      )}
      <AnimatePresence>
        {showFullscreenControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-4  -translate-x-1/2 flex items-center gap-3 z-10"
          >
            <div className="p-2 flex items-center gap-2 bg-black/70 rounded-lg text-white backdrop-blur-sm shadow-glow-sm">
              <motion.button
                onClick={() => {
                  handleZoomOut();
                  if (isMobile) showAndScheduleHide();
                }}
                disabled={zoom <= 0.5}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <ZoomOut size={20} />
              </motion.button>
              <motion.button
                onClick={() => {
                  resetZoom();
                  if (isMobile) showAndScheduleHide();
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={20} />
              </motion.button>
              <motion.button
                onClick={() => {
                  handleZoomIn();
                  if (isMobile) showAndScheduleHide();
                }}
                disabled={zoom >= 2}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <ZoomIn size={20} />
              </motion.button>
              <motion.button
                onClick={() => {
                  handleDownload();
                  if (isMobile) showAndScheduleHide();
                }}
                disabled={!canDownload}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50"
              >
                <Download size={20} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  return (
    <div
      className={`font-sans antialiased text-gray-900 dark:text-gray-100 min-h-screen bg-gray-50 dark:bg-onyx/80 transition-colors duration-300 ${
        isFullscreen ? "overflow-hidden" : ""
      }`}
    >
      <div className="p-4 lg:p-8 relative">
        <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
          <div className="flex-1 lg:w-2/3">
            {isMobile ? (
              <>
                {renderPreview()}
                {renderTitleAndInfo()}
                {renderSidebar()}
                {renderComments()}
              </>
            ) : (
              <>
                {renderTitleAndInfo()}
                {renderPreview()}
                {renderComments()}
              </>
            )}
          </div>
          {!isMobile && renderSidebar()}
        </div>
      </div>
      <AnimatePresence>
        {isFullscreen && renderFullscreen()}
      </AnimatePresence>
    </div>
  );
};

export default ResourceDetailPage;
