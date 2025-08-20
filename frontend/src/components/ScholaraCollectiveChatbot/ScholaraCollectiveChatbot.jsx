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
  ChevronUp,
  Brain,
  Target,
  TrendingUp,
  Camera,
  Mic,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Image,
  AlertTriangle,
  CheckCircle2,
  Star,
  Bookmark,
  Share2,
  Settings,
  Moon,
  Sun,
  Lightbulb,
  Zap,
  Globe,
  PieChart,
  BarChart3,
  Activity,
  Timer,
  Shuffle,
  RefreshCw,
  Link,
  Copy,
  ExternalLink,
  Filter,
  SortDesc,
  Tag,
  Layers,
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
    dark: "bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx shadow-glow-sm",
  },
  card: {
    light: "bg-white shadow-sm",
    dark: "bg-charcoal",
  },
  border: {
    light: "border-gray-200",
    dark: "border-charcoal/60",
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
          transformOrigin: "bottom",
        }}
      />
    ))}
  </div>
));

// Enhanced Learning Analytics Component
const LearningAnalytics = ({ analytics }) => {
  if (!analytics) return null;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-blue-200 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h4 className="font-semibold text-blue-900 dark:text-blue-100">
          Learning Insights
        </h4>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics.studyTime || 0}h
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Study Time
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics.topicsExplored || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Topics</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics.goalsAchieved || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Goals</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {analytics.streak || 0}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Day Streak
          </div>
        </div>
      </div>
    </div>
  );
};

// Interactive Quiz Component
const QuizComponent = ({ quiz, onAnswer, onQuizComplete }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);

  // Add defensive check for the quiz object and its questions
  if (!quiz || !quiz.questions || !Array.isArray(quiz.questions)) {
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const handleAnswerSelection = (selectedIndex) => {
    setSelectedAnswer(selectedIndex);
    setShowExplanation(true);

    const isCorrect = selectedIndex === currentQuestion.correctAnswer;
    const newAnswer = {
      questionIndex: currentQuestionIndex,
      selectedAnswer: selectedIndex,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: isCorrect,
    };

    setUserAnswers((prev) => [...prev, newAnswer]);
    onAnswer && onAnswer(isCorrect, currentQuestionIndex);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      // Quiz completed
      const finalScore = userAnswers.reduce(
        (score, answer) => score + (answer.isCorrect ? 1 : 0),
        0
      );
      onQuizComplete &&
        onQuizComplete({
          score:
            finalScore +
            (selectedAnswer === currentQuestion.correctAnswer ? 1 : 0),
          total: quiz.questions.length,
          answers: [
            ...userAnswers,
            {
              questionIndex: currentQuestionIndex,
              selectedAnswer: selectedAnswer,
              correctAnswer: currentQuestion.correctAnswer,
              isCorrect: selectedAnswer === currentQuestion.correctAnswer,
            },
          ],
        });
    } else {
      // Go to next question
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-green-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
          <h4 className="font-semibold text-green-900 dark:text-green-100">
            {quiz.title || "Quick Quiz"}
          </h4>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </div>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-gray-800 dark:text-gray-200">
          {currentQuestion.question}
        </p>

        <div className="space-y-2">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelection(index)}
              disabled={selectedAnswer !== null}
              className={`w-full p-3 text-left rounded-lg border transition-all ${
                selectedAnswer === null
                  ? "border-gray-300 hover:border-green-400 hover:bg-green-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  : selectedAnswer === index
                  ? index === currentQuestion.correctAnswer
                    ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                    : "border-red-500 bg-red-100 dark:bg-red-900/30"
                  : index === currentQuestion.correctAnswer
                  ? "border-green-500 bg-green-100 dark:bg-green-900/30"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </div>
            </button>
          ))}
        </div>

        {showExplanation && currentQuestion.explanation && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Explanation:</strong> {currentQuestion.explanation}
            </p>
          </div>
        )}

        {showExplanation && (
          <div className="flex justify-end mt-4">
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              {isLastQuestion ? "Finish Quiz" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Study Plan Component
const StudyPlanComponent = ({ plan }) => {
  console.log("StudyPlanComponent received plan:", plan); // Debug log

  // Fix the condition - check for plan.phases instead of plan.length
  if (
    !plan ||
    !plan.phases ||
    !Array.isArray(plan.phases) ||
    plan.phases.length === 0
  ) {
    console.log("No valid plan data"); // Debug log
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-purple-200 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        <h4 className="font-semibold text-purple-900 dark:text-purple-100">
          {plan.title || "Personalized Study Plan"}
        </h4>
      </div>

      {/* Add plan metadata */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <p>Duration: {plan.duration}</p>
        <p>Subject: {plan.subject}</p>
      </div>

      <div className="space-y-3">
        {plan.phases.map((phase, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border"
          >
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {phase.phase || index + 1}
              </span>
            </div>
            <div className="flex-1">
              <h5 className="font-medium text-gray-800 dark:text-gray-200">
                {phase.title}
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {phase.description}
              </p>

              {/* Show objectives if they exist */}
              {phase.objectives && phase.objectives.length > 0 && (
                <div className="mt-2">
                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Objectives:
                  </h6>
                  <ul className="text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                    {phase.objectives.map((objective, objIndex) => (
                      <li key={objIndex}>{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Show topics if they exist */}
              {phase.topics && phase.topics.length > 0 && (
                <div className="mt-2">
                  <h6 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Topics:
                  </h6>
                  <div className="flex flex-wrap gap-1">
                    {phase.topics.map((topic, topicIndex) => (
                      <span
                        key={topicIndex}
                        className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {phase.duration && (
                <div className="flex items-center gap-1 mt-2">
                  <Timer className="w-4 h-4 text-purple-500" />
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    {phase.duration}
                  </span>
                </div>
              )}

              {phase.dailyStudyTime && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Daily Study Time: {phase.dailyStudyTime}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show overall goals and tips */}
      {plan.overallGoals && plan.overallGoals.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h6 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
            Overall Goals:
          </h6>
          <ul className="text-sm text-blue-700 dark:text-blue-300 list-disc list-inside">
            {plan.overallGoals.map((goal, index) => (
              <li key={index}>{goal}</li>
            ))}
          </ul>
        </div>
      )}

      {plan.tips && plan.tips.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h6 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            Study Tips:
          </h6>
          <ul className="text-sm text-green-700 dark:text-green-300 list-disc list-inside">
            {plan.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// File Upload Component
const FileUploadComponent = ({ onFileUpload, isProcessing }) => {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files) => {
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      className={`mt-3 p-6 border-2 border-dashed rounded-xl transition-all ${
        dragActive
          ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20"
          : "border-gray-300 dark:border-gray-600 hover:border-amber-400"
      } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={false}
        onChange={(e) => handleFiles(e.target.files)}
        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        className="hidden"
      />
      <div className="text-center cursor-pointer">
        {isProcessing ? (
          <div className="flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faSpinner} spin className="text-amber-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Processing document...
            </span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a document for analysis (PDF, DOC, images)
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Drag & drop or click to select
            </p>
          </>
        )}
      </div>
    </div>
  );
};

