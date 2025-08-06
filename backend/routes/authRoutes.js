// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
// No need for bcrypt, jwt, User here anymore, as they are used in the controller
const { protect } = require('../middleware/authMiddleware'); // Still need middleware

// Import your controller functions
const authController = require('../controllers/authController'); // Adjust path as needed

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get user data by token
// @access  Private
router.get('/me', protect, authController.getMe); // 'protect' middleware comes before the controller
router.patch('/users/profile', protect, authController.updateProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', authController.logout);

// @route   POST /api/auth/setup-admin
// @desc    Create the initial admin user (one-time route)
// @access  Public (protected by secret key logic within controller)
router.post('/setup-admin', authController.setupAdmin);

module.exports = router;