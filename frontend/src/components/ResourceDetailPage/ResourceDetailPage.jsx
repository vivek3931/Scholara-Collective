import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, FileText, FileQuestion, FileCheck2, GraduationCap,
  Calculator, Atom, Bookmark, FlaskConical, Download, Star, ExternalLink, ArrowLeft,
  Search, Send , Eye , X , ZoomOut , ZoomIn
} from 'lucide-react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faStar as faSolidStar } from "@fortawesome/free-solid-svg-icons";
import { faStar as faRegularStar } from "@fortawesome/free-regular-svg-icons";
import { useAuth } from '../../context/AuthContext/AuthContext';
import { debounce } from 'lodash';
import { Document, Page } from 'react-pdf';

const API_BASE_URL = 'http://localhost:5000/api';

// Utility functions remain unchanged
const getIconForType = (type, size = 20) => {
  switch (type) {
    case 'Notes': return <FileText size={size} className="text-blue-500 dark:text-blue-300" />;
    case 'Question Paper': return <FileQuestion size={size} className="text-purple-500 dark:text-purple-300" />;
    case 'Model Answer': return <FileCheck2 size={size} className="text-green-500 dark:text-green-300" />;
    case 'Revision Sheet': return <FileText size={size} className="text-teal-500 dark:text-teal-300" />;
    default: return <BookOpen size={size} className="text-gray-500 dark:text-gray-300" />;
  }
};

const getIconForSubject = (subject, size = 20) => {
  switch (subject) {
    case 'Mathematics': return <Calculator size={size} className="text-red-500 dark:text-red-300" />;
    case 'Physics': return <Atom size={size} className="text-indigo-500 dark:text-indigo-300" />;
    case 'Chemistry': return <FlaskConical size={size} className="text-emerald-500 dark:text-emerald-300" />;
    case 'English': return <Bookmark size={size} className="text-yellow-500 dark:text-yellow-300" />;
    default: return <BookOpen size={size} className="text-gray-500 dark:text-gray-300" />;
  }
};

