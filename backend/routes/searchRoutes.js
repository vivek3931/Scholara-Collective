// backend/routes/searchRoutes.js

const express = require('express');
const fetch = require('node-fetch'); // For making HTTP requests (install if not already: npm install node-fetch@2)
const router = express.Router(); // Create an Express router instance
const dotenv = require('dotenv');
dotenv.config();

// Environment variables for Google Custom Search API.
// These are loaded from the backend's .env file (via dotenv.config() in server.js)
const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
console.log(GOOGLE_CSE_ID);
console.log(GOOGLE_SEARCH_API_KEY)
console.log("search route triggered")

// --- API Endpoint for Google Search Proxy ---
// This route handles GET requests to /api/search-proxy
router.get('/search-proxy', async (req, res) => {
  const userQuery = req.query.query; // Get the search query from the frontend

  // Input validation
  if (!userQuery) {
    return res.status(400).json({ error: 'Search query is required.' });
  }
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_CSE_ID) {
    console.error("Google Search API Key or CSE ID is missing in backend environment variables.");
    return res.status(500).json({ error: 'Server configuration error: Google Search credentials missing.' });
  }

  try {
    // Construct the URL for the Google Custom Search JSON API
    const googleSearchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(userQuery)}`;

    // Make the request to the Google Search API
    const response = await fetch(googleSearchUrl);

    // Check if the Google Search API request was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google Search API returned an error: ${response.status} - ${errorText}`);
      // Return a more specific error from Google if available
      return res.status(response.status).json({
        error: 'Google search failed',
        details: errorText
      });
    }

    const data = await response.json();

    // Extract relevant information from Google Search results
    const results = data.items ? data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      source_title: item.displayLink
    })) : [];

    // Send the results back to the frontend
    res.json({ results });

  } catch (error) {
    console.error("Error during Google Search proxy call:", error);
    res.status(500).json({ error: 'Internal server error during search proxy operation.' });
  }
});

module.exports = router; // Export the router
