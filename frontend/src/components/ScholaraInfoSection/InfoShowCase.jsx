import React, { useState, useEffect, useRef } from "react";
import { Search, BookOpen } from "lucide-react";
import { useTheme } from "../../context/ThemeProvider/ThemeProvider.jsx"; // Assuming this path is correct

export default function InfoShowCaseMobile() {
  const { isDarkMode } = useTheme(); // isDarkMode is available but not used in the provided snippet
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [hasStartedAnimation, setHasStartedAnimation] = useState(false); // New state to track if animation has begun
  
  const componentRef = useRef(null); // Ref for the component's DOM element
  const targetText = "what is Scholara collective";

  // Intersection Observer to start animation when component enters viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the component is intersecting (visible) and animation hasn't started yet
        if (entry.isIntersecting && !hasStartedAnimation) {
          setHasStartedAnimation(true); // Mark animation as started
          startTypingSequence(); // Begin the animation
          observer.disconnect(); // Stop observing after animation starts
        }
      },
      {
        threshold: 0.1, // Trigger when 10% of the component is visible
      }
    );

    if (componentRef.current) {
      observer.observe(componentRef.current);
    }

    return () => {
      if (componentRef.current) {
        observer.unobserve(componentRef.current);
      }
      observer.disconnect();
    };
  }, [hasStartedAnimation]); // Rerun if hasStartedAnimation changes to ensure proper cleanup

  // Function to encapsulate the animation sequence
  const startTypingSequence = () => {
    let timeoutId;
    let currentIndex = 0;

    const typeCharacter = () => {
      if (currentIndex <= targetText.length) {
        setSearchQuery(targetText.slice(0, currentIndex));
        currentIndex++;
        timeoutId = setTimeout(typeCharacter, 100);
      } else {
        setIsTyping(false);
        setTimeout(() => {
          setShowZoom(true);
          setTimeout(() => {
            performSearch();
          }, 800);
        }, 500);
      }
    };

    setIsTyping(true);
    typeCharacter(); // Start typing immediately once called
  };

  const performSearch = () => {
    setIsSearching(true);
    setTimeout(() => {
      setSearchResult({
        type: "about",
        title: "What is Scholara Collective?",
        content:
          "Scholara Collective is a free, open-source academic resource hub built using the MERN stack (MongoDB, Express.js, React, Node.js). It empowers students by providing a centralized platform to upload, download, and organize essential study materials like class notes, past year question papers, model answers, and revision sheets. We foster collaborative learning through community contributions, ratings, and comments.",
      });
      setIsSearching(false);
      setShowZoom(false);
    }, 1500);
  };

  return (
    // Attach the ref to the outermost element of the component
    <section ref={componentRef} className="min-h-full w-full overflow-y-auto relative">
      <section className="bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg rounded-2xl shadow-glow-sm border border-gray-200/50 dark:border-charcoal/50 p-4 lg:p-6 h-auto transition-colors duration-300">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-400 rounded-lg shadow-glow-sm">
            <Search size={20} className="text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            What is Scholara Collective?
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            readOnly
            placeholder="Watch the magic happen..."
            className={`w-full p-4 pr-16 rounded-xl border text-lg font-medium transition-all duration-300 
              ${
                isTyping
                  ? "border-amber-400 shadow-glow-sm"
                  : "border-gray-300 dark:border-charcoal"
              }
              bg-white/95 dark:bg-onyx/95 text-gray-800 dark:text-gray-200
            `}
          />

          {/* Search Button */}
          <div
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 transition-all duration-700 ${
              showZoom ? "scale-150 z-10" : ""
            }`}
          >
            <button
              className={`p-2 rounded-lg transition-all duration-300 relative 
                ${
                  showZoom
                    ? "bg-amber-500 text-white shadow-2xl ring-4 ring-amber-300 animate-pulse"
                    : isSearching
                    ? "bg-amber-600 text-white"
                    : "bg-gray-100 dark:bg-charcoal text-gray-400 dark:text-gray-300"
                }`}
            >
              {isSearching ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <Search size={20} />
              )}
            </button>
          </div>
        </div>

        {/* Typing Indicator */}
        {isTyping && (
          <div className="mt-3 flex items-center gap-2 text-amber-600">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Auto-typing in progress...</span>
          </div>
        )}

        {/* Searching Indicator */}
        {isSearching && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-amber-50 dark:bg-onyx/50 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="animate-spin w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full"></div>
            <span className="text-amber-700 dark:text-amber-400 font-medium">
              Searching for "{targetText}"...
            </span>
          </div>
        )}

        {/* Search Results */}
        {searchResult && (
          <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-onyx dark:to-charcoal rounded-xl border-2 border-amber-200 dark:border-amber-800 animate-fadeInUp shadow-glow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-500 rounded-lg">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                {searchResult.title}
              </h3>
            </div>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 lg:text-md text-sm ">
              {searchResult.content}
            </p>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Search completed successfully!</span>
            </div>
          </div>
        )}
      </section>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}
