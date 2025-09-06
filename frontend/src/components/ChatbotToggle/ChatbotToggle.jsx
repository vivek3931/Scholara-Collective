import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  const toggleChatbot = () => setIsOpen((prev) => !prev);

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

  // --- Smooth render loop for dragging ---
  useEffect(() => {
    let frame;
    const animate = () => {
      if (buttonRef.current && dragging) {
        buttonRef.current.style.transform = `translate(${dragRef.current.x}px, ${dragRef.current.y}px)`;
      }
      frame = requestAnimationFrame(animate);
    };
    if (dragging) animate();
    return () => cancelAnimationFrame(frame);
  }, [dragging]);

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

    const isNowOnRightSide = dragRef.current.x > screenWidth / 2;
    setIsOnRightSide(isNowOnRightSide);

    const targetX = isNowOnRightSide ? screenWidth - buttonWidth : 0;

    // Animate snapping with spring
    const animateSnap = () => {
      dragRef.current.x = targetX;
      if (buttonRef.current) {
        buttonRef.current.style.transition = "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)";
        buttonRef.current.style.transform = `translate(${targetX}px, ${dragRef.current.y}px)`;
      }
      if (navigator.vibrate) navigator.vibrate(20);
    };

    requestAnimationFrame(animateSnap);
  };

  // Animation variants for the chatbot container
  const containerVariants = {
    closed: {
      clipPath: "circle(1.5rem at calc(100% - 3rem) calc(100% - 3rem))",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      },
    },
    open: {
      clipPath: "circle(150% at calc(100% - 3rem) calc(100% - 3rem))",
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 1,
      },
    },
  };

  // Animation variants for the FAB button
  const fabVariants = {
    closed: { scale: 1, rotate: 0 },
    open: { scale: 1.1, rotate: 90 },
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed inset-0 z-40 ${
              isMobile ? "bg-black/70 backdrop-blur-sm" : "bg-onyx/80 backdrop-blur-[1px]"
            }`}
            onClick={toggleChatbot}
          />
        )}
      </AnimatePresence>

      {/* Chatbot container */}
      <motion.div
        variants={containerVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        className={`z-50 fixed inset-0 w-full h-full overflow-hidden flex flex-col
          bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-midnight
          pointer-events-auto`}
      >
        <ChatBot user={user} />
      </motion.div>

      {/* FAB button */}
      <motion.button
        variants={fabVariants}
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        onClick={toggleChatbot}
        className={`fixed bottom-6 right-6 z-[9999]
          bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600
          text-white rounded-full shadow-lg flex items-center justify-center
          focus:outline-none focus:ring-4 focus:ring-amber-400/30
          ${isMobile && isOpen ? "hidden" : "p-4 opacity-100"}`}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.3 }}>
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
        </motion.div>
      </motion.button>

      {/* Floating Swipe Button (draggable & snapping) */}
      {isMobile && isOpen && (
        <motion.button
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
            transition: dragging ? "none" : "transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          aria-label="Close chatbot"
        >
          <motion.div
            animate={{ rotate: isOnRightSide ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Menu className="w-5 h-5" />
          </motion.div>
        </motion.button>
      )}
    </>
  );
};

export default ChatbotToggle;