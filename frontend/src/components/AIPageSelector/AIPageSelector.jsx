import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  FileText,
  HelpCircle,
  Check,
  X,
  ChevronDown,
  Loader2,
  Copy,
  AlertTriangle,
  ArrowLeft,
  Menu,
  ChevronUp,
} from "lucide-react";
import { Document, Page } from "react-pdf";
import * as pdfjsLib from "pdfjs-dist";
import { useTheme } from "../../context/ThemeProvider/ThemeProvider.jsx";
import { useModal } from "../../context/ModalContext/ModalContext.jsx";
import { useInView } from "react-intersection-observer";
import { createPortal } from "react-dom";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error: error.message };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="p-4 bg-red-50/95 dark:bg-red-900/30 backdrop-blur-lg text-red-600 dark:text-red-400 rounded-xl shadow-glow-sm border border-red-200/50 dark:border-red-800/50">
          <h3 className="font-poppins font-semibold">
            Error: {this.state.error}
          </h3>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AI_API_URL = import.meta.env.VITE_AI_SERVICE_KEY || "http://localhost:8000";

const extractTextFromPdfPages = async (pdfDataUrl, selectedPages, onProgress) => {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfDataUrl);
    const pdf = await loadingTask.promise;

    const extractedTexts = {};
    const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);

    for (let i = 0; i < pagesArray.length; i++) {
      const pageNum = pagesArray[i];
      onProgress(`Extracting text from page ${pageNum} (${i + 1}/${pagesArray.length})...`);

      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .filter((item) => item.str && item.str.trim())
          .map((item) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        extractedTexts[pageNum] = pageText && pageText.length > 10
          ? pageText
          : "[Limited text content available]";
      } catch (pageError) {
        console.error(`Error extracting text from page ${pageNum}:`, pageError);
        extractedTexts[pageNum] = "[Text extraction failed for this page]";
      }
    }

    if (
      Object.values(extractedTexts).every(
        (text) =>
          text.includes("[Limited") || text.includes("[Text extraction failed")
      )
    ) {
      throw new Error(
        "Insufficient text extracted from selected pages. Please try pages with more readable content."
      );
    }

    return extractedTexts;
  } catch (error) {
    console.error("PDF text extraction error:", error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
};

const processAITask = async (extractedTexts, task, selectedPages, onProgress) => {
  try {
    const pageResults = {};
    const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);

    // Parallelize AI calls for smoother/faster processing
    const aiPromises = pagesArray.map(async (pageNum, index) => {
      onProgress(`AI processing page ${pageNum} (${index + 1}/${pagesArray.length})...`);
      const text = extractedTexts[pageNum];

      const response = await fetch(`${AI_API_URL}/ai/process-pages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          extractedText: text,
          task,
          selectedPages: [pageNum],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            `Server error for page ${pageNum}: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      if (!data.result) {
        throw new Error(
          `No result received from AI processing for page ${pageNum}`
        );
      }

      return { pageNum, result: data.result };
    });

    const results = await Promise.allSettled(aiPromises);

    results.forEach((res) => {
      if (res.status === "fulfilled") {
        pageResults[res.value.pageNum] = res.value.result;
      } else {
        console.error(`AI processing failed for a page:`, res.reason);
        // Handle partial failures gracefully
        pageResults[res.reason.pageNum || 'unknown'] = "[AI processing failed]";
      }
    });

    return pageResults;
  } catch (error) {
    console.error("AI processing API error:", error);

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(
        "Unable to connect to AI service. Please check your internet connection."
      );
    }

    throw error;
  }
};

const aiTasks = [
  {
    value: "summarize",
    label: "Summarize",
    icon: <FileText size={16} />,
    description: "Create concise bullet points for study revision",
    color: "from-amber-500 to-orange-400",
  },
  {
    value: "questions",
    label: "Generate Questions",
    icon: <HelpCircle size={16} />,
    description: "Create exam-style questions from content",
    color: "from-amber-600 to-orange-500",
  },
];

