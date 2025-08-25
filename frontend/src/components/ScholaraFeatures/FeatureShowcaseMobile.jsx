import React, { useState } from "react";
import {
  FileText,
  Upload,
  Search,
  Users,
  BarChart3,
  MessageCircle,
  X,
  Send,
  Brain,
  BookOpen,
  FileQuestion,
} from "lucide-react";

const features = [
  {
    icon: <Upload className="w-6 h-6 text-orange-500" />,
    title: "Upload Resources",
    desc: "Easily share notes, papers, and study guides.",
  },
  {
    icon: <FileText className="w-6 h-6 text-amber-500" />,
    title: "Preview & Download",
    desc: "View PDFs in-browser or download with one click.",
  },
  {
    icon: <Search className="w-6 h-6 text-orange-400" />,
    title: "Smart Search",
    desc: "Filter by subject, course, or institution instantly.",
  },
  {
    icon: <Users className="w-6 h-6 text-amber-500" />,
    title: "Community Driven",
    desc: "Rate, comment, and upvote quality resources.",
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-orange-500" />,
    title: "Analytics Dashboard",
    desc: "Track your uploads, downloads, and top resources.",
  },
  {
    icon: <Brain className="w-6 h-6 text-amber-400" />,
    title: "AI-Powered Assistant",
    desc: "Get instant answers, summaries, and quizzes from your documents.",
  },
];

// Mock AI responses for demonstration
const mockAIResponses = {
  summary:
    "Based on the document, this appears to be a research paper about machine learning applications in healthcare. Key points include predictive analytics for patient outcomes, natural language processing for medical records, and ethical considerations for AI in medicine.",
  quiz: `Here's a quick quiz based on the document:

1. What are the three main applications mentioned?
   A) Predictive analytics, NLP, and ethical considerations
   B) Surgery, diagnosis, and treatment
   C) Radiology, cardiology, and neurology

2. What is a key challenge mentioned for AI in healthcare?
   A) Data privacy concerns
   B) Hardware limitations
   C) Lack of trained professionals`,
  explain:
    "The section you've highlighted discusses how natural language processing can extract meaningful information from unstructured medical notes. This helps in identifying patterns that might not be obvious to human reviewers, potentially leading to earlier diagnoses.",
};

export default function FeatureShowcaseMobile() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      type: "ai",
      content:
        "Hi! I'm Scholara AI. I can help you understand your documents, generate summaries, create quizzes, and answer questions. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage = {
      type: "user",
      content: message,
      timestamp: new Date(),
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsProcessing(true);

    const userText = message.toLowerCase();

    setTimeout(() => {
      let aiResponse;

      if (userText.includes("summar") || userText.includes("overview")) {
        aiResponse = {
          type: "ai",
          content: mockAIResponses.summary,
          timestamp: new Date(),
        };
      } else if (userText.includes("quiz") || userText.includes("test")) {
        aiResponse = {
          type: "ai",
          content: mockAIResponses.quiz,
          timestamp: new Date(),
        };
      } else if (
        userText.includes("explain") ||
        userText.includes("what does this mean")
      ) {
        aiResponse = {
          type: "ai",
          content: mockAIResponses.explain,
          timestamp: new Date(),
        };
      } else {
        aiResponse = {
          type: "ai",
          content:
            "I can help you with document summaries, generating quizzes, or explaining concepts from your uploaded materials. What would you like me to focus on?",
          timestamp: new Date(),
        };
      }

      setChatHistory((prev) => [...prev, aiResponse]);
      setIsProcessing(false);
      setMessage("");
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: <BookOpen size={16} />, text: "Summarize this document" },
    { icon: <FileQuestion size={16} />, text: "Generate a quiz" },
    { icon: <Brain size={16} />, text: "Explain this concept" },
  ];

  return (
    <section className="min-h-full w-full overflow-y-auto px-3 lg:px-5 py-10 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 dark:from-onyx dark:via-charcoal dark:to-onyx relative">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="lg:text-3xl text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-400 dark:from-amber-400 dark:to-orange-300 mb-2">
          Scholara Features
        </h2>
        <p className="text-gray-600 lg:text-xl text-xs dark:text-gray-300">
          Everything you need to excel in your studies
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1  gap-5 mb-12">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="relative group overflow-hidden rounded-2xl p-3 lg:p-6 bg-white/95 dark:bg-charcoal/95 backdrop-blur-lg border border-gray-200/50 dark:border-charcoal/50 
            shadow-glow-sm  transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"></div>

            <div className="relative z-10 flex lg:flex-row flex-col items-start gap-4">
              <div className="p-3 bg-white dark:bg-gray-700 rounded-xl shadow-glow-sm group-hover:scale-110 transition-transform duration-300">
                {f.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-1">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {f.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chatbot FAB */}
      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-glow-sm flex items-center justify-center text-white hover:shadow-glow-sm transition-all duration-300 hover:scale-110 z-40"
        aria-label="Open AI assistant"
      >
        <MessageCircle size={24} />
      </button>

      {/* AI Chatbot Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black/50 dark:text-white backdrop-blur-sm z-50 flex items-end justify-center p-4 sm:items-center">
          <div className="relative w-full max-w-md bg-white dark:bg-charcoal rounded-t-2xl sm:rounded-2xl h-[80vh] max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-onyx bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <Brain size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold">Scholara AI Assistant</h3>
                    <p className="text-xs opacity-80">Powered by AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Close chat"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-3 ${
                      msg.type === "user"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-900 dark:text-amber-100 rounded-br-none"
                        : "bg-gray-100 dark:bg-onyx/50 text-gray-900 dark:text-gray-100 rounded-bl-none"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className="text-xs opacity-50 mt-1">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 dark:bg-onyx/50 rounded-2xl rounded-bl-none p-3">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-200 dark:border-charcoal bg-gray-50 dark:bg-charcoal">
              <div className="flex overflow-x-auto gap-2 py-2 scrollbar-hide">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setMessage(action.text);
                      setTimeout(handleSendMessage, 100);
                    }}
                    className="flex-shrink-0 flex items-center gap-1 px-3 py-2 bg-white dark:bg-charcoal rounded-full text-xs border border-gray-200 dark:border-onyx shadow-glow-sm hover:shadow-md transition-shadow"
                  >
                    {action.icon}
                    <span>{action.text}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-charcoal bg-white dark:bg-charcoal rounded-b-2xl">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask something about your documents..."
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-charcoal rounded-full bg-gray-100 dark:bg-onyx/95 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={isProcessing}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isProcessing || !message.trim()}
                  className="p-3 bg-gradient-to-r from-amber-500 to-orange-400 text-white rounded-full hover:shadow-glow-sm transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