// AI Suggestions Component
const AISuggestions = ({ suggestions, onSelectSuggestion }) => {
  if (!suggestions || !suggestions.length) return null;

  return (
    <div className="mt-3 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-cyan-200 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
        <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
          AI Suggestions
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion)}
            className="px-3 py-1 text-xs bg-white dark:bg-gray-700 border border-cyan-200 dark:border-gray-600 rounded-full hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-gray-600 transition-all"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

const handleEscKey = (event, setIsOpen) => {
  if (event.key === "Escape" || event.key === "Esc") {
    setIsOpen(false);
  }
};

// Enhanced ResourceCard with better styling, hover effects, and a clickable link
const ResourceCard = ({ resource, isExternal = false }) => {
  const getSubjectColor = (subject) => {
    const colors = {
      Physics:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-100 dark:border-blue-800/30",
      Chemistry:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-100 dark:border-green-800/30",
      Mathematics:
        "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-100 dark:border-purple-800/30",
      Biology:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:border-emerald-800/30",
      English:
        "bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-100 dark:border-pink-800/30",
      "Computer Science":
        "bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-100 dark:border-indigo-800/30",
      Engineering:
        "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-100 dark:border-orange-800/30",
    };
    return (
      colors[subject] ||
      "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700/50 dark:text-gray-200 dark:border-gray-600/50"
    );
  };

  if (!resource || Object.keys(resource).length === 0) {
    return (
      <div
        className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-3 animate-fade-in`}
      >
        <p
          className={`${colors.text.secondary.light} dark:${colors.text.secondary.dark} text-sm font-poppins`}
        >
          Resource details not available
        </p>
      </div>
    );
  }

  const resourceLink = isExternal
    ? resource.url
    : resource.downloadUrl || `/resources/${resource._id}`;
  const title =
    resource.title ||
    resource.name ||
    resource.source_title ||
    "Untitled Resource";
  const snippet =
    resource.snippet ||
    (resource.course
      ? `Course: ${resource.course}`
      : "Click to view more details.");

  return (
    <div
      className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-3 hover:shadow-md transition-all duration-300 font-poppins animate-fade-in group hover:scale-[1.01] hover:border-amber-400/30 dark:hover:border-amber-500/30`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4
          className={`font-semibold ${colors.text.primary.light} dark:${colors.text.primary.dark} flex items-center gap-2`}
        >
          <FileText className="w-4 h-4 text-amber-500 group-hover:text-amber-600 dark:text-amber-400 dark:group-hover:text-amber-300 transition-colors" />
          {title}
        </h4>
        {resource.subject && (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(
              resource.subject
            )} transition-colors`}
          >
            {resource.subject}
          </span>
        )}
      </div>
      <div
        className={`space-y-2 text-sm ${colors.text.secondary.light} dark:${colors.text.secondary.dark}`}
      >
        <p className="line-clamp-2">{snippet}</p>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs">
            {isExternal ? (
              <span className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                <Search className="w-3 h-3 flex-shrink-0" />
                <span>Web Result</span>
              </span>
            ) : (
              <>
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  {resource.downloads || 0}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  {resource.averageRating || 0}/5
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Handle bookmark
              }}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Bookmark className="w-3 h-3 text-gray-400 hover:text-amber-500" />
            </button>
            <a
              href={resourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Open resource"
            >
              <ExternalLink className="w-3 h-3 text-gray-400 hover:text-blue-500" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modern AnalyticsCard with gradient and subtle animation
const AnalyticsCard = ({ title, value, icon: Icon, trend }) => (
  <div
    className={`${colors.card.light} dark:${colors.card.dark} rounded-xl border ${colors.border.light} dark:${colors.border.dark} p-4 my-2 hover:shadow-md transition-all duration-300 font-poppins animate-fade-in hover:scale-[1.02] group`}
  >
    <div className="flex items-center justify-between">
      <div>
        <p
          className={`text-sm ${colors.text.secondary.light} dark:${colors.text.secondary.dark}`}
        >
          {title}
        </p>
        <div className="flex items-center gap-2">
          <p
            className={`text-2xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent`}
          >
            {value}
          </p>
          {trend && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                trend > 0
                  ? "bg-green-100 text-green-600"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {trend > 0 ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>
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
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } items-start gap-3 max-w-full animate-fade-in-up`}
    >
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
            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-sm hover:shadow-glow-sm hover:from-blue-600 hover:to-blue-700"
            : `${colors.card.light} dark:${colors.card.dark} shadow-glow-sm  ${colors.text.primary.light} dark:${colors.text.primary.dark} rounded-bl-sm border ${colors.border.light} dark:border-amber-500/30 hover:shadow-glow-sm hover:border-amber-400/30 dark:hover:border-amber-500/30`
        } ${isUser ? "order-2" : "order-1"}`}
      >
        <div className="text-sm leading-relaxed prose prose-sm max-w-none">
          {message.sender === "bot" &&
          message.text &&
          message.text.includes("**") ? (
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

        {/* Enhanced features */}
        {message.resources && message.resources.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.resources.map((resource, index) => (
              <ResourceCard
                key={resource.id || index}
                resource={resource}
                isExternal={resource.isExternal}
              />
            ))}
          </div>
        )}

        {message.analytics && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <AnalyticsCard
              title="Total Resources"
              value={message.analytics.resources || 0}
              icon={FileText}
              trend={message.analytics.resourcesTrend}
            />
            <AnalyticsCard
              title="Active Users"
              value={message.analytics.students || 0}
              icon={Users}
              trend={message.analytics.usersTrend}
            />
            <AnalyticsCard
              title="Courses"
              value={message.analytics.courses || 0}
              icon={BookOpen}
            />
            <AnalyticsCard
              title="Universities"
              value={message.analytics.universities || 0}
              icon={School}
            />
          </div>
        )}

        {/* New enhanced components */}
        {message.learningAnalytics && (
          <LearningAnalytics analytics={message.learningAnalytics} />
        )}

        {message.quiz && (
          <QuizComponent
            quiz={message.quiz}
            onAnswer={(isCorrect, questionIndex) =>
              console.log(`Question ${questionIndex + 1} answered:`, isCorrect)
            }
            onQuizComplete={(results) => {
              console.log("Quiz completed!", results);
              // Handle quiz completion - maybe show score, save results, etc.
            }}
          />
        )}

        {message.studyPlan && <StudyPlanComponent plan={message.studyPlan} />}

        {message.aiSuggestions && (
          <AISuggestions
            suggestions={message.aiSuggestions}
            onSelectSuggestion={(suggestion) =>
              console.log("Suggestion selected:", suggestion)
            }
          />
        )}

        {message.sender === "bot" && (
          <div
            className={`flex items-center justify-between mt-2 pt-2 border-t ${colors.border.light} dark:${colors.border.dark}`}
          >
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-subtle-pulse"></div>
              <span
                className={`text-xs ${colors.text.secondary.light} dark:${colors.text.secondary.dark} font-medium`}
              >
                Scholara Assistant
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Handle message rating
                }}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Star className="w-3 h-3 text-gray-400 hover:text-amber-500" />
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {new Date().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
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
const QuickActionButton = ({
  label,
  query,
  icon: Icon,
  onClick,
  disabled,
  category,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-1.5 text-xs rounded-lg transition-all duration-300 flex items-center gap-1.5 ${
      disabled
        ? "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
        : `bg-gray-100 dark:bg-charcoal text-amber-600 dark:text-amber-400 hover:bg-gradient-to-r hover:from-amber-50 hover:to-amber-100 dark:hover:from-gray-700 dark:hover:to-gray-800 border border-transparent hover:border-amber-300 dark:hover:border-gray-600 hover:shadow-sm lg:h-auto ${
            category ? "border-l-4 border-l-blue-400" : ""
          }`
    } group`}
  >
    <Icon className="w-4 h-4 text-amber-500 dark:text-amber-400 group-hover:text-amber-600 dark:group-hover:text-amber-300 transition-colors" />
    {label}
    <ChevronRight className="w-3 h-3 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 transition-transform" />
  </button>
);

