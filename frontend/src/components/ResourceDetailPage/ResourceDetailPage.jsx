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
  Trash2,
  Clock,
  Users,
  TrendingUp,
  Save,
  Flag,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faStar as faSolidStar,
  
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { debounce, throttle } from "lodash";
import { useModal } from "../../context/ModalContext/ModalContext";
import { useResource } from "../../context/ResourceContext/ResourceContext";
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


const PAGES_TO_RENDER = 3; // Only render 3 pages at a time
const PAGE_BUFFER = 1; // Buffer pages before/after visible area
const RENDER_DELAY = 100; // Delay between renders to prevent lag

const ResourceDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const { user, token, isAuthenticated, updateUser } = useAuth();
  const { showModal } = useModal();
  const { handleSave, handleFlag, handleDelete } = useResource();
  const { resource: initialResourceFromState } = location.state || {};

  // Core state
  const [resource, setResource] = useState(initialResourceFromState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Rating state
  const [userRating, setUserRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);

  // Preview state - Optimized for performance
  const [zoom, setZoom] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 500, height: 707 });
  const [visiblePages, setVisiblePages] = useState(new Set([1])); // Track visible pages
  const [renderedPages, setRenderedPages] = useState(new Set()); // Track rendered pages
  const [showPreview, setShowPreview] = useState(false); // Control preview visibility

  // Purchase state
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // UI state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showStats, setShowStats] = useState(false);
  const [showFullscreenControls, setShowFullscreenControls] = useState(true);
  const [isCursorOnControls, setIsCursorOnControls] = useState(false); // Track cursor on controls

  // Refs
  const pdfContainerRef = useRef(null);
  const hideControlsTimeoutRef = useRef(null);
  const renderQueueRef = useRef([]);
  const isRenderingRef = useRef(false);
  const intersectionObserverRef = useRef(null);
  const pageRefsMap = useRef(new Map());

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

  const isOwner = useMemo(() => {
    return user && resource?.uploadedBy?._id === user._id;
  }, [user, resource]);

  // Cleanup function for PDF
  const cleanupPdf = useCallback(() => {
    if (previewDataUrl) {
      URL.revokeObjectURL(previewDataUrl);
      setPreviewDataUrl(null);
    }
    setVisiblePages(new Set([1]));
    setRenderedPages(new Set());
    pageRefsMap.current.clear();
    setShowPreview(false); // Reset preview visibility
  }, [previewDataUrl]);

  // Virtual scrolling setup with IntersectionObserver
  useEffect(() => {
    if (!pdfContainerRef.current || !numPages) return;

    // Disconnect previous observer
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }

    // Create intersection observer for lazy loading
    intersectionObserverRef.current = new IntersectionObserver(
      (entries) => {
        const newVisiblePages = new Set();
        
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.dataset.pageNumber);
          if (entry.isIntersecting) {
            newVisiblePages.add(pageNum);
            // Update currentPage based on the most visible page
            const rect = entry.target.getBoundingClientRect();
            if (rect.top >= 0 && rect.top <= window.innerHeight / 2) {
              setCurrentPage(pageNum);
            }
            // Add buffer pages
            for (let i = Math.max(1, pageNum - PAGE_BUFFER); 
                 i <= Math.min(numPages, pageNum + PAGE_BUFFER); i++) {
              newVisiblePages.add(i);
            }
          }
        });

        if (newVisiblePages.size > 0) {
          setVisiblePages(newVisiblePages);
        }
      },
      {
        root: isFullscreen ? document.querySelector('.fullscreen-container') : pdfContainerRef.current,
        rootMargin: '300px 0px', // Increased for better preloading
        threshold: 0.2 // Increased for more reliable detection
      }
    );

    // Observe all page placeholders
    pageRefsMap.current.forEach((ref, pageNum) => {
      if (ref && intersectionObserverRef.current) {
        intersectionObserverRef.current.observe(ref);
      }
    });

    return () => {
      if (intersectionObserverRef.current) {
        intersectionObserverRef.current.disconnect();
      }
    };
  }, [numPages, isFullscreen]);

  // Fallback scroll handler for fullscreen mode
  useEffect(() => {
    if (!isFullscreen || !pdfContainerRef.current || !numPages) return;

    const handleScroll = throttle(() => {
      const container = pdfContainerRef.current;
      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;

      // Calculate visible pages based on scroll position
      const newVisiblePages = new Set();
      pageRefsMap.current.forEach((ref, pageNum) => {
        if (ref) {
          const rect = ref.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          if (relativeTop >= -100 && relativeTop <= containerHeight + 100) {
            newVisiblePages.add(pageNum);
            // Add buffer pages
            for (let i = Math.max(1, pageNum - PAGE_BUFFER); 
                 i <= Math.min(numPages, pageNum + PAGE_BUFFER); i++) {
              newVisiblePages.add(i);
            }
            // Update currentPage based on the most visible page
            if (relativeTop >= 0 && relativeTop <= containerHeight / 2) {
              setCurrentPage(pageNum);
            }
          }
        }
      });

      if (newVisiblePages.size > 0) {
        setVisiblePages(newVisiblePages);
      }
    }, 100);

    pdfContainerRef.current.addEventListener('scroll', handleScroll);
    return () => {
      pdfContainerRef.current?.removeEventListener('scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [isFullscreen, numPages]);

  // Process render queue with throttling
  const processRenderQueue = useCallback(() => {
    if (isRenderingRef.current || renderQueueRef.current.length === 0) return;

    isRenderingRef.current = true;
    const pagesToRender = renderQueueRef.current.splice(0, PAGES_TO_RENDER);
    
    setRenderedPages(prev => {
      const newSet = new Set(prev);
      pagesToRender.forEach(page => newSet.add(page));
      return newSet;
    });

    setTimeout(() => {
      isRenderingRef.current = false;
      if (renderQueueRef.current.length > 0) {
        processRenderQueue();
      }
    }, RENDER_DELAY);
  }, []);

  // Update render queue when visible pages change
  useEffect(() => {
    const newPagesToRender = Array.from(visiblePages).filter(
      page => !renderedPages.has(page)
    );
    
    if (newPagesToRender.length > 0) {
      renderQueueRef.current = newPagesToRender;
      processRenderQueue();
    }
  }, [visiblePages, renderedPages, processRenderQueue]);

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
        const aspectRatio = 1.414;
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
        
        if (!fetchedResource || fetchedResource._id !== resourceId) {
          const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          fetchedResource = await response.json();
          fetchedResource = fetchedResource.resource || fetchedResource;
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

  // Check if user has saved this resource
  useEffect(() => {
    if (user?.savedResources && resource?._id) {
      setHasSaved(user.savedResources.includes(resource._id));
    }
  }, [user?.savedResources, resource?._id]);

  // Purchase status fetching
  useEffect(() => {
    const fetchPurchaseStatus = async () => {
      if (!isAuthenticated || !token || !user || !resource?._id) {
        setIsPurchased(false);
        return;
      }
      
      if (isAdmin || isOwner) {
        setIsPurchased(true);
        return;
      }
      
      try {
        const response = await fetch(`${API_BASE_URL}/resources/${resource._id}/purchase-status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
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
  }, [isAuthenticated, token, user, resource?._id, isAdmin, isOwner]);

  // Rating handlers
  const refreshRatings = useCallback(async () => {
    if (!resourceId) return;
    setIsRatingLoading(true);
    try {
      const url = `${API_BASE_URL}/resources/${resourceId}/ratings${userId ? `?userId=${userId}` : ""}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch ratings`);
      }
      
      const data = await response.json();
      setOverallRating(data.overallRating ?? 0);
      if (userId) setUserRating(data.userRating ?? 0);
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setIsRatingLoading(false);
    }
  }, [resourceId, userId]);

  useEffect(() => {
    if (resourceId) {
      refreshRatings();
    }
  }, [resourceId, refreshRatings]);

  const handleRate = useCallback(async (value) => {
    if (!isAuthenticated || !resourceId) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "Please login to rate this resource",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel",
      });
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
      
      showModal({
        type: "success",
        title: "Rating Saved",
        message: "Your rating has been saved successfully!",
        confirmText: "OK",
      });
    } catch (e) {
      console.error("Rating error:", e);
      showModal({
        type: "error",
        title: "Rating Failed",
        message: e.message,
        confirmText: "OK",
      });
    }
  }, [isAuthenticated, resourceId, token, showModal, navigate]);

  // Optimized preview handler
  const handlePreview = useCallback(async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to preview resources.",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel",
      });
      return;
    }
    
    if (previewDataUrl) {
      setShowPreview(true); // Show preview if already loaded
      return;
    }
    
    setPreviewLoading(true);
    setPreviewError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch preview: HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      if (blob.type !== "application/pdf") {
        throw new Error("Invalid PDF file received");
      }
      
      const url = URL.createObjectURL(blob);
      setPreviewDataUrl(url);
      setShowPreview(true); // Show preview after loading
    } catch (err) {
      console.error("Preview failed:", err);
      let errorMessage = err.message;
      if (err.message.includes("401")) {
        errorMessage = "Authentication failed. Please log in again.";
        navigate('/login');
      }
      setPreviewError(errorMessage);
      showModal({
        type: "error",
        title: "Preview Failed",
        message: errorMessage,
        confirmText: "OK",
      });
    } finally {
      setPreviewLoading(false);
    }
  }, [isAuthenticated, resourceId, token, previewDataUrl, navigate, showModal]);

  // PDF document handlers
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    console.log(`PDF loaded with ${numPages} pages`);
    setNumPages(numPages);
    setPreviewLoading(false);
    setPreviewError(null);
    setCurrentPage(1);
    // Only render first few pages initially
    setVisiblePages(new Set([1, 2, 3]));
    setRenderedPages(new Set());
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading PDF:", error);
    setPreviewError("Failed to load PDF preview");
    setPreviewLoading(false);
    showModal({
      type: "error",
      title: "PDF Load Error",
      message: "Failed to load PDF preview. Please try downloading the file instead.",
      confirmText: "OK",
    });
  }, [showModal]);

  // Download handler
  const handleDownload = useCallback(async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to download resources.",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel",
      });
      return;
    }
    
    if (!canDownload) {
      showModal({
        type: "info",
        title: "Purchase Required",
        message: `This resource requires purchase (${cost} coins). You currently have ${userCoins} coins.`,
        confirmText: "OK",
      });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`);
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
      
      showModal({
        type: "success",
        title: "Download Started",
        message: "Your download has started successfully!",
        confirmText: "OK",
      });
      
      await fetch(`${API_BASE_URL}/resources/${resourceId}/increment-download`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Download failed:", err);
      showModal({
        type: "error",
        title: "Download Failed",
        message: err.message,
        confirmText: "OK",
      });
    }
  }, [isAuthenticated, canDownload, cost, userCoins, resourceId, token, resource?.title, showModal, navigate]);

  // Purchase handler
  const handlePurchase = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to purchase resources.",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel",
      });
      return;
    }
    
    if (userCoins < cost) {
      showModal({
        type: "info",
        title: "Insufficient Coins",
        message: `You need ${cost} ScholaraCoins to purchase this resource. You currently have ${userCoins} coins.`,
        confirmText: "OK",
      });
      return;
    }
    
    setPurchasing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/purchase`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cost }),
      });
      
      const data = await response.json();
      if (response.ok && data.success) {
        setIsPurchased(true);
        if (updateUser && data.user) {
          updateUser(data.user);
        }
        showModal({
          type: "success",
          title: "Purchase Successful",
          message: "Resource unlocked! You now have lifetime access to download it.",
          confirmText: "Great!",
        });
      } else {
        throw new Error(data.message || "Purchase failed.");
      }
    } catch (error) {
      console.error("Purchase failed:", error);
      showModal({
        type: "error",
        title: "Purchase Failed",
        message: error.message,
        confirmText: "OK",
      });
    } finally {
      setPurchasing(false);
    }
  };

  // Save/Unsave handler
  const handleSaveToggle = async () => {
    if (hasSaved) {
      // Unsave logic
      showModal({
        type: "warning",
        title: "Remove from Library?",
        message: "Are you sure you want to remove this resource from your library?",
        confirmText: "Remove",
        onConfirm: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/unsave`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });
            
            if (response.ok) {
              setHasSaved(false);
              showModal({
                type: "success",
                title: "Removed",
                message: "Resource removed from your library.",
                confirmText: "OK",
              });
            }
          } catch (error) {
            console.error("Unsave failed:", error);
          }
        },
        cancelText: "Cancel",
      });
    } else {
      await handleSave(resourceId);
      setHasSaved(true);
    }
  };

  // Zoom handlers
  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.2, 2)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.2, 0.5)), []);
  const resetZoom = useCallback(() => setZoom(1), []);
  const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);

  // Show/hide controls
  const showAndScheduleHide = useCallback(() => {
    setShowFullscreenControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
    if (!isCursorOnControls) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000);
    }
  }, [isCursorOnControls]);

  // Handle cursor entering/leaving controls
  const handleControlsMouseEnter = useCallback(() => {
    setIsCursorOnControls(true);
    if (hideControlsTimeoutRef.current) {
      clearTimeout(hideControlsTimeoutRef.current);
    }
  }, []);

  const handleControlsMouseLeave = useCallback(() => {
    setIsCursorOnControls(false);
    if (showFullscreenControls) {
      hideControlsTimeoutRef.current = setTimeout(() => {
        setShowFullscreenControls(false);
      }, 3000);
    }
  }, [showFullscreenControls]);

  // Optimized PDF page rendering
  const renderPdfPage = useCallback((pageNumber) => {
    const shouldRender = renderedPages.has(pageNumber) || visiblePages.has(pageNumber);
    
    return (
      <div
        key={`page-${pageNumber}`}
        ref={(el) => {
          if (el) pageRefsMap.current.set(pageNumber, el);
        }}
        data-page-number={pageNumber}
        className="mb-4 flex justify-center"
        style={{
          minHeight: pdfDimensions.height * zoom,
          width: '100%',
        }}
      >
        {shouldRender ? (
          <div
            className="bg-white rounded-lg shadow-lg"
            style={{
              width: pdfDimensions.width * zoom,
              height: pdfDimensions.height * zoom,
              maxWidth: '100%',
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={pdfDimensions.width}
              scale={zoom}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="flex items-center justify-center h-full">
                  <LoadingSpinner size="sm" text={`Loading page ${pageNumber}...`} />
                </div>
              }
            />
          </div>
        ) : (
          <div
            className="bg-gray-200 dark:bg-gray-700 rounded-lg shadow-lg flex items-center justify-center"
            style={{
              width: pdfDimensions.width * zoom,
              height: pdfDimensions.height * zoom,
              maxWidth: '100%',
            }}
          >
            <span className="text-gray-500">Page {pageNumber}</span>
          </div>
        )}
      </div>
    );
  }, [renderedPages, visiblePages, pdfDimensions, zoom]);

  // Stats Card Component
  const StatsCard = React.memo(({ icon, label, value }) => (
    <div className="flex items-center gap-3 bg-white dark:bg-charcoal p-4 rounded-xl shadow-inner">
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  ));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-onyx">
        <LoadingSpinner size="lg" text="Loading resource..." />
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

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-onyx transition-colors duration-300 ${isFullscreen ? "overflow-hidden" : ""}`}>
      <div className="p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Title Section */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mb-6"
          >
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-900 p-3 rounded-xl">
                {getIconForType(resource.type, 36)}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {resource.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                  by {resource?.uploadedBy?.username || "Anonymous"}
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Preview Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6"
              >
                <div
                  ref={pdfContainerRef}
                  className="bg-gray-100 dark:bg-charcoal rounded-lg overflow-auto"
                  style={{
                    maxHeight: isFullscreen ? '100vh' : '600px',
                    position: 'relative',
                  }}
                >
                  {!showPreview ? (
                    <div className="flex items-center justify-center h-96">
                      <button
                        onClick={handlePreview}
                        disabled={previewLoading}
                        className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {previewLoading ? (
                          <>
                            <LoadingSpinner size="sm" className="inline mr-2" />
                            Loading Preview...
                          </>
                        ) : (
                          <>
                            <Eye className="inline mr-2" size={20} />
                            Load Preview Resource
                          </>
                        )}
                      </button>
                    </div>
                  ) : previewError ? (
                    <div className="flex items-center justify-center h-96">
                      <ErrorDisplay error={previewError} onRetry={handlePreview} />
                    </div>
                  ) : previewDataUrl ? (
                    <Document
                      file={previewDataUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={<LoadingSpinner text="Loading PDF..." />}
                    >
                      {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(renderPdfPage)}
                    </Document>
                  ) : null}
                </div>

                {/* Preview Controls */}
                {previewDataUrl && !isFullscreen && numPages && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <span className="px-3 py-2 bg-gray-100 dark:bg-charcoal rounded-lg shadow-glow-sm text-sm">
                      Page {currentPage} / {numPages}
                    </span>
                    <button
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      className="p-2 bg-gray-200 dark:bg-charcoal rounded-lg disabled:opacity-50"
                    >
                      <ZoomOut size={20} />
                    </button>
                    <button
                      onClick={resetZoom}
                      className="p-2 bg-gray-200 dark:bg-charcoal rounded-lg"
                    >
                      <RefreshCw size={20} />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoom >= 2}
                      className="p-2 bg-gray-200 dark:bg-charcoal rounded-lg disabled:opacity-50"
                    >
                      <ZoomIn size={20} />
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="p-2 bg-gray-200 dark:bg-charcoal rounded-lg"
                    >
                      <Maximize2 size={20} />
                    </button>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="lg:w-96">
              {/* Actions Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-4">Actions</h2>
                
                {/* Purchase/Download Button */}
                {!canDownload ? (
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing || userCoins < cost}
                    className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {purchasing ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Purchasing...
                      </>
                    ) : (
                      <>
                        <img src={coin} alt="coin" className="w-5 h-5" />
                        <span>{cost} - Unlock & Download</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleDownload}
                    className="w-full mb-3 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download size={20} />
                    Download Resource
                  </button>
                )}

                {/* Save/Flag Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveToggle}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      hasSaved 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    <Save size={18} />
                    {hasSaved ? 'Saved' : 'Save'}
                  </button>
                  
                  <button
                    onClick={() => handleFlag(resourceId)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition-colors"
                  >
                    <Flag size={18} />
                    Report
                  </button>

                  {isOwner && (
                    <button
                      onClick={() => handleDelete(resourceId)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 dark:bg-red-900 dark:text-red-300 transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Details Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mb-6"
              >
                <h2 className="text-xl font-bold mb-4">Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <GraduationCap size={20} className="text-gray-500" />
                    <span className="font-medium">Subject:</span>
                    <span className="flex items-center gap-2">
                      {getIconForSubject(resource.subject, 18)}
                      {resource.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-gray-500" />
                    <span className="font-medium">Type:</span>
                    <span>{resource.type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star size={20} className="text-yellow-500" />
                    <span className="font-medium">Rating:</span>
                    <StarRating
                      rating={userRating}
                      onRate={handleRate}
                      isLoading={isRatingLoading}
                      editable={isAuthenticated}
                      starSize={20}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Stats Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6"
              >
                <h2 className="text-xl font-bold mb-4">Statistics</h2>
                <div className="grid grid-cols-2 gap-3">
                  <StatsCard
                    icon={<Eye className="text-blue-500" />}
                    label="Views"
                    value={resource?.viewCount || 0}
                  />
                  <StatsCard
                    icon={<Download className="text-green-500" />}
                    label="Downloads"
                    value={resource?.downloads || 0}
                  />
                  <div className="col-span-2">
                    <StatsCard
                      icon={<Star className="text-yellow-500" />}
                      label="Average Rating"
                      value={overallRating > 0 ? overallRating.toFixed(1) : "N/A"}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Comments Section */}
          {!isFullscreen && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white dark:bg-onyx/60 rounded-2xl shadow-glow-sm p-6 mt-8"
            >
              <ResourceCommentsSection
                resourceId={resourceId}
                currentUserId={userId}
                userName={userName}
              />
            </motion.div>
          )}
        </div>
      </div>

      {/* Fullscreen Overlay */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 flex flex-col fullscreen-container"
          >
            {/* Fullscreen Header */}
            <AnimatePresence>
              {showFullscreenControls && numPages && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="absolute top-4 left-0 right-0 z-10 flex justify-between items-center px-4"
                  onMouseEnter={handleControlsMouseEnter}
                  onMouseLeave={handleControlsMouseLeave}
                >
                  <div className="bg-black/70 backdrop-blur shadow-glow-sm rounded-lg px-4 py-2 text-white">
                    Page {currentPage} / {numPages}
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="bg-black/70 shadow-glow-sm backdrop-blur rounded-lg p-2 text-white hover:bg-black/80"
                  >
                    <Minimize2 size={24} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fullscreen PDF Container */}
            <div
              ref={pdfContainerRef}
              className="flex-1 overflow-auto"
              onMouseMove={showAndScheduleHide}
              onTouchStart={showAndScheduleHide}
            >
              {previewDataUrl && (
                <Document
                  file={previewDataUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={<LoadingSpinner text="Loading PDF..." />}
                >
                  {numPages && Array.from({ length: numPages }, (_, i) => i + 1).map(renderPdfPage)}
                </Document>
              )}
            </div>

            {/* Fullscreen Footer Controls */}
            <AnimatePresence>
              {showFullscreenControls && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 "
                  onMouseEnter={handleControlsMouseEnter}
                  onMouseLeave={handleControlsMouseLeave}
                >
                  <div className="bg-black/70 backdrop-blur rounded-lg p-2 flex items-center gap-2">
                    <button
                      onClick={handleZoomOut}
                      disabled={zoom <= 0.5}
                      className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50"
                    >
                      <ZoomOut size={20} />
                    </button>
                    <button
                      onClick={resetZoom}
                      className="p-2 text-white hover:bg-white/20 rounded"
                    >
                      <RefreshCw size={20} />
                    </button>
                    <button
                      onClick={handleZoomIn}
                      disabled={zoom >= 2}
                      className="p-2 text-white hover:bg-white/20 rounded disabled:opacity-50"
                    >
                      <ZoomIn size={20} />
                    </button>
                    {canDownload && (
                      <button
                        onClick={handleDownload}
                        className="p-2 text-white hover:bg-white/20 rounded"
                      >
                        <Download size={20} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceDetailPage;
