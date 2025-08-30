import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  Plus,
  MessageCircle,
  Clock,
  Menu,
  X,
  ChevronDown,
  Trash2,
  Settings,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { debounce } from "lodash"; // Ensure lodash is installed: npm install lodash
import { useAuth } from "../../context/AuthContext/AuthContext";
import logo from '../../assets/logo.svg'

const ChatBot = ({isDragging}) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isTypingResponse, setIsTypingResponse] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [textareaHeight, setTextareaHeight] = useState(56);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();

  // The API URL for your Python AI service
  const API_URL = "http://localhost:8000";

  // Mock for chatbotStats
  const chatbotStats = {
    ready: true,
  };

  // Auto-resize textarea
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 56), 120);
      textarea.style.height = `${newHeight}px`;
      setTextareaHeight(newHeight);
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  const handleScroll = debounce(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      const nearBottom = scrollHeight - scrollTop - clientHeight < 150;
      const shouldShowScrollButton =
        scrollHeight - scrollTop - clientHeight > 200;

      setIsNearBottom(nearBottom);
      setShowScrollButton(shouldShowScrollButton);
    }
  }, 100);

  const scrollToBottom = () => {
    if (chatContainerRef.current && messagesEndRef.current) {
      const { scrollHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });
      setIsNearBottom(true);
    }
  };

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => {
        chatContainer.removeEventListener("scroll", handleScroll);
        handleScroll.cancel();
      };
    }
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom();
    }
  }, [messages, isTypingResponse, isNearBottom]);

  // Copy message function
  const copyMessage = async (text, messageId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Delete chat function
  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      createNewChat();
    }
  };

  // Typing effect function
  const typeMessage = (fullText, messageId, speed = 30) => {
    return new Promise((resolve) => {
      let currentIndex = 0;
      setIsTypingResponse(true);
      setTypingText("");

      const typeChar = () => {
        if (currentIndex < fullText.length) {
          setTypingText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
          typingTimeoutRef.current = setTimeout(typeChar, speed);
        } else {
          setIsTypingResponse(false);
          setTypingText("");
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === messageId
                ? { ...msg, text: fullText, isTyping: false }
                : msg
            )
          );
          scrollToBottom();
          resolve();
        }
      };

      typeChar();
    });
  };

  // Clean up typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0 && !currentChatId) {
      const welcomeMessage = {
        id: Date.now(),
        text: `Hi ${
          user?.username || "there"
        }! I'm your Global AI Learning Assistant, ready to help solve your doubts using all available resources. What would you like to know?`,
        sender: "bot",
        timestamp: new Date(),
        isTyping: false,
      };
      setMessages([welcomeMessage]);

      const newChatId = Date.now();
      const newChat = {
        id: newChatId,
        title: "New Chat",
        messages: [welcomeMessage],
        timestamp: new Date(),
        lastUpdated: new Date(),
      };
      setChatHistory([newChat]);
      setCurrentChatId(newChatId);
    }
  }, [user?.username, currentChatId, messages.length]);

  // Update chat history when messages change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      setChatHistory((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                messages: messages.filter((msg) => !msg.isTyping),
                lastUpdated: new Date(),
                title:
                  messages.length > 1
                    ? messages
                        .find((msg) => !msg.isTyping && msg.sender === "user")
                        ?.text?.substring(0, 30) + "..." || "New Chat"
                    : "New Chat",
              }
            : chat
        )
      );
    }
  }, [messages, currentChatId]);

  const createNewChat = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTypingResponse(false);
    setTypingText("");

    const welcomeMessage = {
      id: Date.now(),
      text: `Hi ${
        user?.username || "there"
      }! I'm your Global AI Learning Assistant, ready to help solve your doubts using all available resources. What would you like to know?`,
      sender: "bot",
      timestamp: new Date(),
      isTyping: false,
    };

    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: "New Chat",
      messages: [welcomeMessage],
      timestamp: new Date(),
      lastUpdated: new Date(),
    };

    setChatHistory((prev) => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setMessages([welcomeMessage]);
    setIsLoading(false);
    setIsNearBottom(true);
    setIsSidebarOpen(false);
  };

  const loadChat = (chatId) => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    setIsTypingResponse(false);
    setTypingText("");

    const chat = chatHistory.find((c) => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
      setIsLoading(false);
      setIsNearBottom(true);
      setIsSidebarOpen(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || isTypingResponse) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };

    const botPlaceholderMessage = {
      id: Date.now() + 1,
      text: "",
      sender: "bot",
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages((prev) => [...prev, userMessage, botPlaceholderMessage]);
    setInputMessage("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const endpoint = `${API_URL}/query`;
      const payload = { query: userMessage.text };

      console.log("Making API call to:", endpoint, "with payload:", payload);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        throw new Error(
          `HTTP ${response.status}: Failed to get response from server: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("API Response:", data);

      const responseText =
        data.answer ||
        "I encountered an issue processing your request. Please try again.";
      await typeMessage(responseText, botPlaceholderMessage.id, 15);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorText = `Sorry, I encountered an error: ${error.message}. Please check your connection and try again.`;
      await typeMessage(errorText, botPlaceholderMessage.id);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botPlaceholderMessage.id ? { ...msg, isError: true } : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatBotMessage = (text) => {
    if (!text) return [];

    const lines = text.split("\n");
    const formattedElements = [];
    let currentElement = "";
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let listItems = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("```")) {
        if (inCodeBlock) {
          formattedElements.push({
            type: "code",
            content: currentElement,
            language: codeBlockLanguage,
          });
          currentElement = "";
          inCodeBlock = false;
          codeBlockLanguage = "";
        } else {
          if (currentElement.trim()) {
            formattedElements.push({ type: "text", content: currentElement });
            currentElement = "";
          }
          inCodeBlock = true;
          codeBlockLanguage = line.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        currentElement += (currentElement ? "\n" : "") + line;
        continue;
      }

      const isListItem =
        line.match(/^[-*+]\s+(.+)/) || line.match(/^\d+\.\s+(.+)/);
      if (isListItem) {
        if (!inList) {
          if (currentElement.trim()) {
            formattedElements.push({ type: "text", content: currentElement });
            currentElement = "";
          }
          inList = true;
          listItems = [];
        }
        listItems.push(isListItem[1]);
      } else {
        if (inList) {
          formattedElements.push({ type: "list", items: [...listItems] });
          listItems = [];
          inList = false;
        }
        currentElement += (currentElement ? "\n" : "") + line;
      }
    }

    if (inCodeBlock && currentElement) {
      formattedElements.push({
        type: "code",
        content: currentElement,
        language: codeBlockLanguage,
      });
    } else if (inList && listItems.length > 0) {
      formattedElements.push({ type: "list", items: listItems });
    } else if (currentElement.trim()) {
      formattedElements.push({ type: "text", content: currentElement });
    }

    return formattedElements;
  };

  const applyInlineFormatting = (text) => {
    if (!text) return text;

    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate dark:text-pearl font-semibold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="text-slate dark:text-pearl font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-steel dark:text-ash italic">$1</em>')
      .replace(/_(.*?)_/g, '<em class="text-steel dark:text-ash italic">$1</em>')
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-gradient-to-r from-slate-100 to-gray-100 dark:from-slate-800 dark:to-gray-800 px-2 py-1 rounded-md text-sm font-mono text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 shadow-sm">$1</code>'
      )
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 underline font-medium transition-colors duration-200">$1</a>'
      );
  };

  const renderFormattedMessage = (text, isTyping = false) => {
    const displayText = isTyping ? typingText : text;
    const elements = formatBotMessage(displayText);

    const getLanguageColor = (lang) => {
      const language = (lang || '').toLowerCase();
      const colorMap = {
        javascript: 'text-yellow-400',
        js: 'text-yellow-400',
        typescript: 'text-blue-400',
        ts: 'text-blue-400',
        python: 'text-green-400',
        py: 'text-green-400',
        java: 'text-orange-400',
        cpp: 'text-purple-400',
        'c++': 'text-purple-400',
        c: 'text-purple-400',
        html: 'text-orange-300',
        css: 'text-blue-300',
        scss: 'text-pink-400',
        sass: 'text-pink-400',
        sql: 'text-cyan-400',
        bash: 'text-gray-300',
        shell: 'text-gray-300',
        json: 'text-yellow-300',
        xml: 'text-red-300',
        php: 'text-indigo-400',
        ruby: 'text-red-400',
        go: 'text-cyan-300',
        rust: 'text-orange-500',
        swift: 'text-orange-300',
        kotlin: 'text-purple-300',
        dart: 'text-blue-300',
        react: 'text-cyan-400',
        vue: 'text-green-300',
        angular: 'text-red-400',
        markdown: 'text-slate-300',
        md: 'text-slate-300',
        yaml: 'text-purple-300',
        yml: 'text-purple-300',
        dockerfile: 'text-blue-400',
        default: 'text-gray-300'
      };
      return colorMap[language] || colorMap.default;
    };

    const getLanguageIcon = (lang) => {
      const language = (lang || '').toLowerCase();
      const iconMap = {
        javascript: '🟨',
        js: '🟨',
        typescript: '🔷',
        ts: '🔷',
        python: '🐍',
        py: '🐍',
        java: '☕',
        cpp: '⚙️',
        'c++': '⚙️',
        c: '⚙️',
        html: '🌐',
        css: '🎨',
        scss: '💅',
        sass: '💅',
        sql: '🗃️',
        bash: '💻',
        shell: '💻',
        json: '📄',
        xml: '📋',
        php: '🐘',
        ruby: '💎',
        go: '🔷',
        rust: '🦀',
        swift: '🍎',
        kotlin: '🎯',
        dart: '🎯',
        react: '⚛️',
        vue: '💚',
        angular: '🅰️',
        markdown: '📝',
        md: '📝',
        yaml: '📋',
        yml: '📋',
        dockerfile: '🐳',
        default: '📝'
      };
      return iconMap[language] || iconMap.default;
    };

    const getLanguageGradient = (lang) => {
      const language = (lang || '').toLowerCase();
      const gradientMap = {
        javascript: 'from-yellow-900 via-yellow-800 to-amber-800',
        js: 'from-yellow-900 via-yellow-800 to-amber-800',
        typescript: 'from-blue-900 via-blue-800 to-indigo-800',
        ts: 'from-blue-900 via-blue-800 to-indigo-800',
        python: 'from-green-900 via-green-800 to-emerald-800',
        py: 'from-green-900 via-green-800 to-emerald-800',
        java: 'from-orange-900 via-orange-800 to-red-800',
        cpp: 'from-purple-900 via-purple-800 to-indigo-800',
        'c++': 'from-purple-900 via-purple-800 to-indigo-800',
        c: 'from-purple-900 via-purple-800 to-indigo-800',
        html: 'from-orange-900 via-red-800 to-pink-800',
        css: 'from-blue-900 via-cyan-800 to-teal-800',
        sql: 'from-cyan-900 via-cyan-800 to-blue-800',
        react: 'from-cyan-900 via-blue-800 to-indigo-800',
        vue: 'from-green-900 via-teal-800 to-cyan-800',
        default: 'from-slate-900 via-gray-800 to-slate-800'
      };
      return gradientMap[language] || gradientMap.default;
    };

    return (
      <div>
        {elements.map((element, index) => {
          switch (element.type) {
            case "code":
              return (
                <div key={index} className="my-4">
                  <div className={`bg-gradient-to-br ${getLanguageGradient(element.language)} dark:from-black dark:via-gray-900 dark:to-black rounded-xl overflow-hidden shadow-glow-sm  border border-slate-600 dark:border-gray-700`}>
                    <div className="bg-gradient-to-r from-slate-800/80 to-gray-800/80 dark:from-gray-900/90 dark:to-black/90 px-4 py-3 flex items-center justify-between border-b border-slate-600/50 dark:border-gray-700/50 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getLanguageIcon(element.language)}</span>
                        <span className="text-xs text-slate-200 dark:text-gray-300 font-mono font-semibold uppercase tracking-wider">
                          {element.language || 'code'}
                        </span>
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span className="text-xs text-slate-400 dark:text-gray-500">
                          {element.content.split('\n').length} lines
                        </span>
                      </div>
                      <button
                        onClick={() => copyMessage(element.content, `code-${index}`)}
                        className="flex items-center space-x-2 px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 text-xs font-medium backdrop-blur-sm"
                        title="Copy code"
                      >
                        {copiedMessageId === `code-${index}` ? (
                          <>
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-green-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span className="hidden sm:block">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-5 bg-gradient-to-br from-slate-900/50 to-gray-900/50 dark:from-black/50 dark:to-gray-900/50 backdrop-blur-sm">
                      <pre className="overflow-x-auto">
                        <code className={`font-mono text-sm leading-relaxed whitespace-pre-wrap ${getLanguageColor(element.language)} filter brightness-110`}>
                          {element.content}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              );

            case "list":
              return (
                <div key={index} className="my-4">
                  <ul className="space-y-3 pl-2">
                    {element.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-start group">
                        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center mr-3 mt-0.5 shadow-md">
                          <span className="text-white text-xs font-bold">
                            {itemIndex + 1}
                          </span>
                        </div>
                        <div className="flex-1 bg-white/60 dark:bg-onyx/60 backdrop-blur-sm rounded-lg p-3 border border-silver/30 dark:border-ash/30 hover:border-orange-300 dark:hover:border-orange-600 transition-all duration-200 hover:shadow-soft-sm group-hover:transform group-hover:scale-[1.01]">
                          <span
                            className="text-sm leading-relaxed text-slate dark:text-pearl"
                            dangerouslySetInnerHTML={{
                              __html: applyInlineFormatting(item),
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );

            case "text":
            default:
              const paragraphs = element.content
                .split("\n\n")
                .filter((p) => p.trim());
              return paragraphs.map((paragraph, pIndex) => {
                const trimmedParagraph = paragraph.trim();

                if (trimmedParagraph.startsWith("# ")) {
                  return (
                    <h1
                      key={`${index}-${pIndex}`}
                      className="text-xl font-bold mb-4 text-slate dark:text-pearl bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent"
                    >
                      {trimmedParagraph.substring(2)}
                    </h1>
                  );
                } else if (trimmedParagraph.startsWith("## ")) {
                  return (
                    <h2
                      key={`${index}-${pIndex}`}
                      className="text-lg font-semibold mb-3 text-slate dark:text-pearl border-l-4 border-orange-400 pl-3"
                    >
                      {trimmedParagraph.substring(3)}
                    </h2>
                  );
                } else if (trimmedParagraph.startsWith("### ")) {
                  return (
                    <h3
                      key={`${index}-${pIndex}`}
                      className="text-md font-semibold mb-2 text-slate dark:text-pearl flex items-center space-x-2"
                    >
                      <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                      <span>{trimmedParagraph.substring(4)}</span>
                    </h3>
                  );
                } else if (trimmedParagraph) {
                  return (
                    <p
                      key={`${index}-${pIndex}`}
                      className="text-sm leading-relaxed mb-3"
                      dangerouslySetInnerHTML={{
                        __html: applyInlineFormatting(trimmedParagraph),
                      }}
                    />
                  );
                }
                return null;
              });
          }
        })}
        {isTyping && typingText && (
          <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse ml-1"></span>
        )}
      </div>
    );
  };

  const renderMessage = (message, index) => {
    const isCurrentlyTyping = isTypingResponse && message.isTyping;

    return (
      <div
        key={message.id}
        className={`flex group ${
          message.sender === "user" ? "justify-end" : "justify-start"
        } animate-fadeIn`}
      >
        <div
          className={`max-w-[85%] rounded-2xl transition-all duration-300 hover:shadow-soft-xl relative ${
            message.sender === "user"
              ? "bg-gradient-to-r from-orange-400 to-amber-500 text-white ml-4 p-4"
              : message.isError
              ? "bg-red-50 border border-red-200 text-red-800 mr-4 p-4"
              : "text-slate dark:text-pearl mr-4 p-4"
          }`}
        >
          <div className="text-sm leading-relaxed">
            {message.isTyping && !isCurrentlyTyping ? (
              <div className="flex items-center space-x-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
                <span className="text-sm text-steel dark:text-ash animate-pulse">
                  Thinking and generating response...
                </span>
              </div>
            ) : message.sender === "bot" ? (
              renderFormattedMessage(message.text, isCurrentlyTyping)
            ) : (
              <div className="whitespace-pre-wrap">{message.text}</div>
            )}
          </div>
          
          {/* Copy button for completed messages */}
          {!message.isTyping && !isCurrentlyTyping && (
            <button
              onClick={() => copyMessage(message.text, message.id)}
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-onyx border border-silver/50 dark:border-ash/30 rounded-lg p-2 shadow-md hover:shadow-lg"
              title="Copy message"
            >
              {copiedMessageId === message.id ? (
                <Check className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate dark:text-pearl" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pearl via-ivory to-cream dark:from-onyx dark:via-charcoal dark:to-midnight font-inter overflow-hidden">
      {/* Enhanced Header */}
      <div className="bg-white/80 dark:bg-onyx/80 backdrop-blur-lg sticky top-0 z-20 shadow-soft-sm border-b border-silver/20 dark:border-ash/20">
        <div className="max-w-7xl mx-auto lg:px-6 px-4 py-3 lg:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <img src={logo} alt="Scholara Ai" className="lg:w-[70%] h-auto w-[calc(100%-6rem)]" />
              </div>
            </div>
            
            {/* Header Controls */}
            <div className="flex items-center space-x-3">
              <div className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-white/50 dark:bg-onyx/50 backdrop-blur-sm rounded-lg border border-silver/30 dark:border-ash/20">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-steel dark:text-ash font-medium">
                  AI Assistant Ready
                </span>
              </div>
              
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-3 rounded-xl bg-white/50 dark:bg-onyx/50 backdrop-blur-sm border border-silver/30 dark:border-ash/20 text-slate dark:text-pearl hover:bg-white/70 dark:hover:bg-onyx/70 transition-all"
                title="Toggle Chat History"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto lg:px-6 lg:py-6 px-0 py-0 flex gap-6 relative lg:h-[calc(100vh-100px)] h-[calc(100vh-75px)]">
        {/* Enhanced Chat History Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 w-80 bg-white/70 dark:bg-charcoal/70 backdrop-blur-lg z-40 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 lg:left-auto lg:z-[30] lg:w-80 lg:block lg:rounded-2xl rounded-r-xl shadow-glow-sm border-r border-silver/20 dark:border-ash/20 lg:border-r-0 lg:border lg:border-silver/20 lg:dark:border-ash/20 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full p-6 flex flex-col">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 lg:hidden p-2 rounded-lg text-slate dark:text-pearl hover:bg-silver/30 dark:hover:bg-ash/30 transition-colors"
              title="Close Sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-6 lg:mt-0 mt-8">
              <h2 className="text-xl font-poppins font-bold text-slate dark:text-pearl">
                Conversations
              </h2>
              <button
                onClick={createNewChat}
                className="p-3 rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-white hover:from-orange-500 hover:to-amber-600 transition-all shadow-soft-md hover:shadow-orange-md transform hover:scale-105"
                title="Start a new chat"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-transparent">
              {chatHistory.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => loadChat(chat.id)}
                  className={`group flex items-start space-x-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] relative ${
                    currentChatId === chat.id
                      ? "bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border border-orange-200 dark:border-orange-700 shadow-soft-md"
                      : "hover:bg-white/60 dark:hover:bg-ash/30 border border-transparent hover:border-silver/30 dark:hover:border-ash/20"
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      currentChatId === chat.id
                        ? "bg-orange-500 text-white"
                        : "bg-silver/30 dark:bg-ash/30 text-steel dark:text-ash group-hover:bg-orange-400 group-hover:text-white"
                    } transition-all`}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        currentChatId === chat.id
                          ? "text-orange-700 dark:text-orange-300"
                          : "text-slate dark:text-pearl"
                      }`}
                    >
                      {chat.title}
                    </p>
                    <p className="text-xs text-steel dark:text-ash mt-1 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{chat.lastUpdated.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>
                        {chat.lastUpdated.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </p>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => deleteChat(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600"
                    title="Delete chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {chatHistory.length === 0 && (
                <div className="text-center py-8 text-steel dark:text-ash">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Chat Main Window */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/30 dark:bg-charcoal/30 backdrop-blur-sm lg:rounded-2xl rounded-none overflow-hidden shadow-glow-sm border-0 border-silver/20 dark:border-ash/20 lg:border lg:border-silver/20 lg:dark:border-ash/20">
          {/* Chat Messages Container */}
          <div className="flex-1 relative">
            <div
              ref={chatContainerRef}
              className="absolute inset-0 overflow-y-auto lg:p-6 p-3 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-transparent"
              onScroll={handleScroll}
            >
              {messages.map((message, index) => renderMessage(message, index))}
              <div ref={messagesEndRef} className="h-4"></div>
            </div>
            
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-6 right-6 p-3 bg-gradient-to-r from-orange-400 to-amber-500 text-white rounded-full shadow-glow-sm hover:shadow-orange-lg transition-all duration-300 transform hover:scale-110 z-10"
                title="Scroll to bottom"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Enhanced Input Section */}
          <div className="p-4 lg:p-6">
            <div className="flex items-end space-x-3 max-w-4xl mx-auto">
              {/* Input Container */}
              <div className="flex-1 bg-white dark:bg-onyx border border-silver/50 dark:border-ash/30 rounded-2xl shadow-glow-sm focus-within:shadow-glow-sm transition-all duration-300 focus-within:border-orange-400 dark:focus-within:border-orange-500">
                <div className="flex items-end p-2">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-transparent text-slate dark:text-pearl placeholder-steel dark:placeholder-ash focus:outline-none resize-none min-h-[56px] max-h-[120px]"
                    placeholder="Type your message here..."
                    disabled={isLoading || isTypingResponse}
                    style={{ height: `${textareaHeight}px` }}
                  />
                  
                  {/* Input Actions */}
                  <div className="flex items-center space-x-2 pl-2">
                    {/* Character count */}
                    {inputMessage.length > 0 && (
                      <span className="text-xs text-steel dark:text-ash px-2 py-1 bg-silver/20 dark:bg-ash/20 rounded-lg">
                        {inputMessage.length}
                      </span>
                    )}
                    
                    {/* Send Button */}
                    <button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputMessage.trim() || isTypingResponse}
                      className="lg:p-3 px-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white lg:rounded-xl rounded-r-xl font-semibold transition-all duration-300 shadow-glow-sm hover:shadow-orange-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transform hover:scale-105 disabled:hover:scale-100 min-w-[40px] lg:min-w-[60px] justify-center"
                    >
                      {isLoading || isTypingResponse ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span className="hidden sm:block text-sm">Sending...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="w-5 h-5" />
                          <span className="hidden sm:block text-sm">Send</span>
                        </div>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Input Footer */}
            <div className="items-center lg:flex hidden justify-between mt-3 text-xs text-steel dark:text-ash max-w-4xl mx-auto px-1">
              <div className="flex items-center space-x-4">
                <span>Press Enter to send, Shift+Enter for new line</span>
                {chatbotStats.ready && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>AI Ready</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {messages.length > 1 && (
                  <span>{messages.filter(m => m.sender === 'user').length} messages</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(251, 146, 60, 0.5);
          border-radius: 9999px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: rgba(251, 146, 60, 0.8);
        }
        
        /* Enhanced focus states */
        .focus-within\\:shadow-glow-md:focus-within {
           box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.3), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        
        /* Smooth transitions for mobile */
        @media (max-width: 1023px) {
          .transform {
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
        }
        
        /* Code syntax highlighting enhancement */
        .bg-clip-text {
          -webkit-background-clip: text;
          background-clip: text;
        }
      `}</style>
    </div>
  );
};

export default ChatBot;