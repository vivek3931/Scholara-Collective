import React, { useState, useEffect } from "react";
import ChatbotContent from "../ScholaraCollectiveChatbot/ScholaraCollectiveChatbot";
import { MessageSquareText, X, Sparkles } from "lucide-react";

const ChatbotToggle = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const ANIMATION_DURATION = 500;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    setIsInitialRender(false);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    let timeoutId;
    if (isOpen) {
      setShowChatbot(true);
    } else {
      if (!isInitialRender) {
        timeoutId = setTimeout(() => {
          setShowChatbot(false);
        }, ANIMATION_DURATION);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [isOpen, isInitialRender]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Backdrop - updated to match dark theme */}
      {showChatbot && (
        <div
          className={`fixed inset-0 z-40 transition-opacity duration-500 ease-in-out ${
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          } ${
            isMobile
              ? "bg-black/70 backdrop-blur-sm"
              : "bg-onyx/80 backdrop-blur-[1px]"
          }`}
          onClick={toggleChatbot}
        />
      )}

      {/* Chatbot container - updated colors and borders */}
      {showChatbot && (
        <div
          className={`transform transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] z-50
                      ${
                        isOpen
                          ? isMobile
                            ? "translate-y-0 opacity-100 scale-100 rounded-t-2xl"
                            : "translate-y-0 opacity-100 scale-100"
                          : isMobile
                          ? "translate-y-full opacity-0 scale-95 pointer-events-none"
                          : "translate-y-4 opacity-0 scale-95 pointer-events-none"
                      }
                      fixed bottom-0 right-0 left-0
                      sm:bottom-20 sm:right-6 sm:left-auto
                      w-full sm:w-[400px] md:w-[450px] lg:w-[500px]
                      h-[85vh] sm:h-[600px] md:h-[650px]
                      bg-onyx
                      rounded-t-2xl sm:rounded-2xl lg:rounded-3xl
                      shadow-2xl sm:shadow-3xl overflow-hidden flex flex-col
                      border border-onyx`}
          style={{
            maxHeight: "calc(100vh - 5rem)",
            ...(isMobile && {
              width: "100vw",
              left: 0,
              right: 0,
            }),
          }}
        >
          <ChatbotContent />
        </div>
      )}

      {/* FAB button - updated colors and effects */}
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-[9999]
                      bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600
                      text-white p-4 rounded-full shadow-lg transition-all duration-300 ease-out
                      transform hover:scale-105 active:scale-95 flex items-center justify-center
                      focus:outline-none focus:ring-4 focus:ring-amber-400/30
                      ${isOpen ? "rotate-90" : "rotate-0"} ${
          isOpen && isMobile ? "hidden" : "block"
        }`}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? (
          <X className="w-6 h-6 transition-transform duration-300" />
        ) : (
          <>
            <MessageSquareText className="w-6 h-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
          </>
        )}
      </button>
    </>
  );
};

export default ChatbotToggle;