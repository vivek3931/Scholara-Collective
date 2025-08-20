// backend/routes/geminiRoutes.js
const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const dotenv = require('dotenv');

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;


router.post('/gemini-proxy', async (req, res) => {
  // Use the full request body directly, as the frontend formats it correctly.
  const payload = req.body; 

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error: Gemini API key missing.' });
  }

  // --- No need for further validation here, as the frontend handles it. ---
  // --- The payload received from the frontend is already in the correct format. ---

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Send the payload as-is, since it's already correct.
      body: JSON.stringify(payload), 
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Gemini API proxy error:", error);
    res.status(500).json({ error: 'Internal server error during Gemini API proxy operation.' });
  }
});

module.exports = router;