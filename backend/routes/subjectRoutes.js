const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject'); // Your Mongoose model

// The GET route to fetch your subjects
router.get('/subjects', async (req, res) => {
  try {
    const allSubjects = await Subject.find({});

    res.json(allSubjects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// This line is essential!
module.exports = router;