const ScholaraAdvancedChatbot = ({
  isInToggle = false,
  isMobile = false,
  setIsOpen,
  isOpen
}) => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [isResourcesLoaded, setIsResourcesLoaded] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedInput, setExpandedInput] = useState(false);
  // State for tracking touch gestures
  const [isDragging, setIsDragging] = useState(false);
  const [dragY, setDragY] = useState(0);
  const startY = useRef(0);

  useEffect(()=>{
    if(isOpen){
      document.body.style.overflow = "hidden"
    }
    else{
      document.body.style.overflow = "auto"
    }
  },[])


const handleTouchStart = (e) => {
    // Only start dragging on a downward motion
    if (e.touches[0].clientY > startY.current) {
        startY.current = e.touches[0].clientY;
        setIsDragging(true);
        document.body.style.overflow = "hidden"; // Prevent background scroll
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      const currentY = e.touches[0].clientY;
      const newDragY = currentY - startY.current;

      // Only allow dragging downwards
      if (newDragY > 0) {
        setDragY(newDragY);
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    document.body.style.overflow = "auto"; // Re-enable background scroll

    const dragThreshold = 100; // Drag 100px to dismiss
    if (dragY > dragThreshold) {
      setIsOpen(false);
    }
    setDragY(0); // Reset drag position
  };

  useEffect(() => {
    // Attach event listeners to the window to track drag even if the finger leaves the header
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging]); 

  // Enhanced state for new features
  const [userProfile, setUserProfile] = useState({
    name: "Student",
    academicLevel: "undergraduate",
    interests: ["Computer Science", "Mathematics"],
    learningStyle: "visual",
    goals: [],
    studyStreak: 0,
    totalStudyTime: 0,
  });
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [activeFeature, setActiveFeature] = useState("chat");
  const [contextualSuggestions, setContextualSuggestions] = useState([]);
  const [learningPath, setLearningPath] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);

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
    const savedSearches =
      JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentSearches(savedSearches);

    // Load user profile from localStorage
    const savedProfile = JSON.parse(localStorage.getItem("userProfile"));
    if (savedProfile) {
      setUserProfile(savedProfile);
    }
  }, []);

  const API_CONFIG = {
    baseUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    endpoints: {
      resources: "/resources",
      analytics: "/public-stats",
      auth: "/auth",
      geminiProxy: "/gemini-proxy",
      searchProxy: "/search-proxy",
      documentAnalysis: "/analyze-document",
      generateQuiz: "/generate-quiz",
      studyPlan: "/generate-study-plan",
      personalAnalytics: "/user-analytics",
    },
  };

  // Generate contextual AI suggestions
  const generateContextualSuggestions = async (input, profile) => {
    try {
      const prompt = `Based on the user query "${input}" and their academic profile (interests: ${profile.interests.join(
        ", "
      )}, level: ${
        profile.academicLevel
      }), suggest 3 relevant follow-up questions or topics they might want to explore.`;

      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.geminiProxy}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: chatHistory }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        const suggestions = result.candidates?.[0]?.content?.parts?.[0]?.text
          ?.split("\n")
          .filter((s) => s.trim());
        return suggestions?.slice(0, 3) || [];
      }
    } catch (error) {
      console.error("Error generating contextual suggestions:", error);
    }
    return [];
  };

  // Enhanced knowledge base with more comprehensive content
  const ENHANCED_KNOWLEDGE_BASE = {
    // Add KNOWLEDGE_BASE here since it was referenced but not defined in the enhanced version
    howToUpload: `**How to Upload Resources on Scholara Collective:**

  1. **Login/Register:** Create an account or log in to your existing account
  2. **Navigate to Upload:** Click the "Upload Resource" button on the dashboard or go to the [Upload Page](/upload).
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
  2. **Preview:** Click on any resource to preview it (by clicking the resource card in chat).
  3. **Download:** Click the download button on the resource page (no login required for downloading)
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

    studyTechniques: `**Advanced Study Techniques & Methods:**

  **🧠 Active Learning Strategies:**
  • **Spaced Repetition** - Review material at increasing intervals
  • **Feynman Technique** - Explain concepts in simple terms
  • **Active Recall** - Test yourself without looking at notes
  • **Interleaving** - Mix different topics in study sessions

  **📊 Memory Enhancement:**
  • **Visual Mind Maps** - Create graphical representations
  • **Mnemonics** - Use memory aids and acronyms
  • **Elaborative Rehearsal** - Connect new info to existing knowledge
  • **Dual Coding** - Combine visual and verbal information

  **⏰ Time Management:**
  • **Pomodoro Technique** - 25-minute focused study blocks
  • **Time Blocking** - Dedicated time slots for subjects
  • **Priority Matrix** - Urgent vs Important task classification
  • **Energy Management** - Study during peak performance hours`,

    careerGuidance: `**Academic Career Guidance:**

  **🎯 Goal Setting Framework:**
  • **SMART Goals** - Specific, Measurable, Achievable, Relevant, Time-bound
  • **Long-term Vision** - 5-10 year academic and career objectives
  • **Milestone Tracking** - Regular progress checkpoints
  • **Skill Development** - Technical and soft skills roadmap

  **📈 Academic Pathways:**
  • **Undergraduate Planning** - Course selection and major decisions
  • **Graduate School Prep** - Research experience and applications
  • **Industry Connections** - Internships and networking
  • **Alternative Paths** - Entrepreneurship and self-directed learning`,

    researchSkills: `**Research & Citation Skills:**

  **🔍 Research Methodology:**
  • **Source Evaluation** - Credibility and bias assessment
  • **Literature Review** - Systematic information gathering
  • **Data Analysis** - Quantitative and qualitative methods
  • **Academic Writing** - Structure and argumentation

  **📚 Citation & Referencing:**
  • **APA Style** - Psychology and social sciences
  • **MLA Format** - Literature and humanities
  • **Chicago Style** - History and fine arts
  • **IEEE Format** - Engineering and technology
  • **Plagiarism Prevention** - Proper attribution techniques`,
  };

  // Enhanced resource fetching with personalization
  const fetchResourcesData = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${
          API_CONFIG.endpoints.resources
        }?personalized=true&userId=${userProfile.id || "anonymous"}`
      );
      if (!response.ok) throw new Error("Failed to fetch resources");
      const result = await response.json();
      const fetchedResources = Array.isArray(result.resources)
        ? result.resources
        : [];
      return fetchedResources;
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  };

  // Enhanced analytics with learning insights
  const fetchAnalyticsData = async () => {
    try {
      const [publicStats, personalStats] = await Promise.all([
        fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.analytics}`),
        userProfile.id
          ? fetch(
              `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.personalAnalytics}?userId=${userProfile.id}`
            )
          : Promise.resolve({ ok: false }),
      ]);

      const publicResult = publicStats.ok ? await publicStats.json() : {};
      const personalResult = personalStats.ok ? await personalStats.json() : {};

      return {
        ...publicResult,
        personalInsights: personalResult,
        learningAnalytics: {
          studyTime: personalResult.totalStudyTime || 0,
          topicsExplored: personalResult.topicsCount || 0,
          goalsAchieved: personalResult.completedGoals || 0,
          streak: personalResult.studyStreak || 0,
        },
      };
    } catch (error) {
      console.error("Error fetching analytics:", error);
      return null;
    }
  };

  // Enhanced search with AI-powered ranking
  const searchResources = async (params) => {
    const queryParams = new URLSearchParams();
    if (params.subject) queryParams.append("subject", params.subject);
    if (params.course) queryParams.append("course", params.course);
    if (params.institution)
      queryParams.append("institution", params.institution);
    if (params.resource_type) queryParams.append("type", params.resource_type);
    if (params.keywords) queryParams.append("search", params.keywords);
    if (userProfile.id) queryParams.append("userId", userProfile.id);

    // Add AI ranking parameters
    queryParams.append("aiRanking", "true");
    queryParams.append("userLevel", userProfile.academicLevel);
    queryParams.append("interests", userProfile.interests.join(","));

    const hasSpecificParams = Object.values(params).some(
      (value) => value !== null && value !== undefined && value !== ""
    );
    if (!hasSpecificParams) {
      queryParams.append("limit", 5);
      queryParams.append("sort", "aiRelevance"); // Changed from 'downloads' to AI-based relevance
    }

    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${
          API_CONFIG.endpoints.resources
        }?${queryParams.toString()}`
      );
      if (!response.ok) throw new Error("Search failed");
      const result = await response.json();
      return Array.isArray(result.resources) ? result.resources : [];
    } catch (error) {
      console.error("Search error:", error);
      return [];
    }
  };

  // Enhanced Google search with academic focus
  const googleSearch = async (query) => {
    try {
      const academicQuery = `${query} academic research papers study materials`;
      const response = await fetch(
        `${API_CONFIG.baseUrl}${
          API_CONFIG.endpoints.searchProxy
        }?query=${encodeURIComponent(academicQuery)}&academic=true`
      );
      if (!response.ok) throw new Error("Google search failed");
      const result = await response.json();
      return result.results || [];
    } catch (error) {
      console.error("Google search proxy error:", error);
      return [];
    }
  };

  // File upload and analysis
  const handleFileUpload = async (file) => {
    setIsProcessingFile(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userProfile.id || "anonymous");

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.documentAnalysis}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("File analysis failed");
      const result = await response.json();

      // Correctly access the nested 'analysis' object and ensure it exists
      const analysis = result.analysis || {};

      // Add analysis result to chat, ensuring all parts are strings
      const analysisMessage = {
        text: `📄 **Document Analysis Complete**\n\n**Summary:** ${
          analysis.summary || "No summary available."
        }\n\n**Key Topics:** ${
          analysis.keyTopics?.join(", ") || "No key topics found."
        }\n\n**Difficulty Level:** ${
          analysis.difficultyLevel || "Not specified."
        }`,
        sender: "bot",
        documentAnalysis: analysis,
        aiSuggestions: analysis.followUpQuestions || [],
      };

      setMessages((prev) => [...prev, analysisMessage]);
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, analysis: analysis },
      ]);
    } catch (error) {
      console.error("File upload error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ Sorry, I couldn't analyze that document. Please try again with a different file.",
          sender: "bot",
        },
      ]);
    } finally {
      setIsProcessingFile(false);
    }
  };
  // Generate personalized quiz
  const generateQuiz = async (topic, difficulty = "medium") => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.generateQuiz}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            difficulty,
            userLevel: userProfile.academicLevel,
            questionCount: 5,
          }),
        }
      );

      if (!response.ok) throw new Error("Quiz generation failed");
      const result = await response.json();

      // Return the FULL quiz instead of just the first question
      if (
        result.quiz &&
        result.quiz.questions &&
        Array.isArray(result.quiz.questions) &&
        result.quiz.questions.length > 0
      ) {
        return {
          title: result.quiz.title,
          difficulty: result.quiz.difficulty,
          questions: result.quiz.questions.map((q) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          })),
          currentQuestionIndex: 0, // Track current question
          totalQuestions: result.quiz.questions.length,
        };
      }
      return null;
    } catch (error) {
      console.error("Quiz generation error:", error);
      return null;
    }
  };

  // Generate personalized study plan
  const generateStudyPlan = async (subject, timeframe, goals) => {
    try {
      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.studyPlan}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject,
            timeframe,
            goals,
            userProfile: userProfile,
            currentKnowledge: userProfile.completedTopics || [],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error("Server returned non-JSON response");
      }

      const result = await response.json();
      console.log("Complete response:", result);

      if (!result.success) {
        throw new Error(result.error || "Study plan generation failed");
      }

      return result.plan;
    } catch (error) {
      console.error("Study plan generation error:", error);
      return null;
    }
  };

  // Enhanced Gemini API call with context awareness
  const callGeminiAPI = async (chatHistory) => {
    try {
      const validChatHistory = chatHistory.filter(
        (msg) => msg.text && msg.text.trim() !== ""
      );

      // Add system context with user profile
      const systemContext = {
        role: "model",
        parts: [
          {
            text: `You are Scholara, an advanced AI academic assistant. User profile: Academic level: ${
              userProfile.academicLevel
            }, Interests: ${userProfile.interests.join(
              ", "
            )}, Learning style: ${
              userProfile.learningStyle
            }. Provide personalized, detailed academic assistance.`,
          },
        ],
      };

      const formattedHistory = [
        systemContext,
        ...validChatHistory.map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        })),
      ];

      const payload = {
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          maxOutputTokens: 2048,
        },
      };

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.geminiProxy}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Gemini API request failed:", errorData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const result = await response.json();
      return (
        result.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Sorry, I couldn't process that request. Please try again."
      );
    } catch (error) {
      console.error("Gemini API error:", error);
      return "⚠️ Sorry, I couldn't process your request right now. Please try again or ask something else!";
    }
  };

  // Enhanced intent recognition with more categories
  const getChatbotIntent = async (message) => {
    const prompt = `You are an intelligent intent and entity extraction system for Scholara Collective, an advanced academic platform. Analyze user queries and determine intent and entities.

  **Enhanced Intents:**
  1. **"SEARCH_RESOURCE"** - Find educational resources
  2. **"GET_ANALYTICS"** - View platform/personal statistics  
  3. **"UPLOAD_GUIDE"** - Learn to upload resources
  4. **"DOWNLOAD_GUIDE"** - Learn to download resources
  5. **"COMMUNITY_GUIDELINES"** - Community rules and features
  6. **"PLATFORM_FEATURES"** - Platform functionality info
  7. **"FAQ"** - General help and support
  8. **"GREETING"** - Hello/welcome messages
  9. **"SUGGEST_RESOURCES"** - Resource recommendations
  10. **"GENERATE_QUIZ"** - Create practice tests
  11. **"STUDY_PLAN"** - Create learning roadmaps
  12. **"STUDY_TECHNIQUES"** - Learning methods and strategies
  13. **"CAREER_GUIDANCE"** - Academic and career advice
  14. **"RESEARCH_HELP"** - Research and citation assistance
  15. **"DOCUMENT_ANALYSIS"** - Analyze uploaded documents
  16. **"PERSONAL_ANALYTICS"** - Individual learning insights
  17. **"GENERAL_CHAT"** - Default conversation

  **Entities to extract:**
  - subject, course, institution, resource_type, keywords
  - difficulty_level: (beginner, intermediate, advanced)
  - time_frame: (days, weeks, months)
  - question_count: (for quizzes)
  - learning_goal: (specific objectives)

  Respond with JSON only:

  Query: "${message}"
  Output:`;

    try {
      const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
      const payload = { contents: chatHistory };

      const response = await fetch(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.geminiProxy}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) throw new Error("Intent extraction failed");

      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanedText = rawText.replace(/```json\n|\n```/g, "").trim();
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Intent extraction error:", error);
      return { intent: "GENERAL_CHAT", entities: null };
    }
  };

  // Enhanced query processing with new features
  const processUserQuery = useCallback(
    async (message, chatHistory) => {
      let parsedIntent;
      try {
        parsedIntent = await getChatbotIntent(message);
      } catch (error) {
        console.error("Error getting chatbot intent:", error);
        parsedIntent = { intent: "GENERAL_CHAT", entities: null };
      }

      const { intent, entities } = parsedIntent;
      let responseText = "";
      let resourcesData = null;
      let analyticsData = null;
      let learningAnalyticsData = null;
      let quizData = null;
      let studyPlanData = null;
      let aiSuggestionsData = null;

      switch (intent) {
        case "SEARCH_RESOURCE":
          const searchParams = {
            subject: entities?.subject,
            course: entities?.course,
            institution: entities?.institution,
            resource_type: entities?.resource_type,
            keywords: entities?.keywords || message,
          };

          const internalResults = await searchResources(searchParams);
          let combinedResources = [];

          if (internalResults.length > 0) {
            combinedResources = internalResults.map((res) => ({
              ...res,
              isExternal: false,
            }));
            const resourceType = entities?.resource_type
              ? `${entities.resource_type} `
              : "";
            const subject = entities?.subject ? ` in ${entities.subject}` : "";
            responseText += `📚 **From Our Scholara Collective Database**\n\nFound ${internalResults.length} ${resourceType}resources${subject} matching your request!\n\n`;
          }

          // Enhanced web search for comprehensive coverage
          if (entities?.subject) {
            const googleResults = await googleSearch(
              `${entities.subject} ${entities?.course || ""} study materials`
            );
            if (googleResults.length > 0) {
              const externalResults = googleResults
                .slice(0, 3)
                .map((res) => ({ ...res, isExternal: true }));
              combinedResources = [...combinedResources, ...externalResults];
              responseText += `\n\n🌐 **From Academic Web Sources**\n\nAdditional curated resources from trusted academic sources.\n\n`;
            }
          }

          if (combinedResources.length === 0) {
            responseText = `No resources found. Try different keywords or check out our study techniques guide!`;
            aiSuggestionsData = [
              "Show study techniques",
              "Browse popular resources",
              "Upload your own resource",
            ];
          } else {
            resourcesData = combinedResources;
            aiSuggestionsData = [
              `Create quiz on ${entities?.subject || "this topic"}`,
              `Generate study plan`,
              "Find similar resources",
            ];
          }
          break;

        case "GET_ANALYTICS":
          analyticsData = await fetchAnalyticsData();
          learningAnalyticsData = analyticsData?.learningAnalytics;
          responseText = `📊 **Platform Analytics Dashboard**\n\nHere's a comprehensive overview of our platform and your personal learning insights:`;
          break;

        case "GENERATE_QUIZ":
          const quizTopic =
            entities?.subject || entities?.keywords || "general knowledge";
          const difficulty = entities?.difficulty_level || "medium";
          quizData = await generateQuiz(quizTopic, difficulty);

          if (quizData) {
            responseText = `🧠 **Generated Quiz: ${quizTopic}**\n\nI've created a personalized ${difficulty} level quiz to test your knowledge. Let's see how well you understand the concepts!`;
          } else {
            responseText = `I couldn't generate a quiz right now. Try asking about a specific topic like "Create a physics quiz" or "Test me on calculus".`;
          }
          break;

        case "STUDY_PLAN":
          const planSubject = entities?.subject || entities?.keywords;
          const timeframe = entities?.time_frame || "4 weeks";
          const goals = entities?.learning_goal
            ? [entities.learning_goal]
            : ["Master fundamentals", "Prepare for exams"];

          if (planSubject) {
            studyPlanData = await generateStudyPlan(
              planSubject,
              timeframe,
              goals
            );
            responseText = `📅 **Personalized Study Plan: ${planSubject}**\n\nI've created a comprehensive ${timeframe} study roadmap tailored to your academic level and learning style:`;
          } else {
            responseText = `To create a personalized study plan, please specify a subject. For example: "Create a study plan for calculus" or "Help me plan for NEET preparation".`;
          }
          break;

        case "STUDY_TECHNIQUES":
          responseText = ENHANCED_KNOWLEDGE_BASE.studyTechniques;
          aiSuggestionsData = [
            "Create practice schedule",
            "Generate study quiz",
            "Find study resources",
          ];
          break;

        case "CAREER_GUIDANCE":
          responseText = ENHANCED_KNOWLEDGE_BASE.careerGuidance;
          aiSuggestionsData = [
            "Explore career paths",
            "Find internship resources",
            "Academic planning help",
          ];
          break;

        case "RESEARCH_HELP":
          responseText = ENHANCED_KNOWLEDGE_BASE.researchSkills;
          aiSuggestionsData = [
            "Citation format help",
            "Research methodology guide",
            "Find academic sources",
          ];
          break;

        case "PERSONAL_ANALYTICS":
          learningAnalyticsData = {
            studyTime: userProfile.totalStudyTime || 0,
            topicsExplored: userProfile.topicsExplored || 0,
            goalsAchieved: userProfile.goalsAchieved || 0,
            streak: userProfile.studyStreak || 0,
          };
          responseText = `📈 **Your Learning Journey**\n\nHere's your personalized academic progress and insights:`;
          break;

        case "UPLOAD_GUIDE":
          responseText = ENHANCED_KNOWLEDGE_BASE.howToUpload;
          break;

        case "DOWNLOAD_GUIDE":
          responseText = ENHANCED_KNOWLEDGE_BASE.howToDownload;
          break;

        case "COMMUNITY_GUIDELINES":
          responseText = ENHANCED_KNOWLEDGE_BASE.communityGuidelines;
          break;

        case "PLATFORM_FEATURES":
          responseText = ENHANCED_KNOWLEDGE_BASE.platformFeatures;
          break;

        case "FAQ":
          responseText = ENHANCED_KNOWLEDGE_BASE.faq;
          break;

        case "GREETING":
          responseText = `👋 **Welcome to Scholara Collective!**\n\nI'm your advanced AI academic assistant with enhanced capabilities:\n\n• 🔍 **Smart Resource Search** - Find personalized study materials\n• 🧠 **AI Quiz Generator** - Create practice tests on any topic\n• 📅 **Study Planner** - Get personalized learning roadmaps\n• 📄 **Document Analysis** - Upload and analyze study materials\n• 📊 **Learning Analytics** - Track your academic progress\n• 💡 **Study Techniques** - Learn effective learning methods\n\nWhat would you like to explore today?`;
          aiSuggestionsData = [
            "Find study resources",
            "Create a quiz",
            "Generate study plan",
            "Show my analytics",
          ];
          break;

        case "SUGGEST_RESOURCES":
          const suggestedResources = await searchResources({
            limit: 5,
            sort: entities?.resource_type ? null : "aiRelevance",
            resource_type: entities?.resource_type,
          });
          if (suggestedResources.length > 0) {
            const typeText = entities?.resource_type
              ? `${entities.resource_type} `
              : "academic ";
            responseText = `Here are some AI-curated ${typeText}resources based on your profile and interests:`;
            resourcesData = suggestedResources;
            aiSuggestionsData = [
              "Create quiz from these resources",
              "Generate study schedule",
              "Find similar topics",
            ];
          } else {
            responseText =
              "I'm still learning about your preferences. Try searching for specific topics or subjects!";
            aiSuggestionsData = [
              "Browse popular subjects",
              "Upload study materials",
              "Set learning goals",
            ];
          }
          break;

        case "GENERAL_CHAT":
        default:
          responseText = await callGeminiAPI(chatHistory);
          // Generate contextual suggestions based on the conversation
          aiSuggestionsData = await generateContextualSuggestions(
            message,
            userProfile
          );
          break;
      }

      // Update user profile based on interaction
      updateUserProfile(intent, entities);

      return {
        text: responseText,
        resources: resourcesData,
        analytics: analyticsData,
        learningAnalytics: learningAnalyticsData,
        quiz: quizData,
        studyPlan: studyPlanData,
        aiSuggestions: aiSuggestionsData,
      };
    },
    [
      userProfile,
      generateContextualSuggestions,
      searchResources,
      fetchAnalyticsData,
      generateQuiz,
      generateStudyPlan,
      callGeminiAPI,
    ]
  );

  // Update user profile based on interactions
  const updateUserProfile = (intent, entities) => {
    const updatedProfile = { ...userProfile };

    // Track interests
    if (
      entities?.subject &&
      !updatedProfile.interests.includes(entities.subject)
    ) {
      updatedProfile.interests.push(entities.subject);
    }

    // Update interaction counts
    updatedProfile.totalInteractions =
      (updatedProfile.totalInteractions || 0) + 1;
    updatedProfile.lastActive = new Date().toISOString();

    // Track learning activities
    if (intent === "GENERATE_QUIZ") {
      updatedProfile.quizzesGenerated =
        (updatedProfile.quizzesGenerated || 0) + 1;
    }
    if (intent === "STUDY_PLAN") {
      updatedProfile.studyPlansCreated =
        (updatedProfile.studyPlansCreated || 0) + 1;
    }

    setUserProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
  };

  // Initialize chatbot with enhanced welcome
  useEffect(() => {
    let isMounted = true;

    const initializeChatbot = async () => {
      setIsLoading(true);
      try {
        await fetchResourcesData();
        if (isMounted) {
          setIsResourcesLoaded(true);
          const welcomeMessage = {
            text: `🎓 **Welcome to Scholara Collective - Advanced AI Academic Assistant!**\n\nI'm Scholara, your personalized academic companion with enhanced AI capabilities. Here's what I can help you with:\n\n🔍 **Smart Resource Discovery** - Find personalized study materials\n🧠 **AI Quiz Generation** - Create custom practice tests\n📅 **Intelligent Study Planning** - Get personalized learning roadmaps\n📄 **Document Analysis** - Upload and analyze your study materials\n📊 **Learning Analytics** - Track your academic progress\n💡 **Advanced Study Techniques** - Learn effective learning methods\n🎯 **Career Guidance** - Academic and professional planning\n\n*${
              userProfile.name
                ? `Welcome back, ${userProfile.name}!`
                : "New to Scholara?"
            } I'm here to accelerate your learning journey.*`,
            sender: "bot",
            aiSuggestions: [
              "Find resources in my subjects",
              "Create a practice quiz",
              "Generate my study plan",
              "Show learning techniques",
            ],
          };
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error("Initialization error:", error);
        if (isMounted) {
          setMessages([
            {
              text: "⚠️ Having trouble connecting to our enhanced AI services. Please try again later or contact support.",
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
  }, [userProfile.name]);

  // Enhanced send message with better UX
  const sendMessage = useCallback(async () => {
    const message = userInput.trim();
    if (!message || isLoading) return;

    const userMessage = { text: message, sender: "user" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);
    setExpandedInput(false);
    setShowSuggestions(false);

    const updatedSearches = [
      message,
      ...recentSearches.filter((item) => item !== message).slice(0, 9),
    ];
    setRecentSearches(updatedSearches);
    localStorage.setItem("recentSearches", JSON.stringify(updatedSearches));

    try {
      const response = await processUserQuery(message, newMessages);

      // A. The crucial check: ensure the response has a 'text' property
      if (response && response.text) {
        setMessages((prev) => [...prev, { ...response, sender: "bot" }]);
      } else {
        // B. If the response is invalid, show a fallback message to the user
        setMessages((prev) => [
          ...prev,
          {
            text: "⚠️ I received an invalid response from the server. Please try again.",
            sender: "bot",
            aiSuggestions: ["Check the server logs", "Contact support"],
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing query:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "⚠️ Something went wrong while processing your request. Please try again or contact support.",
          sender: "bot",
          aiSuggestions: [
            "Try a different question",
            "Check platform status",
            "Contact support",
          ],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [userInput, isLoading, recentSearches, messages, processUserQuery]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else if (e.key === "Escape") {
      setUserInput("");
      setShowSuggestions(false);
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

  // Enhanced quick actions with new categories
  const quickActions = [
    {
      label: "Find Resources",
      query: "Find study resources for my subjects",
      icon: Search,
      category: "search",
    },
    {
      label: "Create Quiz",
      query: "Generate a quiz to test my knowledge",
      icon: Brain,
      category: "learning",
    },
    {
      label: "Study Plan",
      query: "Create a personalized study plan",
      icon: Calendar,
      category: "planning",
    },
    {
      label: "Upload & Analyze",
      query: "I want to upload a document for analysis",
      icon: Upload,
      category: "tools",
    },
    {
      label: "Learning Analytics",
      query: "Show my learning progress and analytics",
      icon: BarChart3,
      category: "insights",
    },
    {
      label: "Study Techniques",
      query: "Teach me effective study techniques",
      icon: Lightbulb,
      category: "learning",
    },
    {
      label: "Career Guidance",
      query: "I need academic and career guidance",
      icon: Target,
      category: "guidance",
    },
    {
      label: "Platform Help",
      query: "Help me understand platform features",
      icon: HelpCircle,
      category: "support",
    },
  ];

  // Smart suggestion selection
  const handleSuggestionSelect = (suggestion) => {
    setUserInput(suggestion);
    setShowSuggestions(false);
    inputRef.current.focus();
  };

  // Handle AI suggestion clicks
  const handleAISuggestionClick = (suggestion) => {
    setUserInput(suggestion);
    setTimeout(() => sendMessage(), 100);
  };

return (
  <div
    className={`flex flex-col h-[100dvh] overflow-hidden ${colors.background.light} dark:${colors.background.dark} font-poppins transition-colors duration-300 ${
      isDragging ? "" : "transition-transform duration-300 ease-out"
    }`}
    style={{ transform: `translateY(${dragY}px)` }}
  >
    {/* ---------------- Header (Drag Handle + Controls) ---------------- */}
    <header
      className={`relative ${colors.primary.light} dark:${colors.primary.dark} px-4 py-3 border-b ${colors.border.light} dark:${colors.border.dark} shadow-sm cursor-grab lg:cursor-auto`}
      onMouseDown={handleTouchStart}
      onTouchStart={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      onMouseMove={handleTouchMove}
      onTouchMove={handleTouchMove}
    >
      {/* Connection Status */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isLoading ? "bg-amber-400" : "bg-emerald-400"
          } animate-pulse ring-1 ring-white/30`}
        ></div>
      </div>

      {/* Centered Title */}
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
          Scholara
          <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
        </h1>
        <p className="text-amber-100 text-xs font-medium flex items-center gap-1 mt-0.5">
          <MessageSquare className="w-3 h-3 text-amber-200" />
          AI Academic Assistant
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsOpen(false)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
      >
        <X className="w-4.5 h-4.5 text-white" />
      </button>

      {/* Mobile Drag Handle Visual */}
      <div className="absolute top-1 left-1/2  -translate-x-1/2 w-12 h-1.5 rounded-full bg-gray-300 dark:bg-[#ffffff6c] lg:hidden"></div>
    </header>

    {/* ---------------- Main Chat Area ---------------- */}
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Container */}
      <div
        ref={chatMessagesRef}
        className={`flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar ${colors.background.light} dark:${colors.background.dark} space-y-4`}
      >
        {/* Loading State */}
        {!isResourcesLoaded && (
          <div className="flex justify-start animate-fade-in">
            <div
              className={`${colors.card.light} dark:${colors.card.dark} p-3 rounded-xl border ${colors.border.light} shadow-xs flex items-center space-x-3 max-w-md`}
            >
              <FontAwesomeIcon
                icon={faSpinner}
                spin
                className="text-amber-500 text-sm"
              />
              <span
                className={`text-sm font-medium ${colors.text.primary.light} dark:${colors.text.primary.dark}`}
              >
                Loading knowledge...
              </span>
            </div>
          </div>
        )}

        {/* Chat Messages */}
        {messages.map((message, index) => (
          <ChatBubble
            key={index}
            message={message}
            isUser={message.sender === "user"}
          />
        ))}

        {/* Typing Indicator */}
        {isLoading && (
          <div className="flex justify-start items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
            </div>
            <div
              className={`${colors.card.light} dark:${colors.card.dark} p-3 rounded-xl border ${colors.border.light} dark:${colors.border.dark} shadow-xs max-w-md`}
            >
              <TypingIndicator mobile />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5" />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* File Upload Section */}
      {activeFeature === "upload" && (
        <div
          className={`px-4 pt-3 pb-4 border-t ${colors.border.light} dark:${colors.border.dark} bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm`}
        >
          <FileUploadComponent
            onFileUpload={handleFileUpload}
            isProcessing={isProcessingFile}
            mobile
          />
        </div>
      )}

      {/* Input Area */}
      <div
        className={`p-4 border-t ${colors.border.light} dark:border-gray-600 ${colors.card.light} dark:${colors.card.dark} shadow-[0_-5px_15px_rgba(0,0,0,0.08)] lg:relative lg:shadow-none`}
      >
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Quick Action Chips */}
          <div className="flex flex-nowrap overflow-x-auto custom-scrollbar gap-2 pb-2 -mx-1 px-1">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  if (
                    action.category === "tools" &&
                    action.label === "Upload & Analyze"
                  ) {
                    setActiveFeature("upload");
                  } else {
                    setUserInput(action.query);
                    inputRef.current.focus();
                  }
                }}
                disabled={isLoading}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all active:scale-95 ${
                  action.category === "tools"
                    ? "bg-amber-100/80 hover:bg-amber-200/70 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/40"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700 bg-gradient-to-br dark:from-onyx dark:via-charcoal dark:to-onyx shadow-glow-sm  dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                {action.icon && <action.icon className="w-3 h-3" />}
                {action.label}
              </button>
            ))}
          </div>

          {/* New Input Container Layout */}
          <div className="relative ">
            {/* Upload Button */}
            <button
              onClick={() =>
                setActiveFeature(
                  activeFeature === "upload" ? "chat" : "upload"
                )
              }
              className={`absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all active:scale-90 ${
                activeFeature === "upload"
                  ? "bg-amber-100 text-amber-600 shadow-inner dark:bg-amber-900/40 dark:text-amber-300"
                  : "text-gray-500 hover:text-amber-500 hover:bg-gray-100/70 dark:hover:bg-gray-700/50"
              }`}
            >
              <Upload size={16} strokeWidth={2.5} />
            </button>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeFeature === "upload"
                  ? "Ask about your document..."
                  : "Message Scholara..."
              }
              className={`w-full pl-11 pr-14 py-3 rounded-2xl ${
                colors.card.light
              } dark:${colors.card.dark} ${colors.text.primary.light} dark:${
                colors.text.primary.dark
              } border ${colors.border.light} dark:${
                colors.border.dark
              } focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-transparent transition-all duration-200 placeholder:${
                colors.text.secondary.light
              } dark:placeholder:${colors.text.secondary.dark} resize-none custom-scrollbar ${
                expandedInput ? "min-h-[100px]" : "min-h-[52px]"
              } shadow-sm hover:shadow-md text-base`}
              disabled={isLoading}
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={isLoading || userInput.trim() === ""}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all active:scale-95 ${
                isLoading || userInput.trim() === ""
                  ? "bg-gray-200 text-gray-400 dark:bg-[#80808031] dark:text-gray-500 cursor-not-allowed"
                  : `${colors.primary.light} dark:${colors.primary.dark} text-white shadow-md hover:shadow-lg`
              }`}
            >
              {isLoading ? (
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  className="w-3.5 h-3.5"
                />
              ) : (
                <Send className="w-3.5 h-3.5" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
);


};

export default ScholaraAdvancedChatbot; 
