import React, { useState, useEffect, useRef, memo, useCallback } from "react";
import {
  Send,
  Book,
  GraduationCap,
  Sparkles,
  Search,
  FileText,
  School,
  Download,
  Users,
  BookOpen,
  Calendar,
  Award,
  X,
  Clock,
  Upload,
  MessageSquare,
  HelpCircle,
  BarChart2,
  ChevronRight,
  Bot,
  User,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

// Enhanced color scheme with better contrast and modern tones
const colors = {
  primary: {
    light: "bg-gradient-to-r from-amber-500 to-amber-600",
    dark: "bg-gradient-to-r from-amber-600 to-amber-700",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500 dark:border-amber-600",
    hover: "hover:bg-amber-50 dark:hover:bg-gray-800/50",
  },
  secondary: {
    light: "bg-gradient-to-r from-blue-500 to-blue-600",
    dark: "bg-gradient-to-r from-blue-600 to-blue-700",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500 dark:border-blue-600",
  },
  background: {
    light: "bg-gray-50",
    dark: "bg-onyx shadow-glow-sm",
  },
  card: {
    light: "bg-white shadow-sm",
    dark: "bg-charcoal",
  },
  border: {
    light: "border-gray-200",
    dark: "border-gray-700",
  },
  text: {
    primary: {
      light: "text-gray-900",
      dark: "text-gray-100",
    },
    secondary: {
      light: "text-gray-600",
      dark: "text-gray-300",
    },
  },
};

// Modern animated typing indicator with smooth transitions
const TypingIndicator = memo(() => (
  <div className="flex space-x-1.5 px-1 py-1.5">
    {[...Array(3)].map((_, i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-bounce"
        style={{ 
          animationDelay: `${i * 0.2}s`,
          animationDuration: "1s",
          transformOrigin: "bottom"
        }}
      />
    ))}
  </div>
));

const handleEscKey = (event, setIsOpen) => {
  if (event.key === "Escape" || event.key === "Esc") {
    setIsOpen(false);
  }
};



// Enhanced ResourceCard with better styling and hover effects
const ResourceCard = ({ resource }) => {
  const getSubjectColor = (subject) => {
    const colors = {
      Physics: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800/30",
      Chemistry: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800/30",
      Mathematics: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-800/30",
      Biology: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800/30",
      English: "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-100 dark:border-pink-800/30",
      "Computer Science": "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-100 dark:border-indigo-800/30",
      Engineering: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-800/30",
    };
    return colors[subject] || "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600/50";
  };

  if (!resource || Object.keys(resource).length === 0) {
    return (
      <div className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-3 animate-fade-in`}>
        <p className={`${colors.text.secondary.light} dark:${colors.text.secondary.dark} text-sm font-poppins`}>Resource details not available</p>
      </div>
    );
  }

  return (
    <div className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-3 hover:shadow-md transition-all duration-300 font-poppins animate-fade-in group hover:scale-[1.01] hover:border-amber-400/30 dark:hover:border-amber-500/30`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-semibold ${colors.text.primary.light} dark:${colors.text.primary.dark} flex items-center gap-2`}>
          <FileText className="w-4 h-4 text-amber-500 group-hover:text-amber-600 dark:text-amber-400 dark:group-hover:text-amber-300 transition-colors" />
          {resource.title || resource.name || "Untitled Resource"}
        </h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(resource.subject)} transition-colors`}>
          {resource.subject || "General"}
        </span>
      </div>
      <div className={`space-y-2 text-sm ${colors.text.secondary.light} dark:${colors.text.secondary.dark}`}>
        {resource.course && (
          <div className="flex items-center gap-2">
            <BookOpen className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span>Course: {resource.course}</span>
          </div>
        )}
        {resource.year && (
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span>Year: {resource.year}</span>
          </div>
        )}
        {resource.institution && (
          <div className="flex items-center gap-2">
            <School className="w-3 h-3 text-amber-500 flex-shrink-0" />
            <span>{resource.institution}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t ${colors.border.light} dark:${colors.border.dark}">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {resource.downloads || 0}
            </span>
            <span className="flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {resource.averageRating || 0}/5
            </span>
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : "Recent"}
          </span>
        </div>
      </div>
    </div>
  );
};

// Modern AnalyticsCard with gradient and subtle animation
const AnalyticsCard = ({ title, value, icon: Icon }) => (
  <div className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-2 hover:shadow-md transition-all duration-300 font-poppins animate-fade-in hover:scale-[1.02] group`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-sm ${colors.text.secondary.light} dark:${colors.text.secondary.dark}`}>{title}</p>
        <p className={`text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent`}>
          {value}
        </p>
      </div>
      <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10 dark:from-amber-400/10 dark:to-amber-500/10 group-hover:from-amber-500/20 group-hover:to-amber-600/20 dark:group-hover:from-amber-400/20 dark:group-hover:to-amber-500/20 transition-all">
        <Icon className="w-6 h-6 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
      </div>
    </div>
  </div>
);

// Enhanced ChatBubble with better animations and styling
const ChatBubble = memo(({ message, isUser }) => {
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-3 max-w-full animate-fade-in-up`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
      
      <div
        className={`max-w-[90%] sm:max-w-lg p-4 rounded-2xl transition-all duration-300 font-poppins ${
          isUser
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm hover:shadow-md hover:from-blue-600 hover:to-blue-700"
            : `${colors.card.light} dark:${colors.card.dark} ${colors.text.primary.light} dark:${colors.text.primary.dark} rounded-bl-sm border ${colors.border.light} dark:${colors.border.dark} hover:shadow-md hover:border-amber-400/30 dark:hover:border-amber-500/30`
        } ${isUser ? "order-2" : "order-1"}`}
      >
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          {message.sender === "bot" && message.text.includes("**") ? (
            <div
              dangerouslySetInnerHTML={{
                __html: message.text
                  .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                  .replace(/\n/g, "<br/>")
                  .replace(/\* /g, "• "),
              }}
            />
          ) : (
            message.text
          )}
        </div>
        {message.resources && message.resources.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.resources.map((resource, index) => (
              <ResourceCard key={index} resource={resource} />
            ))}
          </div>
        )}
        {message.analytics && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AnalyticsCard title="Total Resources" value={message.analytics.resources || 0} icon={FileText} />
            <AnalyticsCard title="Active Users" value={message.analytics.students || 0} icon={Users} />
            <AnalyticsCard title="Courses" value={message.analytics.courses || 0} icon={BookOpen} />
            <AnalyticsCard title="Universities" value={message.analytics.universities || 0} icon={School} />
          </div>
        )}
        {message.sender === "bot" && (
          <div className={`flex items-center justify-between mt-2 pt-2 border-t ${colors.border.light} dark:${colors.border.dark}`}>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-subtle-pulse"></div>
              <span className={`text-xs ${colors.text.secondary.light} dark:${colors.text.secondary.dark} font-medium`}>
                Scholara Assistant
              </span>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 mt-1.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
});

// Enhanced QuickActionButton with better hover effects
const QuickActionButton = ({ label, query, icon: Icon, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
      disabled
        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        : "bg-gray-100 dark:bg-charcoal text-amber-600 dark:text-amber-400 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 dark:hover:from-gray-700 dark:hover:to-gray-800 border border-transparent hover:border-amber-300 dark:hover:border-gray-600 hover:shadow-sm lg:h-auto "
    } group`}
  >
    <Icon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
    {label}
    <ChevronRight className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
  </button>
);

const ScholaraCollectiveChatbot = ({ isInToggle = false, isMobile = false , setIsOpen }) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [isResourcesLoaded, setIsResourcesLoaded] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedInput, setExpandedInput] = useState(false);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({
        top: chatMessagesRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(savedSearches);
  }, []);

  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    endpoints: {
      resources: "/resources",
      analytics: "/public-stats",
      auth: "/auth",
    },
    geminiApi: {
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent",
      key: import.meta.env.VITE_GEMINI_API_KEY,
    },
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (userInput.length > 2) {
        try {
          const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.resources}?search=${encodeURIComponent(userInput)}&limit=3`);
          if (!response.ok) throw new Error("Failed to fetch suggestions");
          const result = await response.json();
          const fetchedSuggestions = Array.isArray(result.resources)
            ? result.resources.map((r) => ({ _id: r._id, title: r.title }))
            : [];
          setSuggestions(fetchedSuggestions);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [userInput, API_CONFIG.baseUrl, API_CONFIG.endpoints.resources]);

  const KNOWLEDGE_BASE = {
    howToUpload: `**How to Upload Resources on Scholara Collective:**

1. **Login/Register:** Create an account or log in to your existing account
2. **Navigate to Upload:** Click the "Upload Resource" button on the dashboard
3. **Fill Details:**
   • Resource Title (clear and descriptive)
   • Subject (Physics, Chemistry, Mathematics, etc.)
   • Course/Class (e.g., Class 12, B.Tech, NEET, JEE)
   • Institution (optional)
   • Year/Session
   • Resource Type (Notes, Previous Year Papers, Model Answers, etc.)
4. **Upload File:** Select your PDF, image, or document (max 10MB)
5. **Add Tags:** Include relevant keywords for better searchability
6. **Review & Submit:** Check all details and click "Upload Resource"

Your resource will be reviewed within 24 hours before going live!`,

    howToDownload: `**How to Download Resources:**

1. **Browse or Search:** Use the search bar or browse by category
2. **Preview:** Click on any resource to preview it
3. **Download:** Click the download button (no login required for downloading)
4. **Rate & Review:** After downloading, please rate the resource to help others

**Pro Tips:**
• Use specific keywords for better search results
• Check the ratings and comments before downloading
• Save useful resources to your personal library (requires login)`,

    communityGuidelines: `**Community Guidelines & Features:**

**Rating System:**
• Rate resources from 1-5 stars based on quality and usefulness
• Leave constructive comments to help fellow students
• Upvote helpful resources

**Quality Standards:**
• Upload clear, readable content only
• Ensure content is relevant to the specified subject/course
• Avoid duplicate uploads - check existing resources first
• Respect copyright - only upload original or authorized content

**Community Features:**
• Comment on resources to ask questions or provide feedback
• Flag inappropriate or low-quality content for admin review
• Build your reputation by contributing quality resources`,

    platformFeatures: `**Scholara Collective Platform Features:**

**For Students:**
• 🔍 **Smart Search** - Find resources by subject, course, institution, or keywords
• 📚 **Personal Library** - Save and organize your favorite resources
• 📊 **Progress Tracking** - View your upload/download history
• 🌐 **Multi-language Support** - Platform available in multiple languages
• 📱 **Mobile Responsive** - Access from any device

**Resource Types Available:**
• Previous Year Question Papers
• Class Notes & Study Materials
• Model Answers & Solutions
• Revision Sheets & Quick Notes
• Important Questions Collections
• Reference Materials

**Security & Privacy:**
• Secure file uploads with virus scanning
• Privacy controls for your uploads
• GDPR compliant data handling`,

    faq: `**Frequently Asked Questions:**

**Q: Is Scholara Collective free to use?**
A: Yes! Our platform is completely free for both uploading and downloading resources.

**Q: Do I need to create an account?**
A: You can download resources without an account, but you'll need to register to upload, rate, comment, or save resources to your library.

**Q: What file formats are supported?**
A: We support PDF, JPG, PNG, and common document formats. Maximum file size is 10MB.

**Q: How do I report inappropriate content?**
A: Click the "Flag" button on any resource, or contact our moderation team directly.

**Q: Can I edit or delete my uploaded resources?**
A: Yes, you can manage your uploads from your profile dashboard.

**Q: How can I contact support?**
A: Use this chat for instant help, or email us at support@scholaracollective.com

**Q: Is my data safe?**
A: Yes, we use industry-standard encryption and follow strict privacy policies to protect your information.`,
  };

  const fetchResourcesData = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.resources}`);
      if (!response.ok) throw new Error("Failed to fetch resources");
      const result = await response.json();
      const fetchedResources = Array.isArray(result.resources) ? result.resources : [];
      setResources(fetchedResources);
      return fetchedResources;
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.analytics}`);
      if (!response.ok) throw new Error("Failed to fetch analytics");
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  };

  const searchResources = async (params) => {
    const queryParams = new URLSearchParams();
    if (params.subject) queryParams.append('subject', params.subject);
    if (params.course) queryParams.append('course', params.course);
    if (params.institution) queryParams.append('institution', params.institution);
    if (params.resource_type) queryParams.append('type', params.resource_type);
    if (params.keywords) queryParams.append('search', params.keywords);

    const hasSpecificParams = Object.values(params).some(value => value !== null && value !== undefined && value !== '');
    if (!hasSpecificParams) {
        queryParams.append('limit', 5);
        queryParams.append('sort', 'downloads');
    }

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.resources}?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Search failed");
      const result = await response.json();
      return Array.isArray(result.resources) ? result.resources : [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  const callGeminiAPI = async (query) => {
    try {
      if (!API_CONFIG.geminiApi.key) {
        throw new Error("Gemini API key is missing. Please configure it in the environment variables.");
      }
      const response = await fetch(`${API_CONFIG.geminiApi.url}?key=${API_CONFIG.geminiApi.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are Scholara, an academic assistant for the Scholara Collective platform, a hub for students to share and access educational resources. Answer the following user query in a concise, friendly, and professional manner, aligning with the platform's features (searching resources, uploading/downloading, analytics, community guidelines, etc.). If the query is academic or resource-related, provide a helpful response. If unclear, suggest relevant actions like searching for resources or viewing FAQs. Query: "${query}"`,
                },
              ],
            },
          ],
        }),
      });
      if (!response.ok) throw new Error("Gemini API request failed");
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that request. Please try again.";
    } catch (error) {
      console.error("Gemini API error:", error);
      return "⚠️ Sorry, I couldn't process your request right now. Please try again or ask something else!";
    }
  };

  const getChatbotIntent = async (message) => {
    const prompt = `You are an intelligent intent and entity extraction system for a platform called Scholara Collective. Your task is to analyze user queries and determine their primary intent and any relevant parameters (entities).

**Instructions:**
- Respond ONLY with a JSON object. Do NOT include any other text, prose, or markdown outside the JSON.
- If an entity is not mentioned or not applicable for a given intent, set its value to \`null\`.
- If the query implies a search for resources, the intent should be "SEARCH_RESOURCE".
- If the query is a general question not covered by specific intents, the intent should be "GENERAL_CHAT".

**Possible Intents and their Entities:**

1.  **"SEARCH_RESOURCE"**: User wants to find educational resources.
    * \`subject\`: (e.g., "Physics", "Mathematics", "Biology", "Computer Science", "English", "Chemistry", "Engineering")
    * \`course\`: (e.g., "B.Tech", "NEET", "JEE", "Class 12", "Graduation")
    * \`institution\`: (e.g., "IIT Bombay", "Delhi University")
    * \`resource_type\`: (e.g., "notes", "papers", "model answers", "study materials", "revision sheets")
    * \`keywords\`: (any other specific terms in the query relevant to the search)

2.  **"GET_ANALYTICS"**: User wants to view platform statistics.

3.  **"UPLOAD_GUIDE"**: User wants to know how to upload resources.

4.  **"DOWNLOAD_GUIDE"**: User wants to know how to download resources.

5.  **"COMMUNITY_GUIDELINES"**: User wants information about community rules, ratings, or reviews.

6.  **"PLATFORM_FEATURES"**: User wants to know about the platform's overall functionalities.

7.  **"FAQ"**: User is asking a frequently asked question or seeking general help/support.

8.  **"GREETING"**: User is saying hello or a general salutation.

9.  **"GENERAL_CHAT"**: Default for queries not matching specific intents.

**Example Query and Expected JSON Output:**

Query: "Where do I find notes for organic chemistry from IIT Bombay for second-year students?"
Output:
\`\`\`json
{
  "intent": "SEARCH_RESOURCE",
  "entities": {
    "subject": "Chemistry",
    "course": "second-year",
    "institution": "IIT Bombay",
    "resource_type": "notes",
    "keywords": "organic"
  }
}
\`\`\`

Query: "What are the active users on Scholara?"
Output:
\`\`\`json
{
  "intent": "GET_ANALYTICS",
  "entities": null
}
\`\`\`

Query: "Tell me how to contribute"
Output:
\`\`\`json
{
  "intent": "UPLOAD_GUIDE",
  "entities": null
}
\`\`\`

Query: "Hi there, assistant"
Output:
\`\`\`json
{
  "intent": "GREETING",
  "entities": null
}
\`\`\`

Query: "Tell me a joke"
Output:
\`\`\`json
{
  "intent": "GENERAL_CHAT",
  "entities": null
}
\`\`\`

---
Now, analyze the following user query: "${message}"
Output:
\`\`\`
`;

    try {
      if (!API_CONFIG.geminiApi.key) {
        throw new Error("Gemini API key is missing. Please configure it in the environment variables.");
      }
      const response = await fetch(`${API_CONFIG.geminiApi.url}?key=${API_CONFIG.geminiApi.key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
              ],
            },
          ],
        }),
      });
      if (!response.ok) throw new Error("Gemini intent API request failed");
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanedText = rawText.replace(/```json\n|\n```/g, '').trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Gemini Intent/Entity extraction error:", error);
      return { intent: "GENERAL_CHAT", entities: null };
    }
  };

  const processUserQuery = useCallback(async (message) => {
    let parsedIntent;
    try {
        parsedIntent = await getChatbotIntent(message);
    } catch (error) {
        console.error("Error getting chatbot intent:", error);
        parsedIntent = { intent: "GENERAL_CHAT", entities: null };
    }

    const { intent, entities } = parsedIntent;

    switch (intent) {
        case "SEARCH_RESOURCE":
            const searchParams = {
                subject: entities?.subject,
                course: entities?.course,
                institution: entities?.institution,
                resource_type: entities?.resource_type,
                keywords: entities?.keywords
            };
            if (!searchParams.keywords && !searchParams.subject && !searchParams.course && !searchParams.institution && !searchParams.resource_type) {
                searchParams.keywords = message;
            }

            const searchResults = await searchResources(searchParams);

            if (searchResults.length > 0) {
                return {
                    text: `🔍 **Found ${searchResults.length} resources matching your request!**\n\nHere are some of the top matches. Click download to access them instantly!`,
                    resources: searchResults.slice(0, 5),
                };
            } else {
                return {
                    text: `No resources directly matching your specific request were found. However, I can still help you!\n\nTry these tips for better results:\n• Use more precise subjects (e.g., "Quantum Physics" instead of "Physics")\n• Specify the course or year (e.g., "B.Sc. Chemistry" or "Class 12")\n• Check for typos\n\nWould you like me to show you some **popular ${entities?.resource_type || 'academic'} resources** instead?`,
                };
            }

        case "GET_ANALYTICS":
            const analyticsData = await fetchAnalyticsData();
            return {
                text: `📊 **Platform Analytics Dashboard**\n\nHere's a quick overview of our platform's current statistics:`,
                analytics: analyticsData,
            };

        case "UPLOAD_GUIDE":
            return { text: KNOWLEDGE_BASE.howToUpload };

        case "DOWNLOAD_GUIDE":
            return { text: KNOWLEDGE_BASE.howToDownload };

        case "COMMUNITY_GUIDELINES":
            return { text: KNOWLEDGE_BASE.communityGuidelines };

        case "PLATFORM_FEATURES":
            return { text: KNOWLEDGE_BASE.platformFeatures };

        case "FAQ":
            return { text: KNOWLEDGE_BASE.faq };

        case "GREETING":
            return {
                text: `👋 **Hello! Welcome to Scholara Collective!**\n\nI'm Scholara, your personal academic assistant. I can help you with:\n\n• 🔍 **Finding Study Resources** - Notes, papers, and materials\n• 📊 **Platform Insights** - View analytics and statistics  \n• 📤 **Upload Resources** - Learn how to contribute and share\n• ❓ **Get Support** - FAQs and community guidelines\n\nWhat would you like to explore today?`,
            };

        case "GENERAL_CHAT":
        default:
            const geminiResponse = await callGeminiAPI(message);
            return { text: geminiResponse };
    }
  }, [getChatbotIntent, searchResources, fetchAnalyticsData, callGeminiAPI, KNOWLEDGE_BASE]);

  useEffect(() => {
    let isMounted = true;

    const initializeChatbot = async () => {
      setIsLoading(true);
      try {
        await fetchResourcesData();
        if (isMounted) {
          setIsResourcesLoaded(true);
          setMessages([
            {
              text: "🎓 **Welcome to Scholara Collective!**\n\nI'm Scholara, your personal academic assistant. I'm here to help you:\n\n• 🔍 **Find Study Resources** - Search for notes, papers, and materials\n• 📊 **Platform Insights** - View analytics and statistics  \n• 📤 **Upload Resources** - Learn how to contribute and share\n• ❓ **Get Support** - FAQs and community guidelines\n\nWhat would you like to explore today?",
              sender: "bot",
            },
          ]);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMounted) {
          setMessages([
            {
              text: "⚠️ Having trouble connecting to our servers. Please try again later or contact support.",
              sender: "bot",
            },
          ]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeChatbot();

    return () => {
      isMounted = false;
    };
  }, []);

  const sendMessage = useCallback(async () => {
    const message = userInput.trim();
    if (!message || isLoading) return;

    const userMessage = { text: message, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);
    setExpandedInput(false);

    const updatedSearches = [message, ...recentSearches.filter((item) => item !== message).slice(0, 4)];
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

    try {
      const response = await processUserQuery(message);
      setMessages((prev) => [...prev, { ...response, sender: "bot" }]);
    } catch (error) {
      console.error("Error processing query:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Something went wrong while processing your request. Please try again or contact support.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, recentSearches, processUserQuery]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Escape") {
      setUserInput("");
      inputRef.current.blur();
    }
  };

  const toggleInputExpansion = () => {
    setExpandedInput(!expandedInput);
    setTimeout(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTo({
          top: chatMessagesRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const quickActions = [
    { label: "Find Resources", query: "Find physics notes", icon: Search },
    { label: "Platform Stats", query: "Show platform analytics", icon: BarChart2 },
    { label: "Upload Guide", query: "How to upload resources", icon: Upload },
    { label: "Get Help", query: "FAQ", icon: HelpCircle },
  ];

  return (
    <div className={`flex h-screen flex-col custom-scrollbar overflow-hidden ${colors.background.light} dark:${colors.background.dark} font-poppins transition-colors duration-300`} onKeyDown={(e) => handleEscKey(e, setIsOpen)}>
      {!isInToggle && (
        <div className={`${colors.primary.light} dark:${colors.primary.dark} p-4 sm:p-5 border-b ${colors.border.light} dark:${colors.border.dark} shadow-lg`}>
          <div className="relative flex items-center justify-center space-x-3">
            <div className="relative">
              {isLoading ? (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-400 rounded-full animate-subtle-pulse"></div>
              ) : (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full animate-subtle-pulse"></div>
              )}
            </div>
            <div className="text-center">
              <X className="lg:hidden absolute -top-1 -right-1 w-5 h-5  text-charcoal bg-white rounded-full p-1" onClick={() =>setIsOpen(false)} />
              <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2 justify-center">
                Scholara Collective <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
              </h1>
              <p className="text-amber-100 text-sm font-medium flex items-center gap-1 justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-amber-200" /> Academic Resource Assistant
              </p>
            </div>
          </div>
        </div>
      )}

      <div
        ref={chatMessagesRef}
        className={`flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar ${colors.background.light} dark:${colors.background.dark} space-y-4`}
      >
        {!isResourcesLoaded && (
          <div className="flex justify-start animate-fade-in">
            <div className={`${colors.card.light} dark:${colors.card.dark} p-4 rounded-2xl rounded-bl-md border ${colors.border.light} dark:${colors.border.dark} flex items-center space-x-3`}>
              <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500" />
              <span className={`text-sm font-medium ${colors.text.primary.light} dark:${colors.text.primary.dark}`}>
                Loading academic resources...
              </span>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <ChatBubble key={index} message={message} isUser={message.sender === "user"} />
        ))}

        {isLoading && (
          <div className="flex justify-start items-start gap-3">
            <div className="flex-shrink-0 mt-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className={`${colors.card.light} dark:${colors.card.dark} p-4 rounded-2xl rounded-bl-md border ${colors.border.light} dark:${colors.border.dark}`}>
              <TypingIndicator />
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 ${colors.card.light} dark:bg-onyx border-t ${colors.border.light} dark:${colors.border.dark} shadow-lg`}>
        <div className="relative max-w-[1150px] mx-auto">
          <div className="flex items-center space-x-3 mb-3">
            <div className="absolute inset-y-0 left-2 pl-3 flex items-center pointer-events-none">
              <Search className="text-amber-500 dark:text-amber-400" size={20} />
            </div>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Ask about resources, platform features, or upload help..."
              className={`flex-1 pl-10 pr-10 py-3 rounded-lg ${colors.card.light} placeholder:text-xs custom-scrollbar dark:${colors.card.dark} ${colors.text.primary.light} dark:${colors.text.primary.dark} border ${colors.border.light} dark:${colors.border.dark} focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 placeholder:${colors.text.secondary.light} dark:placeholder:${colors.text.secondary.dark} shadow-inner resize-none ${expandedInput ? 'min-h-[100px]' : 'min-h-[48px] max-h-[200px]'}`}
              disabled={isLoading}
              rows={1}
            />
            <button
              onClick={toggleInputExpansion}
              className={`absolute right-14 top-1/2 transform -translate-y-1/2 p-1 rounded-md transition-colors ${colors.hover} ${expandedInput ? 'text-amber-500' : 'text-gray-400'}`}
            >
              {expandedInput ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {userInput && (
              <button
                type="button"
                onClick={() => setUserInput("")}
                className="absolute inset-y-0 right-12 pr-3 flex items-center"
              >
                <X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" size={20} />
              </button>
            )}
            <button
              onClick={sendMessage}
              className={`p-3 rounded-lg transition-all duration-200 ${
                isLoading || userInput.trim() === ""
                  ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : `${colors.primary.light} dark:${colors.primary.dark} text-white hover:shadow-md active:scale-95 shadow-sm`
              }`}
              disabled={isLoading || userInput.trim() === ""}
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="w-5 h-5" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {(showSuggestions && (suggestions.length > 0 || recentSearches.length > 0)) && (
            <div className={`absolute z-50 mt-1 w-full max-w-[calc(100%-4rem)] ${colors.card.light} dark:${colors.card.dark} rounded-lg border custom-scrollbar ${colors.border.light} dark:${colors.border.dark} max-h-60 overflow-auto shadow-xl`}>
              {suggestions.length > 0 && (
                <>
                  <div className={`px-3 py-2 text-xs font-medium ${colors.text.secondary.light} dark:${colors.text.secondary.dark} border-b ${colors.border.light} dark:${colors.border.dark} sticky top-0 ${colors.card.light} dark:${colors.card.dark}`}>
                    Suggested Resources
                  </div>
                  {suggestions.map((item) => (
                    <div
                      key={item._id}
                      className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${colors.text.primary.light} dark:${colors.text.primary.dark} transition-colors`}
                      onMouseDown={() => {
                        setUserInput(item.title);
                        inputRef.current.focus();
                      }}
                    >
                      <FileText size={16} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </>
              )}
              {recentSearches.length > 0 && (
                <>
                  <div className={`px-3 py-2 text-xs font-medium ${colors.text.secondary.light} dark:${colors.text.secondary.dark} border-b ${colors.border.light} dark:${colors.border.dark} sticky top-0 ${colors.card.light} dark:${colors.card.dark}`}>
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center gap-2 ${colors.text.primary.light} dark:${colors.text.primary.dark} transition-colors`}
                      onMouseDown={() => {
                        setUserInput(search);
                        inputRef.current.focus();
                      }}
                    >
                      <Clock size={16} className="text-amber-500 flex-shrink-0" />
                      <span className="truncate">{search}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

<div className="flex flex-nowrap lg:flex-wrap h-9 lg:h-auto overflow-x-auto lg:overflow-hidden custom-scrollbar w-full gap-2 mt-3">
          {quickActions.map((action, index) => (
            <QuickActionButton
              key={index}
              label={action.label}
              query={action.query}
              icon={action.icon}
              onClick={() => {
                setUserInput(action.query);
                inputRef.current.focus();
              }}
              disabled={isLoading}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScholaraCollectiveChatbot;