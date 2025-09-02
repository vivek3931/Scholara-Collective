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

// Enhanced utility functions
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

// Enhanced loading states
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

// Enhanced error display
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

// Enhanced StarRating Component with better animations
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

// Enhanced Comment Component with better structure
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

// Enhanced ResourceCommentsSection with better state management
const ResourceCommentsSection = React.memo(({ resourceId, currentUserId, userName }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [errorComments, setErrorComments] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, mostReplies
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
      
      // Focus back to textarea for better UX
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

// Main ResourceDetailPage component with enhanced structure
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

  // Purchase state
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showStats, setShowStats] = useState(false);

  // Refs
  const pollIntervalRef = useRef(null);
  const pdfContainerRef = useRef(null);

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

  // Enhanced window resize handler
  useEffect(() => {
    const handleResize = throttle(() => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
      
      if (pdfContainerRef.current) {
        const containerWidth = pdfContainerRef.current.clientWidth;
        const maxWidth = newIsMobile ? containerWidth - 20 : Math.min(containerWidth - 40, 800);
        setPdfDimensions({
          width: maxWidth,
          height: maxWidth * 1.414, // A4 aspect ratio
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

  // Enhanced intersection observer for page tracking
  useEffect(() => {
    if (!previewDataUrl || !numPages || !pdfContainerRef.current) return;

    const throttledObserverCallback = throttle((entries) => {
      let topMostVisiblePage = currentPage;
      let maxIntersectionRatio = 0;

      entries.forEach((entry) => {
        const pageNumber = parseInt(entry.target.getAttribute("data-page-number"), 10);
        if (entry.isIntersecting && entry.intersectionRatio > maxIntersectionRatio) {
          maxIntersectionRatio = entry.intersectionRatio;
          topMostVisiblePage = pageNumber;
        }
      });

      if (topMostVisiblePage !== currentPage) {
        setCurrentPage(topMostVisiblePage);
      }
    }, 100);

    const observer = new IntersectionObserver(throttledObserverCallback, {
      root: pdfContainerRef.current,
      threshold: [0.1, 0.5, 0.9],
      rootMargin: "100px 0px",
    });

    const pageElements = pdfContainerRef.current.querySelectorAll("[data-page-number]");
    pageElements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      throttledObserverCallback.cancel();
    };
  }, [previewDataUrl, numPages, currentPage]);

  // Enhanced resource loading with caching and error handling
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
        
        // Try to get from cache first
        const cachedResource = sessionStorage.getItem(cacheKey);
        if (cachedResource && !fetchedResource) {
          fetchedResource = JSON.parse(cachedResource);
        }
        
        // Fetch if not available or if cached resource doesn't match
        if (!fetchedResource || fetchedResource._id !== resourceId) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
          
          try {
            const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
              signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            fetchedResource = await response.json();
            fetchedResource = fetchedResource.resource || fetchedResource;
            
            // Cache the resource
            sessionStorage.setItem(cacheKey, JSON.stringify(fetchedResource));
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
              throw new Error('Request timeout - please check your connection');
            }
            throw fetchError;
          }
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
  }, [resourceId, initialResourceFromState]);

  // Enhanced purchase status fetching
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
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          setIsPurchased(data.isPurchased || false);
        } else {
          // Fallback to user data
          const purchased = user.purchasedResources?.includes(resource._id) || false;
          setIsPurchased(purchased);
        }
      } catch (error) {
        // Fallback to user data on error
        const purchased = user.purchasedResources?.includes(resource._id) || false;
        setIsPurchased(purchased);
      }
    };

    fetchPurchaseStatus();
  }, [isAuthenticated, token, user?.purchasedResources, resource?._id, user, isAdmin]);

  // Enhanced ratings fetching with better error handling
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
      // Don't show error to user for ratings, just log it
    } finally {
      setIsRatingLoading(false);
    }
  }, [resourceId, userId, overallRating, userRating]);

  useEffect(() => {
    if (resourceId) {
      refreshRatings();
      // Reduced polling frequency for ratings
      pollIntervalRef.current = setInterval(refreshRatings, 60000); // 1 minute
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [resourceId, refreshRatings]);

  // Enhanced rating handler with optimistic updates
  const handleRate = useCallback(async (value) => {
    if (!isAuthenticated || !resourceId) {
      setError("Please login to rate");
      return;
    }

    const previousRating = userRating;
    const previousOverallRating = overallRating;
    
    // Optimistic update
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
      // Revert optimistic updates
      setUserRating(previousRating);
      setOverallRating(previousOverallRating);
    }
  }, [isAuthenticated, resourceId, token, userRating, overallRating]);

  // Enhanced PDF document handlers
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log(`PDF loaded successfully with ${numPages} pages`);
    setNumPages(numPages);
    setPreviewLoading(false);
    setPreviewError(null);
    setCurrentPage(1);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading PDF document:", error);
    setPreviewError("Failed to load PDF preview. Please try downloading or refreshing.");
    setPreviewLoading(false);
  }, []);

  // Enhanced preview handler with better caching
  const handlePreview = useCallback(async () => {
    if (!isAuthenticated) {
      setError("You need to be logged in to preview resources.");
      return;
    }

    if (previewDataUrl) return;

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Check cache first
      const cachedPreview = sessionStorage.getItem(`preview_${resourceId}`);
      if (cachedPreview) {
        setPreviewDataUrl(cachedPreview);
        setPreviewLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for preview

      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal
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
      
      // Cache preview URL (will be cleaned up on component unmount)
      sessionStorage.setItem(`preview_${resourceId}`, url);
    } catch (err) {
      console.error("Preview failed:", err);
      if (err.name === 'AbortError') {
        setPreviewError("Preview request timeout - please try again");
      } else {
        setPreviewError(err.message);
      }
    } finally {
      setPreviewLoading(false);
    }
  }, [isAuthenticated, resourceId, token, previewDataUrl]);

  // Enhanced zoom handlers with limits
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
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
      return;
    }

    if (!previewDataUrl && !previewLoading) {
      await handlePreview();
    }
    setIsFullscreen(true);
  }, [isAuthenticated, previewDataUrl, previewLoading, handlePreview]);

  // Enhanced download validation
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

  // Enhanced download handler with progress tracking
  const handleDownload = useCallback(async () => {
    if (!validateDownload()) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout for download

      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
        },
        signal: controller.signal
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

      // Increment download count
      await fetch(`${API_BASE_URL}/resources/${resourceId}/increment-download`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Download failed:", err);
      const errorMessage = err.name === 'AbortError' 
        ? "Download timeout - please try again" 
        : `Download failed: ${err.message}`;
      setError(errorMessage);
      alert(errorMessage);
    }
  }, [resourceId, token, resource?.title, validateDownload]);

  // Enhanced purchase handler with better UX
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setError("You need to be logged in to purchase resources.");
      return;
    }
    
    if (userCoins < cost) {
      showInsufficientCoinsModal();
      return;
    }

    setPurchasing(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/purchase`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cost }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setIsPurchased(true);
        
        // Update user data
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

  const showInsufficientCoinsModal = () => {
    alert(
      `You need ${cost} ScholaraCoins to purchase this resource. You currently have ${userCoins} coins. Earn more coins by uploading resources or referring friends!`
    );
  };

  // Enhanced cleanup
  useEffect(() => {
    return () => {
      if (previewDataUrl) {
        URL.revokeObjectURL(previewDataUrl);
        sessionStorage.removeItem(`preview_${resourceId}`);
      }
    };
  }, [previewDataUrl, resourceId]);

  // Enhanced PDF pages rendering with lazy loading
  const renderPdfPages = useMemo(() => {
    if (!numPages) return null;

    const pagesToRender = [];
    const visibleRange = 3; // Render 3 pages around current page
    const startPage = Math.max(1, currentPage - visibleRange);
    const endPage = Math.min(numPages, currentPage + visibleRange);

    for (let pageNumber = startPage; pageNumber <= endPage; pageNumber++) {
      pagesToRender.push(
        <div
          key={pageNumber}
          data-page-number={pageNumber}
          className="mb-4 flex justify-center"
          style={{ minHeight: pdfDimensions.height }}
        >
          <div
            className="bg-gray-100 dark:bg-charcoal rounded-lg flex items-center justify-center shadow-lg"
            style={{
              width: pdfDimensions.width,
              height: pdfDimensions.height,
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={pdfDimensions.width}
              scale={isMobile ? Math.min(zoom, 1.5) : zoom}
              className="rounded-lg overflow-hidden"
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

    // Add placeholders for pages not in visible range
    if (startPage > 1) {
      pagesToRender.unshift(
        <div key="placeholder-start" className="mb-4 flex justify-center">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm"
               style={{ width: pdfDimensions.width, height: 100 }}>
            Pages 1-{startPage - 1} (scroll up to load)
          </div>
        </div>
      );
    }

    if (endPage < numPages) {
      pagesToRender.push(
        <div key="placeholder-end" className="mb-4 flex justify-center">
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 dark:text-gray-400 text-sm"
               style={{ width: pdfDimensions.width, height: 100 }}>
            Pages {endPage + 1}-{numPages} (scroll down to load)
          </div>
        </div>
      );
    }

    return pagesToRender;
  }, [numPages, zoom, isMobile, pdfDimensions, currentPage]);

  // Enhanced page indicator component
  const PageIndicator = ({ className = "" }) => {
    if (!numPages || numPages <= 1) return null;

    return (
      <div className={`flex items-center gap-3 px-4 py-2 bg-black/70 text-white rounded-lg backdrop-blur-sm ${className}`}>
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
      </div>
    );
  };

  // Enhanced stats display
  const StatsCard = ({ icon, label, value, trend }) => (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-3 bg-white dark:bg-charcoal p-4 rounded-xl shadow-inner"
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <span className="text-xs text-green-500 dark:text-green-400 flex items-center gap-1">
              <TrendingUp size={12} />
              {trend}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );

  // Loading state component
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-onyx">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Loading Resource</h2>
          <p className="text-gray-600 dark:text-gray-400">Please wait while we fetch the details...</p>
        </motion.div>
      </div>
    );
  }

  // Error state component
  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50 dark:bg-onyx">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <AlertCircle size={64} className="text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Oops! Something went wrong</h2>
          <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">{error || "Resource not found"}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg shadow-md hover:bg-gray-600 flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Go Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const { title, description, fileType, course, subject, downloads = 0, thumbnailUrl, createdAt } = resource;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx pt-8 px-4 sm:px-6 lg:px-8"
    >
      {/* Enhanced Mobile Fullscreen Modal */}
      <AnimatePresence>
        {isMobile && isFullscreen && (
          <motion.div
            className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[999999] flex flex-col"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {/* Enhanced Header */}
            <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
              <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-white font-semibold truncate">{title}</h3>
                <p className="text-white/70 text-xs truncate">{course} • {subject}</p>
              </div>
              <div className="flex items-center gap-3">
                <PageIndicator />
                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            {/* PDF Container */}
            <div
              ref={pdfContainerRef}
              className="flex-1 overflow-auto bg-gray-50 dark:bg-charcoal p-4"
              style={{ scrollBehavior: "smooth" }}
            >
              {previewDataUrl ? (
                <Document
                  file={previewDataUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={<LoadingSpinner size="lg" text="Loading PDF..." />}
                  error={
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center text-white p-6">
                        <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                        <p className="mb-4">{previewError}</p>
                        <button
                          onClick={handleDownload}
                          disabled={!canDownload}
                          className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                            canDownload
                              ? "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white cursor-not-allowed opacity-50"
                          }`}
                        >
                          <FontAwesomeIcon icon={faDownload} className="mr-2" />
                          {canDownload ? "Download File" : "Purchase Required"}
                        </button>
                      </div>
                    </div>
                  }
                >
                  {renderPdfPages}
                </Document>
              ) : previewLoading ? (
                <LoadingSpinner size="lg" text="Loading preview..." />
              ) : previewError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white p-6">
                    <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                    <p className="mb-4">{previewError}</p>
                    <button
                      onClick={handlePreview}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Retry Preview
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white p-6">
                    <div className="w-24 h-24 mx-auto mb-4 text-blue-500">{getIconForType(fileType, 48)}</div>
                    <p className="mb-4">Click preview to view this resource</p>
                    <button
                      onClick={handlePreview}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 mx-auto"
                    >
                      <Eye size={16} />
                      Preview Resource
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/90 dark:bg-onyx/60 backdrop-blur-md border-t border-white/20 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {previewDataUrl && (
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal rounded-lg p-1">
                      <button
                        onClick={handleZoomOut}
                        disabled={zoom <= 0.5}
                        className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50"
                      >
                        <ZoomOut size={14} />
                      </button>
                      <span className="px-2 text-xs font-medium text-gray-600 dark:text-gray-300 min-w-[45px] text-center">
                        {Math.round(zoom * 100)}%
                      </span>
                      <button
                        onClick={handleZoomIn}
                        disabled={zoom >= 3}
                        className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50"
                      >
                        <ZoomIn size={14} />
                      </button>
                      <button
                        onClick={resetZoom}
                        className="p-2 rounded-md hover:bg-white dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canDownload ? (
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg shadow-lg transition-all flex items-center gap-2"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Download</span>
                    </button>
                  ) : (
                    <button
                      onClick={userCoins < cost ? showInsufficientCoinsModal : handlePurchase}
                      disabled={purchasing}
                      className={`px-4 py-2 rounded-lg shadow-lg transition-all flex items-center gap-2 ${
                        userCoins < cost
                          ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                          : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      } text-white`}
                    >
                      {purchasing ? (
                        <FontAwesomeIcon icon={faSpinner} spin size={16} />
                      ) : (
                        <img src={coin} alt="coin" className="w-4 h-4" />
                      )}
                      <span className="hidden sm:inline">
                        {purchasing ? "Processing..." : userCoins < cost ? "Need Coins" : `Buy (${cost})`}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto bg-white dark:bg-onyx/60 rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row relative" style={{ minHeight: "700px" }}>
        
        {/* Enhanced PDF Preview Section */}
        <motion.div
          className="relative overflow-hidden"
          animate={{
            width: isFullscreen ? "100%" : isMobile ? "100%" : "50%",
            height: isMobile && isFullscreen ? "100vh" : "400px",
          }}
          transition={{ duration: 0.3, ease: "easeInOut", type: "tween" }}
          style={{
            minHeight: isMobile ? (isFullscreen ? "100vh" : "400px") : "600px",
            willChange: "width, height",
          }}
        >
          <div
            ref={pdfContainerRef}
            className="absolute inset-0 flex flex-col"
            style={{
              height: "700px",
              overflowY: "auto",
              scrollBehavior: "smooth",
            }}
          >
            {/* Background thumbnail */}
            {!previewDataUrl && !previewLoading && thumbnailUrl && (
              <div className="absolute inset-0 bg-gray-50 dark:bg-charcoal">
                <img
                  src={thumbnailUrl}
                  alt={`${title} thumbnail`}
                  className="w-full h-full object-cover filter blur-sm scale-105 transition-all duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling?.classList.remove("hidden");
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-charcoal">
                  <div className="text-center text-gray-700 dark:text-gray-300">
                    <FontAwesomeIcon icon={faImage} size="2x" className="mb-3 text-gray-400" />
                    <p>Thumbnail unavailable</p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile preview overlay */}
            {isMobile && !previewDataUrl && !previewLoading && !previewError && isAuthenticated && (
              <div
                className="absolute inset-0 bg-black/50 flex  items-start lg:items-center justify-center z-10 p-4 cursor-pointer"
                onClick={handleMobileFullscreen}
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-white/90 dark:bg-black/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20 max-w-xs w-full pointer-events-none"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 text-blue-500 flex items-center justify-center">
                      {getIconForType(fileType, 64)}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Preview Resource</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Tap anywhere to view in fullscreen</p>
                    <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                      <Maximize2 size={16} />
                      <span className="text-sm font-medium">Fullscreen Mode</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* PDF Content */}
            {previewDataUrl ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {!isMobile && numPages > 1 && (
                  <div className="absolute top-4 right-4 z-20">
                    <PageIndicator />
                  </div>
                )}
                
                <div className="flex-1 overflow-auto scroll-container p-2 sm:p-4 bg-gray-50 dark:bg-charcoal">
                  <Document
                    file={previewDataUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={<LoadingSpinner size="lg" text="Loading PDF..." />}
                    error={
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center p-6">
                          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                          <p className="text-gray-700 dark:text-gray-300 mb-4">{previewError}</p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                              onClick={handlePreview}
                              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                            >
                              <RefreshCw size={16} />
                              Retry Preview
                            </button>
                            {canDownload ? (
                              <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg flex items-center gap-2"
                              >
                                <Download size={16} />
                                Download File
                              </button>
                            ) : (
                              <button
                                onClick={userCoins < cost ? showInsufficientCoinsModal : handlePurchase}
                                disabled={purchasing}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                  userCoins < cost
                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                                    : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                } text-white`}
                              >
                                {purchasing ? (
                                  <FontAwesomeIcon icon={faSpinner} spin />
                                ) : (
                                  <img src={coin} alt="coin" className="w-4 h-4" />
                                )}
                                {purchasing ? "Processing..." : userCoins < cost ? "Need More Coins" : `Purchase (${cost} coins)`}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    }
                  >
                    {renderPdfPages}
                  </Document>
                </div>

                {/* Enhanced Desktop Controls */}
                {!isMobile && (
                  <motion.div
                    className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-0 p-4 bg-white dark:bg-onyx/60 border-t border-gray-200 dark:border-charcoal"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="flex items-center gap-2 lg:gap-3 w-full lg:w-auto justify-center lg:justify-start">
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal rounded-lg p-1">
                        <button
                          onClick={handleZoomOut}
                          disabled={zoom <= 0.5}
                          className="p-1.5 lg:p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50"
                          title="Zoom Out"
                        >
                          <ZoomOut size={16} />
                        </button>
                        <span className="px-1.5 lg:px-2 text-xs lg:text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[45px] lg:min-w-[50px] text-center">
                          {Math.round(zoom * 100)}%
                        </span>
                        <button
                          onClick={handleZoomIn}
                          disabled={zoom >= 3}
                          className="p-1.5 lg:p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300 disabled:opacity-50"
                          title="Zoom In"
                        >
                          <ZoomIn size={16} />
                        </button>
                        <button
                          onClick={resetZoom}
                          className="p-1.5 lg:p-2 rounded-md hover:bg-white dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                          title="Reset Zoom"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-end">
                      <button
                        onClick={toggleFullscreen}
                        className="p-1.5 lg:p-2 rounded-md bg-gray-100 dark:bg-charcoal text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                      </button>
                      
                      {canDownload ? (
                        <button
                          onClick={handleDownload}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg flex items-center gap-1.5 lg:gap-2 transition-colors text-sm lg:text-base shadow-lg"
                        >
                          <Download size={14} className="lg:hidden" />
                          <Download size={16} className="hidden lg:block" />
                          <span className="hidden md:inline">Download</span>
                          <span className="md:hidden">DL</span>
                        </button>
                      ) : (
                        <button
                          onClick={userCoins < cost ? showInsufficientCoinsModal : handlePurchase}
                          disabled={purchasing}
                          className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg flex items-center gap-1.5 lg:gap-2 transition-colors text-sm lg:text-base shadow-lg ${
                            userCoins < cost
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          } text-white`}
                        >
                          {purchasing ? (
                            <FontAwesomeIcon icon={faSpinner} spin size={14} className="lg:hidden" />
                          ) : (
                            <img src={coin} alt="coin" className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                          )}
                          {purchasing ? (
                            <FontAwesomeIcon icon={faSpinner} spin size={16} className="hidden lg:block" />
                          ) : (
                            <img src={coin} alt="coin" className="w-4 h-4 hidden lg:block" />
                          )}
                          <span className="hidden md:inline">
                            {purchasing ? "Processing..." : userCoins < cost ? "Need Coins" : `Buy (${cost})`}
                          </span>
                          <span className="md:hidden">{purchasing ? "..." : userCoins < cost ? "Need" : "Buy"}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                        {isMobile && !isFullscreen && (
                          <div className="flex items-center justify-between p-3 bg-white dark:bg-onyx/60 border-t border-gray-200 dark:border-charcoal gap-2">
                          <button
                            onClick={handleMobileFullscreen}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm flex-1"
                          >
                            <Maximize2 size={16} />
                            Fullscreen
                          </button>
                          
                          {canDownload ? (
                            <button
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg text-sm flex-1"
                            >
                            <Download size={16} />
                            Download
                            </button>
                          ) : (
                            <button
                            onClick={userCoins < cost ? showInsufficientCoinsModal : handlePurchase}
                            disabled={purchasing}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm flex-1 ${
                              userCoins < cost
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            } text-white`}
                            >
                            {purchasing ? (
                              <FontAwesomeIcon icon={faSpinner} spin size={16} />
                            ) : (
                              <img src={coin} alt="coin" className="w-4 h-4" />
                            )}
                            {purchasing ? "Processing..." : userCoins < cost ? "Need Coins" : `Buy (${cost})`}
                            </button>
                          )}
                          </div>
                        )}
                        </div>
                      ) : previewLoading ? (
                        <div className="flex items-center justify-center h-full">
                        <LoadingSpinner size="lg" text="Loading preview..." />
                        </div>
                      ) : previewError ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6">
                        <AlertCircle size={48} className="text-red-500 dark:text-red-400 mb-4" />
                        <p className="text-gray-700 dark:text-gray-300 mb-4 max-w-md">{previewError}</p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button
                          onClick={handlePreview}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                          >
                          <RefreshCw size={16} />
                          Retry Preview
                          </button>
                          {canDownload && (
                          <button
                            onClick={handleDownload}
                            className="px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white rounded-lg flex items-center gap-2"
                          >
                            <Download size={16} />
                            Download
                          </button>
                          )}
                        </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 z-0 relative">
                        <div className="w-32 h-32 lg:flex hidden items-center justify-center text-blue-500 dark:text-blue-400 mb-4">
                          {getIconForType(fileType, 64)}
                        </div>
                        {isAuthenticated ? (
                          <div className="max-w-md mx-auto flex flex-col items-center">
                          <p className={`text-gray-600 dark:text-gray-300 font-medium mb-6 ${isMobile ? "hidden" : "visible"}`}>
                            {isMobile ? "Tap the preview area above to view in fullscreen" : "Click the preview button to view this resource"}
                          </p>
                          {!isMobile && (
                            <button
                            onClick={handlePreview}
                            className="px-4 py-2 rounded-lg flex items-center gap-2 transition-colors bg-blue-500 text-white hover:bg-blue-600 mx-auto"
                            style={{ display: "inline-flex" }}
                            >
                            <Eye size={16} />
                            Preview Resource
                            </button>
                          )}
                          </div>
                        ) : (
                          <div className="max-w-md mx-auto flex flex-col items-center">
                          <p className="text-gray-600 dark:text-gray-300 font-medium mb-6">Please login to preview this resource</p>
                          <div className="px-4 py-2 rounded-lg bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Eye size={16} />
                            Login Required
                          </div>
                          </div>
                        )}
                        </div>
                      )}
                      </div>
                    </motion.div>

                    {/* Enhanced Resource Details Section */}
        <motion.div
          className="p-4 sm:p-6 md:p-8 bg-white dark:bg-onyx/60 overflow-y-auto"
          style={{
            position: isFullscreen ? "absolute" : "relative",
            right: 0,
            top: isMobile ? "auto" : 0,
            bottom: isMobile && !isFullscreen ? 0 : "auto",
            width: isMobile ? "100%" : "50%",
            height: isMobile && !isFullscreen ? "40vh" : "700px",
            minHeight: isMobile ? "300px" : "600px",
          }}
          animate={{
            x: isFullscreen ? "100%" : 0,
            y: isFullscreen && isMobile ? "100%" : 0,
            opacity: isFullscreen ? 0 : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
            opacity: { duration: isFullscreen ? 0.1 : 0.3, delay: isFullscreen ? 0 : 0.1 },
          }}
        >
          {/* Enhanced Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight">
                {title}
              </h1>
              {createdAt && (
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-4">
                  <Clock size={12} className="mr-1" />
                  {new Date(createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
            
            {/* Enhanced Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1.5 rounded-full text-sm font-medium">
                <GraduationCap size={14} />
                <span>{course}</span>
              </div>
              <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1.5 rounded-full text-sm font-medium">
                {getIconForSubject(subject, 14)}
                <span>{subject}</span>
              </div>
              <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-3 py-1.5 rounded-full text-sm font-medium">
                {getIconForType(fileType, 14)}
                <span>{fileType}</span>
              </div>
            </div>

            {/* Enhanced Price Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl shadow-sm border border-amber-200 dark:border-amber-800/50">
                <img src={coin} alt="coin" className="w-5 h-5" />
                <span className="text-lg font-bold text-amber-800 dark:text-amber-300">{cost} coins</span>
              </div>
              {isPurchased && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                  <FontAwesomeIcon icon={faCheckCircle} />
                  <span className="text-sm font-medium">Owned</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Enhanced Description */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              {description || "No description provided for this resource."}
            </p>
          </motion.div>

          {/* Enhanced Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <StatsCard
              icon={<Star size={24} className="text-yellow-500" />}
              label="Overall Rating"
              value={`${overallRating.toFixed(1)} / 5`}
              trend={isRatingLoading && <FontAwesomeIcon icon={faSpinner} spin size="sm" />}
            />
            <StatsCard
              icon={<Download size={24} className="text-green-500" />}
              label="Downloads"
              value={downloads.toLocaleString()}
            />
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {!isMobile && (
              <motion.button
                onClick={handlePreview}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={!isAuthenticated}
                className={`flex-1 py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${
                  isAuthenticated
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                <Eye size={20} />
                {previewDataUrl ? "Refresh Preview" : "Preview Resource"}
              </motion.button>
            )}
            
            {isMobile && (
              <motion.button
                onClick={handleMobileFullscreen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                disabled={!isAuthenticated}
                className={`flex-1 py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${
                  isAuthenticated
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}
              >
                <Maximize2 size={20} />
                Preview Fullscreen
              </motion.button>
            )}

            {fileUrl && (
              <>
                {canDownload ? (
                  <motion.button
                    onClick={handleDownload}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!isAuthenticated}
                    className={`flex-1 py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${
                      isAuthenticated
                        ? "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white"
                        : "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <Download size={20} />
                    Download
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={userCoins < cost ? showInsufficientCoinsModal : handlePurchase}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!isAuthenticated || purchasing}
                    className={`flex-1 py-3 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-colors ${
                      !isAuthenticated
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : userCoins < cost
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
                        : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                    }`}
                  >
                    {purchasing ? (
                      <FontAwesomeIcon icon={faSpinner} spin size="lg" />
                    ) : (
                      <img src={coin} alt="coin" className="w-5 h-5" />
                    )}
                    {purchasing ? "Processing..." : userCoins < cost ? `Need ${cost - userCoins} More Coins` : `Purchase (${cost} coins)`}
                  </motion.button>
                )}
              </>
            )}
          </div>

          {/* Enhanced User Interaction Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Star size={24} className="text-yellow-500" />
              Rate This Resource
            </h2>
            
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-charcoal rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600 dark:bg-amber-400 flex items-center justify-center text-white font-bold">
                      {userName ? userName[0].toUpperCase() : "U"}
                    </div>
                    <div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">
                        Logged in as: <span className="text-blue-500 dark:text-blue-400">{userName}</span>
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Share your experience with this resource
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <StarRating
                      rating={userRating}
                      onRate={handleRate}
                      editable={true}
                      starSize={24}
                      showValue={true}
                      isLoading={isRatingLoading}
                      className="flex-1"
                    />
                    
                    {userRating > 0 && (
                      <div className="ml-4 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
                        <span className="text-sm font-medium">Rated!</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {userRating > 0 ? "Click stars to update your rating" : "Click stars to rate this resource (helps others find quality content)"}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => navigator.share && navigator.share({
                      title: title,
                      text: description,
                      url: window.location.href
                    })}
                    className="px-3 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                  
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="px-3 py-2 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors flex items-center gap-2 text-sm"
                  >
                    <TrendingUp size={14} />
                    {showStats ? 'Hide' : 'Show'} Stats
                  </button>
                </div>

                {/* Expandable Stats */}
                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-charcoal rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-500 dark:text-blue-400">{overallRating.toFixed(1)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Avg Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500 dark:text-green-400">{downloads}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Downloads</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="p-6 bg-gray-50 dark:bg-gray-700 rounded-xl text-center border border-gray-200 dark:border-gray-700">
                <Users size={48} className="mx-auto mb-3 text-gray-400 dark:text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Join Our Community</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Please log in to rate this resource and help other students find quality content.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star size={16} />
                    Rate resources
                  </div>
                  <div className="flex items-center gap-1">
                    <Send size={16} />
                    Leave comments
                  </div>
                  <div className="flex items-center gap-1">
                    <Download size={16} />
                    Track downloads
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Comments Section */}
      <motion.div
        className="max-w-6xl p-4 lg:p-8 mx-auto bg-white dark:bg-onyx/60 rounded-2xl shadow-xl overflow-hidden mt-4 sm:mt-8"
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

      {/* Back to Top Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed bottom-6 right-6 p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-colors z-50"
        title="Back to top"
      >
        <ArrowLeft size={20} className="transform -rotate-90" />
      </motion.button>
    </motion.div>
  );
};

export default ResourceDetailPage;
