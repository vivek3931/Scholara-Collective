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

const AI_API_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:8000";

const extractTextFromPdfPages = async (pdfDataUrl, selectedPages) => {
  try {
    const loadingTask = pdfjsLib.getDocument(pdfDataUrl);
    const pdf = await loadingTask.promise;

    const extractedTexts = {};

    for (const pageNum of selectedPages.sort((a, b) => a - b)) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .filter((item) => item.str && item.str.trim())
          .map((item) => item.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();

        if (pageText && pageText.length > 10) {
          extractedTexts[pageNum] = pageText;
        } else {
          extractedTexts[pageNum] = "[Limited text content available]";
        }
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

const processAITask = async (extractedTexts, task, selectedPages) => {
  try {
    const pageResults = {};
    const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);

    for (const pageNum of pagesArray) {
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

      pageResults[pageNum] = data.result;
    }

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

const AIPageSelector = ({
  previewDataUrl,
  numPages,
  currentPage,
  pdfDimensions,
  zoom,
  onClose,
  isFullscreen
}) => {
  const { isDarkMode } = useTheme();
  const { showModal } = useModal();
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState("");
  const [selectedPages, setSelectedPages] = useState(new Set());
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPage, setProcessingPage] = useState(null);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [aiResult, setAiResult] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [viewMode, setViewMode] = useState("pdf"); // 'pdf' or 'annotated'

  const dropdownRef = useRef(null);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const scrollTimeoutRef = useRef(null);
  console.log(isFullscreen)

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

  useEffect(() => {
    if (previewDataUrl) {
      setIsLoading(false);
    }
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [previewDataUrl]);

  // Smooth scroll handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = (e) => {
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 16) {
        // Throttle to ~60fps
        e.preventDefault();
        return;
      }
      lastScrollTimeRef.current = now;

      // Clear any existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Schedule a smooth scroll update
      scrollTimeoutRef.current = setTimeout(() => {
        const target = container;
        const { scrollTop, scrollHeight, clientHeight } = target;

        // Prevent janky scroll behavior
        requestAnimationFrame(() => {
          // Additional smoothness handling if needed
        });
      }, 50);
    };

    container.addEventListener("scroll", handleScroll, { passive: false });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleTaskSelect = useCallback((taskValue) => {
    setSelectedTask(taskValue);
    setIsDropdownOpen(false);
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
    setExtractionProgress("Extracting text from selected pages...");

    try {
      const pagesArray = Array.from(selectedPages).sort((a, b) => a - b);

      for (const pageNum of pagesArray) {
        setProcessingPage(pageNum);
        setExtractionProgress(`Extracting page ${pageNum}...`);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const extractedTexts = await extractTextFromPdfPages(
        previewDataUrl,
        pagesArray
      );

      setExtractionProgress(`Processing ${pagesArray.length} pages with AI...`);

      const pageResults = await processAITask(
        extractedTexts,
        selectedTask,
        selectedPages
      );
      setAiResult(pageResults);
      setViewMode("annotated");
      setExtractionProgress("");
      setProcessingPage(null);

      // Warn if all pages have no summary
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
      setProcessingPage(null);
      showModal({
        type: "error",
        title: "Processing Failed",
        message: err.message || "Failed to process pages. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAIMode = useCallback(() => {
    setIsAIMode(false);
    setSelectedTask("");
    setSelectedPages(new Set());
    setIsDropdownOpen(false);
    setError("");
    setAiResult({});
    setExtractionProgress("");
    setIsProcessing(false);
    setProcessingPage(null);
    setIsHeaderExpanded(false);
    setViewMode("pdf");
  }, []);

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
      triggerOnce: true,
      threshold: 0.1,
      rootMargin: "300px 0px", // Increased margin for smoother loading
    });

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="mb-6 z-[1]" // Increased margin for better spacing
      >
        {inView ? (
          renderPDFPageWithSelection(pageNumber)
        ) : (
          <div
            style={{
              height: pdfDimensions.height * zoom,
              width: pdfDimensions.width * zoom,
            }}
            className="bg-gray-100/95 dark:bg-onyx/50 rounded-xl animate-pulse transition-opacity duration-300 z-[1]"
          />
        )}
      </motion.div>
    );
  };

  const selectedTaskObj = aiTasks.find((t) => t.value === selectedTask);

  const renderPDFPageWithSelection = useCallback(
    (pageNumber) => {
      const isSelected = selectedPages.has(pageNumber);
      const isSelectable = isAIMode && !isProcessing && viewMode === "pdf";
      const isBeingProcessed =
        isProcessing && isSelected && processingPage === pageNumber;
      const isProcessed =
        isProcessing && isSelected && processingPage !== pageNumber;
      const showResult =
        viewMode === "annotated" && aiResult[pageNumber] && isSelected;

      return (
        <motion.div
          key={`ai-page-${pageNumber}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94], // Smooth easing
          }}
          className={`relative mb-6 flex justify-center transition-all duration-300 ${
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
          whileHover={
            isSelectable
              ? {
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }
              : {}
          }
        >
          {isAIMode && viewMode === "pdf" && (
            <motion.div
              className={`absolute inset-0 z-10 rounded-lg border-4 transition-all duration-300 ${
                isSelected
                  ? isBeingProcessed
                    ? "border-amber-400 bg-amber-400/30 shadow-lg shadow-amber-400/40"
                    : isProcessed
                    ? "border-green-400 bg-green-400/20 shadow-lg shadow-green-400/30"
                    : "border-amber-500 bg-amber-500/20 shadow-lg shadow-amber-500/30"
                  : isSelectable
                  ? "border-transparent hover:border-amber-300 hover:bg-amber-300/10"
                  : "border-gray-300 dark:border-charcoal/50 bg-gray-100/20 dark:bg-onyx/20"
              }`}
              animate={
                isBeingProcessed
                  ? {
                      scale: [1, 1.02, 1],
                      opacity: [1, 0.8, 1],
                    }
                  : {}
              }
              transition={
                isBeingProcessed
                  ? {
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {}
              }
            >
              <div
                className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium font-poppins transition-all duration-200 ${
                  isSelected
                    ? isBeingProcessed
                      ? "bg-amber-400 text-white shadow-lg"
                      : isProcessed
                      ? "bg-green-400 text-white shadow-lg"
                      : "bg-amber-500 text-white shadow-lg"
                    : "bg-black/70 dark:bg-onyx/70 text-white"
                }`}
              >
                {pageNumber}
              </div>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="absolute top-2 right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <Check size={12} className="text-white" />
                </motion.div>
              )}
              {isBeingProcessed && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-amber-400/30 backdrop-blur-sm rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      rotate: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear",
                      },
                      scale: { duration: 0.8, repeat: Infinity },
                    }}
                    className="w-12 h-12 bg-amber-500/90 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Sparkles className="text-white" size={20} />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
          <div
            className={`bg-white rounded-lg border border-gray-200/50 transition-all duration-300 ${
              isSelected ? "shadow-xl shadow-amber-500/20" : "shadow-md"
            }`}
            style={{
              width: "100%",
              maxWidth: pdfDimensions?.width * zoom || "100%",
              height: pdfDimensions?.height * zoom || "auto",
              overflow: "hidden",
            }}
          >
            {showResult ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="p-6 overflow-y-auto bg-white"
                style={{
                  width: pdfDimensions?.width * zoom,
                  height: pdfDimensions?.height * zoom,
                  scrollBehavior: "smooth",
                }}
              >
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 bg-gradient-to-br ${
                        selectedTaskObj?.color || "from-amber-500 to-orange-400"
                      } rounded-md flex items-center justify-center shadow-sm`}
                    >
                      {selectedTaskObj?.icon || (
                        <Sparkles className="text-white" size={16} />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold font-poppins text-gray-900">
                        AI {selectedTaskObj?.label} - Page {pageNumber}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Generated on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="prose max-w-none">
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
                </div>
              </motion.div>
            ) : (
              <Page
                pageNumber={pageNumber}
                width={pdfDimensions?.width || 500}
                scale={zoom || 1}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading={
                  <div className="flex items-center justify-center h-full bg-gray-100/95 transition-opacity duration-300">
                    <Loader2 className="animate-spin text-gray-400" size={24} />
                  </div>
                }
              />
            )}
          </div>
        </motion.div>
      );
    },
    [
      selectedPages,
      isAIMode,
      isProcessing,
      processingPage,
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
        className={`w-full  ${isFullscreen ? "h-screen" : "h-[600px]"} scroll-container flex flex-col relative bg-gray-100/95 dark:bg-onyx/95 rounded-lg ${
          isDropdownOpen ? "pointer-events-none" : ""
        }`}
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
                      <div className="relative z-[1000000]" ref={dropdownRef}>
  <button
    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
    className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-xl font-medium font-poppins shadow-glow-sm transition-all duration-300 hover:scale-105 transform active:scale-95 text-xs sm:text-sm"
    aria-label="Open AI task menu"
  >
    <Sparkles size={12} className="sm:size-6" />
    <span className="hidden xs:inline">Choose Task</span>
    <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
  </button>
  <AnimatePresence>
    {isDropdownOpen && (
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="absolute top-[calc(100%+16px)] right-0 w-64 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 py-2 z-[1000001] overflow-hidden pointer-events-auto"
      >
        {aiTasks.map((task, index) => (
          <motion.button
            key={task.value}
            onClick={() => handleTaskSelect(task.value)}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ delay: index * 0.05 }}
            className="w-full flex items-start gap-3 px-4 py-3 hover:bg-amber-50 dark:hover:bg-onyx/50 transition-colors duration-200 text-left"
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
          </motion.button>
        ))}
      </motion.div>
    )}
  </AnimatePresence>
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
                      <div className="flex items-center gap-2">
                        <Loader2
                          size={14}
                          className="animate-spin text-amber-600 dark:text-amber-400"
                        />
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-poppins">
                          {extractionProgress}
                        </p>
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

            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto scroll-smooth will-change-transform z-[1]"
              style={{
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
                overscrollBehavior: "contain",
              }}
            >
              <div className="container mx-auto px-2 sm:px-4 lg:px-8 py-4">
                <div className="max-w-full sm:max-w-4xl mx-auto">
                  {previewDataUrl && (
                    <div className="pdf-document z-[1]">
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                          className="space-y-6 z-[1]"
                        >
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

export default AIPageSelector;