// Completely isolated dropdown component using React Portal
const PortalDropdown = ({ isOpen, onClose, onTaskSelect, buttonRef }) => {
  const [position, setPosition] = useState({ top: 0, right: 0 });
  
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 16, // Match original spacing
        right: window.innerWidth - rect.right // Right-aligned like original
      });
    }
  }, [isOpen, buttonRef]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClick = (e) => {
      if (!buttonRef.current?.contains(e.target)) {
        onClose();
      }
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[99999]" 
      style={{ pointerEvents: 'none' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute w-64 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 py-2 overflow-hidden"
        style={{
          top: position.top,
          right: position.right,
          pointerEvents: 'auto'
        }}
      >
        {aiTasks.map((task, index) => (
          <motion.div
            key={task.value}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-onyx/50 transition-colors duration-200 text-left cursor-pointer"
            onClick={() => {
              onTaskSelect(task.value);
              onClose();
            }}
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br ${task.color} text-white`}>
              {task.icon}
            </div>
            <div className="flex-1">
              <h4 className="font-medium font-poppins text-sm text-gray-900 dark:text-gray-100">
                {task.label}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">{task.description}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>,
    document.body
  );
};

const AIPageSelector = ({
  previewDataUrl,
  numPages,
  currentPage,
  pdfDimensions,
  zoom,
  onClose,
  isFullscreen,
  isMobile
}) => {
  const { isDarkMode } = useTheme();
  const { showModal } = useModal();
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPage, setProcessingPage] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [overallProgress, setOverallProgress] = useState(0);
  const [aiResult, setAiResult] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [viewMode, setViewMode] = useState("pdf"); // 'pdf' or 'annotated'

  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const aiModeRef = useRef(null);

  useEffect(() => {
    if (previewDataUrl) {
      setIsLoading(false);
    }
  }, [previewDataUrl]);
  
  const resetAIMode = useCallback(() => {
    setIsAIMode(false);
    setSelectedTask("");
    setSelectedPages(new Set());
    setError("");
    setAiResult({});
    setExtractionProgress("");
    setIsProcessing(false);
    setProcessingPage(null);
    setOverallProgress(0);
    setIsHeaderExpanded(false);
    setViewMode("pdf");
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.style.scrollBehavior = 'smooth';
    container.style.overscrollBehavior = 'contain';
    container.style.webkitOverflowScrolling = 'touch';
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (aiModeRef.current && !aiModeRef.current.contains(event.target)) {
        resetAIMode();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [aiModeRef, resetAIMode]);

  const handleTaskSelect = useCallback((taskValue) => {
    setSelectedTask(taskValue);
    setIsAIMode(true);
    setSelectedPages(new Set());
    setError("");
    setAiResult({});
    setIsHeaderExpanded(false);
    setViewMode("pdf");
  }, []);

  const handlePageClick = useCallback(
    (pageNum) => {
      if (!isAIMode || isProcessing || viewMode === "annotated") return;

      setSelectedPages((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(pageNum)) {
          newSet.delete(pageNum);
        } else {
          if (newSet.size >= 10) {
            showModal({
              type: "error",
              title: "Selection Limit Reached",
              message: "Maximum 10 pages can be selected at once.",
            });
            return prev;
          }
          newSet.add(pageNum);
        }
        setError("");
        return newSet;
      });
    },
    [isAIMode, isProcessing, showModal, viewMode]
  );

  const handleProcessPages = async () => {
    if (selectedPages.size === 0) {
      showModal({
        type: "error",
        title: "No Pages Selected",
        message: "Please select at least one page to process.",
      });
      return;
    }
    if (selectedPages.size > 10) {
      showModal({
        type: "error",
        title: "Too Many Pages",
        message: "Please select no more than 10 pages at once.",
      });
      return;
    }
    setIsProcessing(true);
    setError("");
    setExtractionProgress("Preparing PDF extraction...");
    setOverallProgress(0);

    try {
      const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);
      const totalSteps = pagesArray.length * 2; // Extraction + AI per page

      const onProgress = (message) => {
        setExtractionProgress(message);
        setOverallProgress((prev) => Math.min(prev + (100 / totalSteps), 100));
      };

      const extractedTexts = await extractTextFromPdfPages(
        previewDataUrl,
        selectedPages,
        onProgress
      );

      const pageResults = await processAITask(
        extractedTexts,
        selectedTask,
        selectedPages,
        onProgress
      );
      setAiResult(pageResults);
      setViewMode("annotated");
      setExtractionProgress("");
      setOverallProgress(100);

      if (
        Object.values(pageResults).every((result) => result.includes("[No "))
      ) {
        showModal({
          type: "warning",
          title: "No Summaries Generated",
          message:
            "The AI could not generate summaries for the selected pages. Please check the console logs for backend responses or try different pages.",
        });
      }
    } catch (err) {
      console.error("AI processing error:", err);
      setError(err.message || "Failed to process pages. Please try again.");
      setExtractionProgress("");
      showModal({
        type: "error",
        title: "Processing Failed",
        message: err.message || "Failed to process pages. Please try again.",
      });
    } finally {
      setIsProcessing(false);
      setProcessingPage(null);
    }
  };

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "pdf" ? "annotated" : "pdf"));
  }, []);

  const copyToClipboard = async () => {
    try {
      const textToCopy = Object.entries(aiResult)
        .map(([page, text]) => `Page ${page}:\n${text}`)
        .join("\n\n");
      await navigator.clipboard.writeText(textToCopy);
      showModal({
        type: "success",
        title: "Copied to Clipboard",
        message:
          "The AI result has been successfully copied to your clipboard.",
      });
    } catch (err) {
      console.error("Failed to copy text:", err);
      showModal({
        type: "error",
        title: "Copy Failed",
        message: "Failed to copy the result to clipboard. Please try again.",
      });
    }
  };

  const PageWithLazyLoading = ({ pageNumber, renderPDFPageWithSelection }) => {
    const { ref, inView } = useInView({
      triggerOnce: false,
      threshold: 0.1,
      rootMargin: "500px 0px",
    });

    const [hasLoaded, setHasLoaded] = useState(false);
    
    useEffect(() => {
      if (inView && !hasLoaded) {
        setHasLoaded(true);
      }
    }, [inView, hasLoaded]);

    return (
      <motion.div
        ref={ref}
        className="mb-8"
        style={{ 
          willChange: 'transform, opacity',
          contain: 'layout style paint',
          isolation: 'isolate'
        }}
        layout
        transition={{
          layout: { duration: 0.3, ease: "easeOut" },
          opacity: { duration: 0.2 }
        }}
      >
        <AnimatePresence mode="wait">
          {(inView || hasLoaded) ? (
            <motion.div
              key={`page-${pageNumber}-content`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderPDFPageWithSelection(pageNumber)}
            </motion.div>
          ) : (
            <motion.div
              key={`page-${pageNumber}-skeleton`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              style={{
                height: pdfDimensions?.height * zoom || 600,
                width: pdfDimensions?.width * zoom || 450,
              }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-onyx/50 dark:to-charcoal/50 rounded-xl shadow-lg mx-auto"
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  const selectedTaskObj = aiTasks.find((t) => t.value === selectedTask);

  const renderPDFPageWithSelection = useCallback(
    (pageNumber) => {
      const isSelected = selectedPages.has(pageNumber);
      const isSelectable = isAIMode && !isProcessing && viewMode === "pdf";
      const isBeingProcessed = isProcessing && isSelected;
      const showResult =
        viewMode === "annotated" && aiResult[pageNumber] && isSelected;

      return (
        <div
          key={`ai-page-${pageNumber}`}
          className={`relative mb-8 flex justify-center transition-all duration-300 ease-out ${
            isSelectable ? "cursor-pointer" : ""
          }`}
          onClick={() => isSelectable && handlePageClick(pageNumber)}
          role="button"
          tabIndex={isSelectable ? 0 : -1}
          onKeyDown={(e) =>
            isSelectable &&
            (e.key === "Enter" || e.key === " ") &&
            handlePageClick(pageNumber)
          }
          aria-label={`Select page ${pageNumber} for AI processing`}
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)'
          }}
        >
          <AnimatePresence mode="wait">
            {isAIMode && viewMode === "pdf" && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`absolute inset-0 z-10 rounded-xl border-4 transition-all duration-500 ease-out ${
                  isSelected
                    ? isBeingProcessed
                      ? "border-amber-500 bg-amber-500/20 shadow-2xl shadow-amber-500/40"
                      : "border-green-500 bg-green-500/15 shadow-2xl shadow-green-500/30"
                    : isSelectable
                    ? "border-transparent hover:border-amber-400 hover:bg-amber-400/10"
                    : "border-gray-300 dark:border-charcoal/50 bg-gray-100/20 dark:bg-onyx/20"
                }`}
                style={{
                  borderRadius: '12px',
                  willChange: 'border-color, background-color, box-shadow'
                }}
              >
                <motion.div
                  className={`absolute top-3 left-3 px-3 py-1.5 rounded-full text-sm font-medium font-poppins transition-all duration-300 ${
                    isSelected
                      ? isBeingProcessed
                        ? "bg-amber-500 text-white shadow-xl"
                        : "bg-green-500 text-white shadow-xl"
                      : "bg-black/80 dark:bg-onyx/80 text-white"
                  }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {pageNumber}
                </motion.div>
                
                <AnimatePresence>
                  {isSelected && !isBeingProcessed && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-xl"
                    >
                      <Check size={16} className="text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {isBeingProcessed && (
                    <motion.div
                      key="processing-overlay"
                      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/30 to-orange-400/30 backdrop-blur-sm rounded-xl overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                      <motion.div
                        className="relative w-20 h-20 flex items-center justify-center"
                        animate={{
                          scale: [1, 1.05, 1],
                          rotate: [0, 360],
                        }}
                        transition={{
                          scale: {
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          },
                          rotate: {
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                          },
                        }}
                      >
                        <motion.div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: 'conic-gradient(from 0deg, #f59e0b 0%, #fb923c 25%, transparent 25%, transparent 100%)',
                          }}
                          animate={{ rotate: [0, 360] }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <motion.div
                          className="absolute inset-2 rounded-full bg-white/80 dark:bg-charcoal/80"
                        />
                        <motion.div
                          className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-2xl"
                          animate={{
                            scale: [1, 1.1, 1],
                            boxShadow: [
                              "0 0 20px rgba(245, 158, 11, 0.5)",
                              "0 0 30px rgba(245, 158, 11, 0.7)",
                              "0 0 20px rgba(245, 158, 11, 0.5)",
                            ],
                          }}
                          transition={{
                            scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                            boxShadow: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                          }}
                        >
                          <Sparkles className="text-white" size={24} />
                        </motion.div>
                        <motion.div
                          className="absolute inset-0"
                          animate={{
                            opacity: [0.3, 0.6, 0.3],
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut",
                          }}
                          style={{
                            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%)',
                          }}
                        />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            className={`bg-white rounded-xl border border-gray-200/50 shadow-lg overflow-hidden`}
            style={{
              width: "100%",
              maxWidth: pdfDimensions?.width * zoom || "100%",
              height: pdfDimensions?.height * zoom || "auto",
            }}
            animate={{
              scale: isSelected ? 1.02 : 1,
              boxShadow: isSelected 
                ? "0 25px 50px -12px rgba(245, 158, 11, 0.25)" 
                : "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
            }}
            transition={{ 
              duration: 0.3, 
              ease: "easeOut",
              layout: { duration: 0.2 }
            }}
            layout
          >
            <AnimatePresence mode="wait">
              {showResult ? (
                <motion.div
                  key="ai-result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="p-6 overflow-y-auto bg-white"
                  style={{
                    width: pdfDimensions?.width * zoom,
                    height: pdfDimensions?.height * zoom,
                    scrollBehavior: "smooth",
                  }}
                >
                  <motion.div 
                    className="border-b border-gray-200 pb-3 mb-4"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                  >
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`w-8 h-8 bg-gradient-to-br ${
                          selectedTaskObj?.color || "from-amber-500 to-orange-400"
                        } rounded-md flex items-center justify-center shadow-sm`}
                        whileHover={{ scale: 1.05 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        {selectedTaskObj?.icon || (
                          <Sparkles className="text-white" size={16} />
                        )}
                      </motion.div>
                      <div>
                        <h2 className="text-lg font-semibold font-poppins text-gray-900">
                          AI {selectedTaskObj?.label} - Page {pageNumber}
                        </h2>
                        <p className="text-xs text-gray-500">
                          Generated on {new Date().toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  <motion.div 
                    className="prose max-w-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                  >
                    <div
                      className="text-gray-800 leading-relaxed font-poppins text-sm"
                      style={{ lineHeight: "1.8", fontSize: "14px" }}
                      dangerouslySetInnerHTML={{
                        __html: aiResult[pageNumber]
                          .replace(
                            /\*\*(.*?)\*\*/g,
                            '<strong class="text-gray-900">$1</strong>'
                          )
                          .replace(
                            /•/g,
                            '<span class="text-amber-600 mr-2">•</span>'
                          )
                          .replace(
                            /(\n\s*[-•])/g,
                            '<br><span class="text-amber-600 mr-2">•</span>'
                          )
                          .replace(/\n/g, "<br>"),
                      }}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  key="pdf-page"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)'
                  }}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={pdfDimensions?.width || 500}
                    scale={zoom || 1}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="flex items-center justify-center h-full bg-gray-100/95 transition-opacity duration-500">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader2 className="text-gray-400" size={24} />
                        </motion.div>
                      </div>
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      );
    },
    [
      selectedPages,
      isAIMode,
      isProcessing,
      handlePageClick,
      pdfDimensions,
      zoom,
      viewMode,
      aiResult,
      selectedTaskObj,
    ]
  );

  return (
    <ErrorBoundary>
      <div
  className={`w-full scroll-container flex flex-col relative bg-gray-100/95 dark:bg-onyx/95 rounded-lg
    ${
      isFullscreen
        ? "h-screen" // fullscreen always wins
        : isMobile
        ? "h-[448px]" // mobile default
        : "h-[648px]" // desktop default
    }
  `}
  ref={containerRef}
>

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Loader2
                className="animate-spin text-amber-600 dark:text-amber-400"
                size={48}
              />
            </motion.div>
          </div>
        ) : (
          <>
            <Header
              isAIMode={isAIMode}
              isProcessing={isProcessing}
              selectedPages={selectedPages}
              selectedTaskObj={selectedTaskObj}
              viewMode={viewMode}
              isHeaderExpanded={isHeaderExpanded}
              handleTaskSelect={handleTaskSelect}
              handleProcessPages={handleProcessPages}
              resetAIMode={resetAIMode}
              toggleViewMode={toggleViewMode}
              copyToClipboard={copyToClipboard}
              onClose={onClose}
              extractionProgress={extractionProgress}
              overallProgress={overallProgress}
              error={error}
              setIsHeaderExpanded={setIsHeaderExpanded}
            />
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scroll-container will-change-transform z-[1]"
            >
              <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-4">
                <div className="max-w-full sm:max-w-4xl mx-auto">
                  {previewDataUrl && (
                    <div className="pdf-document">
                      <Document
                        file={previewDataUrl}
                        loading={
                          <div className="flex items-center justify-center py-20">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                            >
                              <Loader2
                                className="text-amber-600 dark:text-amber-400"
                                size={32}
                              />
                            </motion.div>
                            <span className="ml-3 text-gray-600 dark:text-gray-400 font-poppins">
                              Loading PDF...
                            </span>
                          </div>
                        }
                      >
                        <motion.div
                          className="space-y-8"
                          style={{ 
                            willChange: 'transform',
                            contain: 'layout style paint'
                          }}
                          layout
                          transition={{
                            layout: { 
                              type: "spring",
                              stiffness: 100,
                              damping: 20,
                              mass: 0.8
                            }
                          }}
                        >
                          <AnimatePresence mode="sync">
                            {Array.from({ length: numPages }, (_, i) => i + 1).map(
                              (pageNumber) => (
                                <PageWithLazyLoading
                                  key={`ai-page-${pageNumber}`}
                                  pageNumber={pageNumber}
                                  renderPDFPageWithSelection={
                                    renderPDFPageWithSelection
                                  }
                                />
                              )
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </Document>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

// Extracted Header Component to isolate state - PORTAL VERSION
const Header = React.memo(({
  isAIMode,
  isProcessing,
  selectedPages,
  selectedTaskObj,
  viewMode,
  isHeaderExpanded,
  handleTaskSelect,
  handleProcessPages,
  resetAIMode,
  toggleViewMode,
  copyToClipboard,
  onClose,
  extractionProgress,
  overallProgress,
  error,
  setIsHeaderExpanded
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const buttonRef = useRef(null);

  return (
    <div className="bg-white/95 rounded-t-md dark:bg-charcoal/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-charcoal/50 shadow-sm">
      <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-onyx/50 rounded-lg transition-colors duration-200"
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg flex items-center justify-center shadow-glow-sm">
                <Sparkles className="text-white" size={14} />
              </div>
              <div>
                <h1 className="font-semibold font-poppins text-gray-900 dark:text-gray-200 text-sm">
                  AI Tools
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  {viewMode === "pdf"
                    ? "Select pages to process"
                    : "Viewing AI results on pages"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAIMode ? (
              <div className="relative">
                <button
                  ref={buttonRef}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs sm:text-sm"
                  aria-label="Open AI task menu"
                >
                  <Sparkles size={12} className="sm:size-6" />
                  <span className="hidden xs:inline">Choose Task</span>
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <PortalDropdown 
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                  onTaskSelect={handleTaskSelect}
                  buttonRef={buttonRef}
                />
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  <button
                    onClick={() =>
                      setIsHeaderExpanded(!isHeaderExpanded)
                    }
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-onyx/50 rounded-lg transition-colors duration-200"
                    aria-label={
                      isHeaderExpanded ? "Collapse menu" : "Expand menu"
                    }
                  >
                    {isHeaderExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <Menu size={16} />
                    )}
                  </button>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-amber-50/95 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                    <div
                      className={`w-6 h-6 bg-gradient-to-br ${
                        selectedTaskObj?.color ||
                        "from-amber-500 to-orange-400"
                      } rounded-lg flex items-center justify-center shadow-glow-sm`}
                    >
                      {selectedTaskObj?.icon || (
                        <Sparkles className="text-white" size={12} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold font-poppins text-gray-900 dark:text-gray-200 text-sm truncate">
                        {selectedTaskObj?.label}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {viewMode === "pdf"
                          ? `${selectedPages.size} selected`
                          : "Results on pages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {viewMode === "pdf" ? (
                      <>
                        <button
                          onClick={handleProcessPages}
                          disabled={
                            selectedPages.size === 0 || isProcessing
                          }
                          className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          aria-label="Process selected pages"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2
                                size={12}
                                className="animate-spin"
                              />
                              <span className="hidden sm:inline">
                                Processing...
                              </span>
                            </>
                          ) : (
                            <>
                              <Check size={12} />
                              <span className="hidden sm:inline">
                                Process
                              </span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetAIMode}
                          disabled={isProcessing}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 disabled:opacity-50 text-xs"
                          aria-label="Cancel AI mode"
                        >
                          <X size={12} />
                          <span className="hidden sm:inline">
                            Cancel
                          </span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={toggleViewMode}
                          className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs"
                          aria-label="View original PDF"
                        >
                          <FileText size={12} />
                          <span className="hidden sm:inline">
                            View Original
                          </span>
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs"
                          aria-label="Copy result"
                        >
                          <Copy size={12} />
                          <span className="hidden sm:inline">Copy</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="md:hidden">
          <AnimatePresence>
            {isAIMode && isHeaderExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <div className="flex flex-col gap-2 pb-2">
                  <div className="flex items-center gap-2 bg-amber-50/95 dark:bg-amber-900/20 p-2 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
                    <div
                      className={`w-8 h-8 bg-gradient-to-br ${
                        selectedTaskObj?.color ||
                        "from-amber-500 to-orange-400"
                      } rounded-lg flex items-center justify-center shadow-glow-sm`}
                    >
                      {selectedTaskObj?.icon || (
                        <Sparkles className="text-white" size={16} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold font-poppins text-gray-900 dark:text-gray-200 text-sm">
                        {selectedTaskObj?.label} Pages
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {viewMode === "pdf"
                          ? `${selectedPages.size} page${
                              selectedPages.size !== 1 ? "s" : ""
                            } selected (max 10)`
                          : "Results on pages"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {viewMode === "pdf" ? (
                      <>
                        <button
                          onClick={handleProcessPages}
                          disabled={
                            selectedPages.size === 0 || isProcessing
                          }
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                          aria-label="Process selected pages"
                        >
                          {isProcessing ? (
                            <>
                              <Loader2
                                size={14}
                                className="animate-spin"
                              />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check size={14} />
                              Process
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetAIMode}
                          disabled={isProcessing}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 disabled:opacity-50 text-xs"
                          aria-label="Cancel AI mode"
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={toggleViewMode}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs"
                          aria-label="View original PDF"
                        >
                          <FileText size={14} />
                          View Original
                        </button>
                        <button
                          onClick={copyToClipboard}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs"
                          aria-label="Copy result"
                        >
                          <Copy size={14} />
                          Copy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {isProcessing && extractionProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 p-2 bg-amber-50/95 dark:bg-amber-900/30 backdrop-blur-lg border border-amber-200/50 dark:border-amber-800/50 rounded-xl"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Loader2
                    size={14}
                    className="animate-spin text-amber-600 dark:text-amber-400"
                  />
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-poppins">
                    {extractionProgress}
                  </p>
                </div>
                <motion.div
                  className="h-1 bg-amber-200 rounded-full overflow-hidden"
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="h-full"
                    style={{
                      background: 'linear-gradient(45deg, #f59e0b 25%, #fb923c 25%, #fb923c 50%, #f59e0b 50%, #f59e0b 75%, #fb923c 75%, #fb923c)',
                      backgroundSize: '200% 200%'
                    }}
                    initial={{ width: "0%", backgroundPosition: '0% 50%' }}
                    animate={{ width: `${overallProgress}%`, backgroundPosition: ['0% 50%', '100% 50%'] }}
                    transition={{
                      width: { duration: 0.8, ease: "easeInOut" },
                      backgroundPosition: { duration: 4, repeat: Infinity, ease: "linear" }
                    }}
                  />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {error && !isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-2 p-2 bg-red-50/95 dark:bg-red-900/30 backdrop-blur-lg border border-red-200/50 dark:border-red-800/50 rounded-xl"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  size={14}
                  className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                />
                <p className="text-xs text-red-600 dark:text-red-400 font-poppins">
                  {error}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {isAIMode &&
            !error &&
            !isProcessing &&
            viewMode === "pdf" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-2 p-2 bg-amber-50/95 dark:bg-amber-900/30 backdrop-blur-lg border border-amber-200/50 dark:border-amber-800/50 rounded-xl"
              >
                <p className="text-xs text-amber-600 dark:text-amber-400 font-poppins">
                  Tap on the pages you want to{" "}
                  {selectedTaskObj?.label.toLowerCase()}. Selected pages
                  will be highlighted in amber.
                </p>
              </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
});

export default AIPageSelector;
