import React, { useState, useEffect, useRef } from "react";
import { MessageSquareText, X, Menu } from "lucide-react";
import ChatBot from "../Chatbot/Chatbot";

const ChatbotToggle = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOnRightSide, setIsOnRightSide] = useState(false);

  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 10, y: window.innerHeight / 2 });
  const buttonRef = useRef(null);

  const holdTimer = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleChatbot = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("body-no-scroll");
    } else {
      document.body.classList.remove("body-no-scroll");
    }
    return () => document.body.classList.remove("body-no-scroll");
  }, [isOpen]);

  // --- Smooth render loop ---
  useEffect(() => {
    let frame;
    const animate = () => {
      if (buttonRef.current) {
        buttonRef.current.style.transform = `translate(${dragRef.current.x}px, ${dragRef.current.y}px)`;
      }
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  // --- Drag Handlers ---
  const handleTouchStart = (e) => {
    holdTimer.current = setTimeout(() => {
      setDragging(true);
      if (navigator.vibrate) navigator.vibrate(40);
    }, 400);
  };

  const handleTouchMove = (e) => {
    if (!dragging) return;
    const touch = e.touches[0];
    const newX = touch.clientX - 18;
    const newY = touch.clientY - 24;

    const buttonWidth = buttonRef.current ? buttonRef.current.offsetWidth : 36;
    const buttonHeight = buttonRef.current ? buttonRef.current.offsetHeight : 48;

    dragRef.current = {
      x: Math.min(Math.max(newX, 0), window.innerWidth - buttonWidth),
      y: Math.min(Math.max(newY, 0), window.innerHeight - buttonHeight),
    };
  };

  const handleTouchEnd = () => {
    clearTimeout(holdTimer.current);

    setDragging(false);

    const buttonWidth = buttonRef.current ? buttonRef.current.offsetWidth : 36;
    const screenWidth = window.innerWidth;

    let targetX;

    const isNowOnRightSide = dragRef.current.x > screenWidth / 2;
    setIsOnRightSide(isNowOnRightSide);

    if (isNowOnRightSide) {
      targetX = screenWidth - buttonWidth;
    } else {
      targetX = 0;
    }

    let start = dragRef.current.x;
    let end = targetX;
    let startTime = null;

    const duration = 300;

    const animateSnap = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 0.25 * Math.pow(progress - 1, 3) + 1;
      dragRef.current.x = start + (end - start) * ease;

      if (progress < 1) {
        requestAnimationFrame(animateSnap);
      } else {
        dragRef.current.x = end;
        if (navigator.vibrate) navigator.vibrate(20);
      }
    };

    requestAnimationFrame(animateSnap);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        } ${
          isMobile
            ? "bg-black/70 backdrop-blur-sm"
            : "bg-onyx/80 backdrop-blur-[1px]"
        }`}
        style={{ willChange: "opacity", display: isOpen ? "block" : "none" }}
        onClick={toggleChatbot}
      />

      {/* Chatbot container */}
      <div
        className={`z-50 fixed inset-0 w-full h-full overflow-hidden flex flex-col
          bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-midnight
          transition-[clip-path] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{
          clipPath: isOpen
            ? "circle(150% at calc(100% - 3rem) calc(100% - 3rem))"
            : "circle(1.5rem at calc(100% - 3rem) calc(100% - 3rem))",
          willChange: "clip-path",
          display: "block",
        }}
      >
        <ChatBot user={user} />
      </div>

      {/* FAB button */}
      <button
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-[9999]
          bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600
          text-white rounded-full shadow-lg transition-all duration-300 ease-out
          transform hover:scale-105 active:scale-95 flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-amber-400/30
          ${isMobile && isOpen ? "hidden" : "p-4 opacity-100"}`}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        {isOpen ? (
          <X className="w-5 h-5 md:w-6 md:h-6" />
        ) : (
          <>
            <MessageSquareText className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300/80 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
            </span>
          </>
        )}
      </button>

      {/* Floating Swipe Button (draggable & snapping) */}
      {isMobile && isOpen && (
        <button
          ref={buttonRef}
          onClick={toggleChatbot}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`fixed top-0 left-0 z-[9999]
            bg-gradient-to-br from-amber-600 to-amber-700
            text-white w-9 h-12 shadow-lg flex items-center justify-center
            focus:outline-none focus:ring-4 focus:ring-amber-400/30
            ${isOnRightSide ? "rounded-l-md" : "rounded-r-md"}`}
          style={{
            transform: `translate(${dragRef.current.x}px, ${dragRef.current.y}px)`,
            transition: dragging ? "none" : "transform 0.3s ease-out",
          }}
          aria-label="Close chatbot"
        >
          <Menu
            className={`w-5 h-5 transition-transform duration-300 ease-out ${
              isOnRightSide ? "rotate-180" : "rotate-0"
            }`}
          />
        </button>
      )}
    </>
  );
};

export default ChatbotToggle;