// Enhanced StarRating Component with proper state management
const StarRating = ({ 
  rating = 0, 
  onRate, 
  editable = true, 
  starSize = 24, 
  showValue = false,
  isLoading = false,
  className = ""
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localRating, setLocalRating] = useState(rating);

  // Sync local rating when prop changes
  useEffect(() => {
    setLocalRating(rating);
  }, [rating]);

  const displayRating = hoverRating || localRating;

  const handleRate = async (starValue) => {
    if (!editable || isLoading || isSubmitting || !onRate) return;
    
    setLocalRating(starValue);
    setIsSubmitting(true);
    
    try {
      await onRate(starValue);
    } catch (error) {
      console.error('Error submitting rating:', error);
      setLocalRating(rating); // Revert on error
    } finally {
      setIsSubmitting(false);
    }
  };

  // Debounce the rate handler
  const debouncedRate = useCallback(debounce(handleRate, 300), [editable, isLoading, isSubmitting, onRate]);

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          type="button"
          className={`outline-none focus:outline-none transition-all duration-200
            ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
          onClick={() => debouncedRate(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          onMouseLeave={() => editable && setHoverRating(0)}
          disabled={!editable || isLoading || isSubmitting}
        >
          <FontAwesomeIcon
            icon={displayRating >= star ? faSolidStar : faRegularStar}
            className={`transition-colors duration-200
              ${displayRating >= star 
                ? 'text-yellow-400 dark:text-yellow-300' 
                : 'text-gray-300 dark:text-gray-600'
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
      {isSubmitting && (
        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
          Saving...
        </span>
      )}
    </div>
  );
};

// Comment Component remains unchanged
const Comment = ({ comment, onReply, currentUserId, userName, isSubmittingReply }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const formattedDate = comment.timestamp
    ? (new Date(comment.timestamp).toLocaleString())
    : 'N/A';

  const handleReplySubmit = async () => {
    if (!replyText.trim()) return;
    
    setIsLoading(true);
    try {
      await onReply(comment.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
    } catch (error) {
      console.error('Error submitting reply:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-onyx/70 p-4 rounded-lg mb-4 shadow-sm border border-gray-100 dark:border-charcoal">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-amber-600 dark:bg-amber-400 flex items-center justify-center text-white text-sm font-bold mr-3">
          {comment.userName ? comment.userName[0].toUpperCase() : 'U'}
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{comment.userName || 'Anonymous'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{formattedDate}</p>
        </div>
      </div>
      <p className="text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">{comment.text}</p>

      {currentUserId && (
        <button
          onClick={() => setShowReplyInput(!showReplyInput)}
          disabled={isLoading}
          className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mb-2 disabled:opacity-50"
        >
          {showReplyInput ? 'Cancel Reply' : 'Reply'}
        </button>
      )}

      <AnimatePresence>
        {showReplyInput && currentUserId && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 overflow-hidden"
          >
            <textarea
              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-charcoal text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 resize-none"
              rows="2"
              placeholder={`Replying to ${comment.userName}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isLoading}
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
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin size="sm" />
                ) : (
                  <Send size={16} />
                )}
                {isLoading ? 'Posting...' : 'Post Reply'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-8 mt-4 border-l-2 border-gray-200 dark:border-gray-700 pl-4">
          {comment.replies.map((reply, index) => (
            <div key={index} className="bg-gray-100 dark:bg-charcoal/80 p-3 rounded-lg mb-2 shadow-xs">
              <div className="flex items-center mb-1">
                <div className="w-6 h-6 rounded-full bg-blue-500 dark:bg-blue-300 flex items-center justify-center text-white text-xs font-bold mr-2">
                  {reply.userName ? reply.userName[0].toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{reply.userName || 'Anonymous'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {reply.timestamp ? new Date(reply.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{reply.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ResourceCommentsSection with proper polling
const ResourceCommentsSection = ({ resourceId, currentUserId, userName }) => {
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [errorComments, setErrorComments] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const { token, isAuthenticated } = useAuth();
  const pollIntervalRef = useRef(null);

  const refreshComments = useCallback(async (showLoading = false) => {
    if (!resourceId) return;
    
    if (showLoading) setIsLoadingComments(true);
    setErrorComments(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/comments`);
      if (!response.ok) throw new Error(`Failed to fetch comments: ${response.status}`);
      
      const data = await response.json();
      setComments(data.map(c => ({
        id: c._id,
        userId: c.postedBy._id,
        userName: c.postedBy.username,
        text: c.text,
        timestamp: c.createdAt,
        replies: c.replies ? c.replies.map(r => ({
          userId: r.postedBy._id,
          userName: r.postedBy.username,
          text: r.text,
          timestamp: r.createdAt,
        })) : [],
      })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error("Error fetching comments:", err);
      setErrorComments("Failed to load comments.");
    } finally {
      if (showLoading) setIsLoadingComments(false);
    }
  }, [resourceId]);

  useEffect(() => {
    if (resourceId) {
      refreshComments(true);
      pollIntervalRef.current = setInterval(() => refreshComments(false), 15000);
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [resourceId, refreshComments]);

  const handleCommentSubmit = async () => {
    if (!isAuthenticated || !resourceId || !newCommentText.trim()) {
      setErrorComments("You must be logged in and provide comment text.");
      return;
    }
    
    setIsSubmittingComment(true);
    setErrorComments(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newCommentText.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to post comment: ${response.status}`);
      }
      
      setNewCommentText('');
      await refreshComments(false);
    } catch (e) {
      console.error("Error adding comment:", e);
      setErrorComments(`Failed to post comment: ${e.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (commentId, replyText) => {
    if (!isAuthenticated || !resourceId || !commentId || !replyText.trim()) {
      setErrorComments("You must be logged in and provide reply text.");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: replyText.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || `Failed to post reply: ${response.status}`);
      }
      
      await refreshComments(false);
    } catch (e) {
      console.error("Error adding reply:", e);
      setErrorComments(`Failed to post reply: ${e.message}`);
    }
  };

  if (isLoadingComments) {
    return (
      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-charcoal">
        <div className="flex items-center justify-center py-8">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-amber-600 dark:text-amber-200" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading comments...</span>
        </div>
      </div>
    );
  }
   return (
    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-charcoal">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h2>

      {errorComments && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 dark:bg-red-950 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4"
        >
          <strong className="font-bold">Error: </strong>
          <span>{errorComments}</span>
        </motion.div>
      )}

      {isAuthenticated ? (
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-3">Leave a Comment</h3>
          <textarea
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-charcoal bg-white dark:bg-onyx/80 text-gray-800 dark:text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-200 transition-all duration-200 resize-none"
            rows="4"
            placeholder="Share your thoughts about this resource..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={isSubmittingComment}
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {newCommentText.length}/1000 characters
            </span>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCommentSubmit}
              disabled={!newCommentText.trim() || isSubmittingComment}
              className="px-6 py-3 bg-amber-600 text-white rounded-lg shadow-md hover:bg-amber-700 transition-colors duration-300 flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <Send size={20} />
              )}
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </motion.button>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 dark:bg-onyx/50 rounded-lg border border-gray-200 dark:border-charcoal">
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to post comments and engage with the community.
          </p>
        </div>
      )}

      {comments.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-2">
            <Send size={48} className="mx-auto mb-4" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-lg">No comments yet.</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Comment
                  comment={comment}
                  onReply={handleReplySubmit}
                  currentUserId={currentUserId}
                  userName={userName}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

// Main ResourceDetailPage Component with all fixes
const ResourceDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resourceId } = useParams();
  const { user, token, isAuthenticated } = useAuth();
  const { resource: initialResourceFromState } = location.state || {};

  const [resource, setResource] = useState(initialResourceFromState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [overallRating, setOverallRating] = useState(0);
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const pollIntervalRef = useRef(null);

  // PDF Preview states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showModal , setSetModal] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [previewDataUrl, setPreviewDataUrl] = useState(null);
  const previewContainerRef = useRef(null);

  const userId = user?._id;
  const userName = user?.username || 'Anonymous User';

  // Fetch resource details
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
        let fetchedResource;
        if (!initialResourceFromState || initialResourceFromState._id !== resourceId) {
          const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`);
          if (!response.ok) throw new Error(`Failed to fetch resource: ${response.status}`);
          fetchedResource = await response.json();
          setResource(fetchedResource.resource || fetchedResource);
        } else {
          setResource(initialResourceFromState);
        }
      } catch (err) {
        console.error("Error fetching resource:", err);
        setError(`Failed to load resource: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadResource();
  }, [resourceId, initialResourceFromState]);

  // Fetch and poll ratings
  const refreshRatings = useCallback(async () => {
    if (!resourceId) return;

    setIsRatingLoading(true);
    try {
      const url = `${API_BASE_URL}/resources/${resourceId}/ratings${userId ? `?userId=${userId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to fetch ratings: ${response.status}`);

      const data = await response.json();

      setOverallRating(prev => data.overallRating !== undefined ? data.overallRating : prev);
      if (userId) {
        setUserRating(prev => data.userRating !== undefined ? data.userRating : prev);
      }
    } catch (err) {
      console.error("Error fetching ratings:", err);
    } finally {
      setIsRatingLoading(false);
    }
  }, [resourceId, userId]);

  useEffect(() => {
    if (resourceId) {
      refreshRatings();
      pollIntervalRef.current = setInterval(refreshRatings, 30000);
      return () => clearInterval(pollIntervalRef.current);
    }
  }, [resourceId, refreshRatings]);

  // Handle rating submission
  const handleRate = async (value) => {
    if (!isAuthenticated || !resourceId) {
      setError("Please login to rate");
      return;
    }

    const previousRating = userRating;
    setUserRating(value);

    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      setUserRating(previousRating);
    }
  };

  // PDF Preview functions
  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setPreviewLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error("Error loading PDF document:", error);
    setPreviewError("Failed to load PDF preview. Please try downloading the file.");
    setPreviewLoading(false);
  }, []);

  const handlePreview = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to preview resources.",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel"
      });
      return;
    }

    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/preview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch preview');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setPreviewDataUrl(url);
    } catch (err) {
      console.error("Preview failed:", err);
      setPreviewError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreviewModal = useCallback(() => {
    setShowPreviewModal(false);
    if (previewDataUrl) {
      URL.revokeObjectURL(previewDataUrl);
      setPreviewDataUrl(null);
    }
  }, [previewDataUrl]);

  const changePage = useCallback((offset) => {
    setPageNumber(prev => Math.max(1, Math.min(prev + offset, numPages)));
  }, [numPages]);

  const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 0.1, 3)), []);
  const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 0.1, 0.5)), []);

  const handleDownload = async () => {
    if (!isAuthenticated) {
      showModal({
        type: "warning",
        title: "Authentication Required",
        message: "You need to be logged in to download resources.",
        confirmText: "Go to Login",
        onConfirm: () => navigate('/login'),
        cancelText: "Cancel"
      });
      return;
    }

    try {
      // Track download
      await fetch(`${API_BASE_URL}/resources/${resourceId}/increment-download`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Initiate download
      const link = document.createElement('a');
      link.href = resource.fileUrl;
      link.download = resource.title.replace(/[^a-z0-9]/gi, '_') + '.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to initiate download. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-onyx">
        <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-blue-500" />
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50 dark:bg-onyx">
        <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Error</h2>
        <p className="text-lg mb-6 text-gray-700 dark:text-gray-300">{error || "Resource not found"}</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600"
        >
          Go to Home
        </button>
      </div>
    );
  }

  const { title, description, type, course, subject, fileUrl, previewUrl, downloads = 0 } = resource;
  const isPDF = previewUrl && previewUrl.toLowerCase().endsWith('.pdf');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-100 dark:bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx py-20 px-4 sm:px-6 lg:px-8"
    >
      <button
        onClick={() => navigate(-1)}
        className="fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 bg-white dark:bg-charcoal/50 duration-200 hover:scale-105 rounded-md hover:bg-gray-200 dark:hover:bg-charcoal/80 text-gray-700 shadow-glow-sm dark:text-gray-300"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="max-w-6xl mx-auto bg-white dark:bg-onyx/60 rounded-2xl  shadow-xl overflow-hidden md:flex">
        {/* Left Section - PDF Preview */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-charcoal min-h-[500px]">
          {isPDF ? (
            <div className="w-full h-full flex flex-col items-center">
              <Document
                file={previewUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center h-full">
                    <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500" />
                  </div>
                }
                className="w-full h-full border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <Page
                  pageNumber={pageNumber}
                  width={500}
                  className="shadow-lg"
                />
              </Document>
              {numPages > 1 && (
                <div className="flex items-center gap-4 mt-4">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-gray-700 dark:text-gray-300">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    className="p-2 rounded-full bg-gray-200 dark:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-32 h-32 flex items-center justify-center text-blue-500 dark:text-blue-400 mb-4">
                {getIconForType(type, 64)}
              </div>
              <p className="text-gray-600 dark:text-gray-400">Preview not available for this file type</p>
              <button
                onClick={handlePreview}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md flex items-center gap-2 hover:bg-blue-600"
              >
                <Eye size={16} />
                Try Preview
              </button>
            </div>
          )}
        </div>

        {/* Right Section - Details */}
        <div className="md:w-1/2 p-6 md:p-8">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-4"
          >
            {title}
          </motion.h1>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full">
              <GraduationCap size={16} />
              <span>{course}</span>
            </div>
            <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full">
              {getIconForSubject(subject, 16)}
              <span>{subject}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-charcoal text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full">
              <span>{type}</span>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed"
          >
            {description || "No description provided for this resource."}
          </motion.p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-white dark:bg-charcoal p-4 rounded-xl shadow-inner"
            >
              <Star size={24} className="text-yellow-500" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Overall Rating</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {overallRating.toFixed(1)} / 5
                  </p>
                  {isRatingLoading && (
                    <FontAwesomeIcon icon={faSpinner} spin size="sm" className="text-blue-500" />
                  )}
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-3 bg-white dark:bg-charcoal p-4 rounded-xl shadow-inner"
            >
              <Download size={24} className="text-green-500" />
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Downloads</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {downloads.toLocaleString()}
                </p>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {previewUrl && (
              <motion.button
                onClick={handlePreview}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-xl shadow-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                Preview Resource
              </motion.button>
            )}
            {fileUrl && (
              <motion.button
                onClick={handleDownload}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 bg-green-500 text-white py-3 px-6 rounded-xl shadow-lg hover:bg-green-600 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download
              </motion.button>
            )}
          </div>

          {/* Rating Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rate This Resource</h2>
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-charcoal rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Logged in as: <span className="font-semibold text-blue-500 dark:text-blue-400">{userName}</span>
                  </p>
                  <div className="flex items-center gap-4">
                    <StarRating
                      rating={userRating}
                      onRate={handleRate}
                      editable={true}
                      starSize={20}
                      showValue={true}
                      isLoading={isRatingLoading}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {userRating > 0 ? 'Click stars to change your rating' : 'Click stars to rate this resource'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Please log in to rate this resource and share your feedback.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Fullscreen PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-onyx/60 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PDF Preview</h3>
              <button onClick={handleClosePreviewModal} className="p-2 text-gray-700 dark:text-gray-300">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto scroll-container backdrop-blur-sm p-4">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-500" />
                </div>
              ) : previewError ? (
                <div className="text-center text-red-600 dark:text-red-400 p-4">
                  {previewError}
                </div>
              ) : (
                <Document
                  file={previewDataUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  className="w-full"
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={zoom}
                    className="shadow-lg mx-auto"
                  />
                </Document>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="p-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  <ZoomOut size={20} />
                </button>
                <span className="mx-2 text-gray-900 dark:text-white">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="p-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                >
                  <ZoomIn size={20} />
                </button>
              </div>
              {numPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => changePage(-1)}
                    disabled={pageNumber <= 1}
                    className="p-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-gray-900 dark:text-white">
                    Page {pageNumber} of {numPages}
                  </span>
                  <button
                    onClick={() => changePage(1)}
                    disabled={pageNumber >= numPages}
                    className="p-2 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              <button
                onClick={handleDownload}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Comments Section */}
      <div className="max-w-6xl p-4 lg:p-12 mx-auto bg-white dark:bg-onyx/60 rounded-2xl shadow-xl overflow-hidden mt-8">
        <ResourceCommentsSection
          resourceId={resourceId}
          currentUserId={userId}
          userName={userName}
        />
      </div>
    </motion.div>
  );
};

export default ResourceDetailPage;