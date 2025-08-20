// ====================================
// 1. DOCUMENT ANALYSIS ENDPOINT
// ====================================
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and images are allowed.'), false);
    }
  }
});

// Helper function to extract text from different file types
async function extractTextFromFile(filePath, mimetype) {
  let text = '';
  
  try {
    if (mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      text = data.text;
      
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
      
    } else if (mimetype === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
      
    } else if (mimetype.startsWith('image/')) {
      // OCR for images
      const result = await Tesseract.recognize(filePath, 'eng');
      text = result.data.text;
    }
    
    return text;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw new Error('Failed to extract text from document');
  }
}

// Helper function to analyze text with AI (using your existing Gemini proxy)
async function analyzeTextWithAI(text, baseUrl) {
  const analysisPrompt = `Analyze the following academic document and provide:

1. A concise summary (2-3 sentences)
2. Key topics covered (list 3-5 main topics)
3. Difficulty level (beginner, intermediate, advanced)
4. Subject classification (if identifiable)
5. Learning objectives
6. Three relevant follow-up questions students might have

Document text:
${text.substring(0, 4000)}...

Respond in JSON format:
{
  "summary": "...",
  "keyTopics": ["topic1", "topic2", ...],
  "difficultyLevel": "...",
  "subject": "...",
  "learningObjectives": ["objective1", "objective2", ...],
  "followUpQuestions": ["question1", "question2", "question3"]
}`;

  try {
    const response = await fetch(`${baseUrl}/api/gemini-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: analysisPrompt }] }]
      })
    });

    if (!response.ok) throw new Error('AI analysis failed');
    
    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    // A. Add a robust check for a valid AI response before parsing
    if (!aiResponse) {
      console.error('AI returned an empty or malformed response.');
      throw new Error('AI analysis returned an empty response');
    }
    
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // B. Provide a more explicit fallback if parsing fails
      return {
        summary: "Document analysis completed successfully, but the AI's response was not in the expected format.",
        keyTopics: [],
        difficultyLevel: "Not available.",
        subject: "General",
        learningObjectives: [],
        followUpQuestions: []
      };
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    // C. Provide a clear fallback for all other errors
    return {
      summary: "AI analysis failed completely due to a network or server error.",
      keyTopics: [],
      difficultyLevel: "Not available.",
      subject: "General",
      learningObjectives: [],
      followUpQuestions: []
    };
  }
}


// Document Analysis Route
router.post('/analyze-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { path: filePath, mimetype, originalname } = req.file;
    const userId = req.body.userId || 'anonymous';
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // Extract text from the uploaded file
    const extractedText = await extractTextFromFile(filePath, mimetype);
    
    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error('No text could be extracted from the document');
    }

    // Analyze the text with AI
    const analysis = await analyzeTextWithAI(extractedText, baseUrl);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Log the analysis (you might want to save this to database)
    console.log(`Document analyzed for user ${userId}: ${originalname}`);

    res.json({
      success: true,
      filename: originalname,
      analysis: {
        ...analysis,
        wordCount: extractedText.split(' ').length,
        extractedText: extractedText.substring(0, 500) + '...', // First 500 chars for preview
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Clean up file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Document analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze document',
      message: error.message 
    });
  }
});

// ====================================
// 2. QUIZ GENERATION ENDPOINT
// ====================================

// Generate Quiz Route
router.post('/generate-quiz', async (req, res) => {
  try {
    const { topic, difficulty = 'medium', userLevel = 'undergraduate', questionCount = 5 } = req.body;

    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    const quizPrompt = `Create a ${difficulty} level quiz with ${questionCount} multiple choice questions about "${topic}" for ${userLevel} students.

Each question should have:
- 4 answer options (A, B, C, D)
- Only one correct answer
- A brief explanation for the correct answer

Format as JSON:
{
  "title": "Quiz: ${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Explanation of why this answer is correct"
    }
  ]
}

Make questions challenging but fair for ${userLevel} level students.`;

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api/gemini-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: quizPrompt }] }]
      })
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok || !contentType || !contentType.includes("application/json")) {
      console.error('Quiz generation failed. Status:', response.status);
      console.error('Quiz generation failed. Response:', await response.text());
      throw new Error('AI proxy failed to return a valid JSON response.');
    }

    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof aiResponse !== 'string') {
      console.error('AI response was not a valid string:', aiResponse);
      throw new Error('Invalid AI response format: Not a string');
    }

    const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
    if (!cleanedResponse || !cleanedResponse.startsWith('{')) {
      console.error('AI response was not a valid JSON string:', cleanedResponse);
      throw new Error('Invalid AI response format: Malformed JSON');
    }

    const quizData = JSON.parse(cleanedResponse);

    if (!quizData.questions || !Array.isArray(quizData.questions)) {
      throw new Error('Invalid quiz format');
    }

    quizData.id = Date.now().toString();
    quizData.createdAt = new Date().toISOString();
    quizData.topic = topic;

    res.json({
      success: true,
      quiz: quizData
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate quiz',
      message: error.message 
    });
  }
});



// ====================================
// 3. STUDY PLAN GENERATION ENDPOINT
// ====================================

router.post('/generate-study-plan', async (req, res) => {
  try {
    const { 
      subject, 
      timeframe = '4 weeks', 
      goals = [], 
      userProfile = {},
      currentKnowledge = []
    } = req.body;

    if (!subject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    const studyPlanPrompt = `Create a comprehensive ${timeframe} study plan for "${subject}" with the following details:

User Profile:
- Academic Level: ${userProfile.academicLevel || 'undergraduate'}
- Learning Style: ${userProfile.learningStyle || 'mixed'}
- Interests: ${userProfile.interests ? userProfile.interests.join(', ') : 'general'}
- Goals: ${goals.length > 0 ? goals.join(', ') : 'mastery of fundamentals'}

Current Knowledge: ${currentKnowledge.length > 0 ? currentKnowledge.join(', ') : 'beginner level'}

Create a structured plan with phases/weeks that includes:
- Learning objectives for each phase
- Recommended study duration per day
- Key topics to cover
- Practice activities and assessments
- Resources and materials needed
- Milestones and checkpoints

Format as JSON:
{
  "title": "Study Plan: ${subject}",
  "duration": "${timeframe}",
  "subject": "${subject}",
  "phases": [
    {
      "phase": 1,
      "title": "Phase Title",
      "duration": "Week 1",
      "description": "What to accomplish in this phase",
      "objectives": ["objective1", "objective2"],
      "topics": ["topic1", "topic2"],
      "dailyStudyTime": "2 hours",
      "activities": ["activity1", "activity2"],
      "milestone": "What to achieve by end of phase"
    }
  ],
  "overallGoals": ["goal1", "goal2"],
  "assessmentSchedule": ["assessment1", "assessment2"],
  "tips": ["tip1", "tip2"]
}`;

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const response = await fetch(`${baseUrl}/api/gemini-proxy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: studyPlanPrompt }] }]
      })
    });

    if (!response.ok) throw new Error('Study plan generation failed');
    
    const result = await response.json();
    const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?|\n?```/g, '').trim();
      const planData = JSON.parse(cleanedResponse);
      
      // Add metadata
      planData.id = Date.now().toString();
      planData.createdAt = new Date().toISOString();
      planData.userProfile = userProfile;

      res.json({
        success: true,
        plan: planData
      });

    } catch (parseError) {
      console.error('Study plan parsing error:', parseError);
      
      // Generate fallback study plan
      const weeks = timeframe.includes('week') ? parseInt(timeframe) || 4 : 4;
      const fallbackPlan = {
        title: `Study Plan: ${subject}`,
        duration: timeframe,
        subject: subject,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        phases: Array.from({length: weeks}, (_, i) => ({
          phase: i + 1,
          title: `Week ${i + 1}: ${i === 0 ? 'Fundamentals' : i === weeks-1 ? 'Advanced Topics & Review' : 'Core Concepts'}`,
          duration: `Week ${i + 1}`,
          description: `Focus on ${i === 0 ? 'building foundation' : i === weeks-1 ? 'mastering advanced concepts' : 'understanding core principles'}`,
          objectives: [`Master ${subject} fundamentals`, "Complete practice exercises"],
          topics: [`${subject} basics`, "Key principles", "Applications"],
          dailyStudyTime: "2-3 hours",
          activities: ["Read materials", "Practice problems", "Review notes"],
          milestone: `Complete Week ${i + 1} objectives`
        })),
        overallGoals: goals.length > 0 ? goals : [`Master ${subject}`, "Prepare for assessments"],
        tips: ["Stay consistent", "Practice regularly", "Review previous topics", "Seek help when needed"]
      };

      res.json({
        success: true,
        plan: fallbackPlan,
        note: "Fallback plan generated due to AI parsing issues"
      });
    }

  } catch (error) {
    console.error('Study plan generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate study plan',
      message: error.message 
    });
  }
});

// ====================================
// 4. PERSONAL ANALYTICS ENDPOINT
// ====================================

// You'll need a database to store user analytics. Here's an example using MongoDB/Mongoose
// If you don't have a database, this provides mock data for testing

router.get('/user-analytics', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId || userId === 'anonymous') {
      return res.json({
        message: "Analytics require user authentication",
        totalStudyTime: 0,
        topicsCount: 0,
        completedGoals: 0,
        studyStreak: 0,
        weeklyProgress: [],
        subjectDistribution: {},
        performanceMetrics: {
          quizzesCompleted: 0,
          averageScore: 0,
          studyPlansCreated: 0,
          resourcesUploaded: 0,
          resourcesDownloaded: 0
        }
      });
    }

    // In a real application, fetch from database
    // For now, generating realistic mock data
    const mockAnalytics = {
      userId: userId,
      totalStudyTime: Math.floor(Math.random() * 100) + 20, // 20-120 hours
      topicsExplored: Math.floor(Math.random() * 25) + 10, // 10-35 topics
      completedGoals: Math.floor(Math.random() * 8) + 2, // 2-10 goals
      studyStreak: Math.floor(Math.random() * 15) + 1, // 1-16 days
      weeklyProgress: [
        { week: 'Week 1', studyHours: Math.random() * 20 + 5, topicsCompleted: Math.floor(Math.random() * 5) + 1 },
        { week: 'Week 2', studyHours: Math.random() * 25 + 8, topicsCompleted: Math.floor(Math.random() * 6) + 2 },
        { week: 'Week 3', studyHours: Math.random() * 30 + 10, topicsCompleted: Math.floor(Math.random() * 7) + 2 },
        { week: 'Week 4', studyHours: Math.random() * 28 + 12, topicsCompleted: Math.floor(Math.random() * 8) + 3 }
      ],
      subjectDistribution: {
        'Mathematics': Math.floor(Math.random() * 30) + 20,
        'Physics': Math.floor(Math.random() * 25) + 15,
        'Chemistry': Math.floor(Math.random() * 20) + 10,
        'Computer Science': Math.floor(Math.random() * 35) + 25,
        'English': Math.floor(Math.random() * 15) + 5
      },
      performanceMetrics: {
        quizzesCompleted: Math.floor(Math.random() * 20) + 5,
        averageScore: Math.floor(Math.random() * 30) + 70, // 70-100%
        studyPlansCreated: Math.floor(Math.random() * 5) + 1,
        resourcesUploaded: Math.floor(Math.random() * 10) + 2,
        resourcesDownloaded: Math.floor(Math.random() * 50) + 20,
        documentsAnalyzed: Math.floor(Math.random() * 8) + 3
      },
      learningPatterns: {
        preferredStudyTime: ['Morning', 'Evening'][Math.floor(Math.random() * 2)],
        avgSessionDuration: Math.floor(Math.random() * 60) + 30, // 30-90 minutes
        mostActiveSubject: 'Computer Science',
        improvementAreas: ['Time Management', 'Consistency', 'Advanced Topics'][Math.floor(Math.random() * 3)]
      },
      achievements: [
        { title: 'Quick Learner', description: 'Completed 5+ topics this week', earned: true },
        { title: 'Quiz Master', description: 'Scored 90%+ on 3 consecutive quizzes', earned: Math.random() > 0.5 },
        { title: 'Consistent Studier', description: '7+ day study streak', earned: Math.random() > 0.3 },
        { title: 'Resource Contributor', description: 'Uploaded 5+ helpful resources', earned: Math.random() > 0.7 }
      ],
      recommendations: [
        "Focus more on Mathematics to improve overall performance",
        "Try studying in shorter, more frequent sessions",
        "Consider joining study groups for better collaboration",
        "Set specific weekly goals to maintain momentum"
      ],
      lastUpdated: new Date().toISOString()
    };

    // In a real app, you might want to calculate streaks, update study time, etc.
    // based on user interactions stored in database

    res.json(mockAnalytics);

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user analytics',
      message: error.message 
    });
  }
});

// Additional utility route for updating user analytics (POST)
router.post('/user-analytics/update', async (req, res) => {
  try {
    const { userId, activityType, data } = req.body;

    if (!userId || userId === 'anonymous') {
      return res.status(400).json({ error: 'User ID required' });
    }

    // In a real application, update the database based on activity type
    // activityType could be: 'quiz_completed', 'study_session', 'resource_uploaded', etc.
    
    console.log(`Analytics update for user ${userId}: ${activityType}`, data);

    // Mock response for successful update
    res.json({
      success: true,
      message: `Analytics updated for ${activityType}`,
      userId: userId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics update error:', error);
    res.status(500).json({ 
      error: 'Failed to update analytics',
      message: error.message 
    });
  }
});

// ====================================
// EXPORT THE ROUTER
// ====================================

module.exports = router;
