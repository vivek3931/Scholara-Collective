// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); // Still need middleware

// Import your controller functions
const authController = require('../controllers/authController'); // Adjust path as needed

// @route   POST /api/auth/register
// @desc    Register a new user (This might now just initiate the process for OTP)
// @access  Public
router.post('/register', authController.register);

// @route   POST /api/auth/send-registration-otp
// @desc    Send OTP to user's email for registration verification
// @access  Public
router.post('/send-registration-otp', authController.sendRegistrationOtp);

// @route   POST /api/auth/verify-registration-otp
// @desc    Verify OTP and complete user registration
// @access  Public
router.post('/verify-registration-otp', authController.verifyRegistrationOtp);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', authController.login);

// @route   GET /api/auth/me
// @desc    Get user data by token
// @access  Private
router.get('/me', protect, authController.getMe); // 'protect' middleware comes before the controller
router.patch('/users/profile', protect, authController.updateProfile);
router.post('/verify-token', authController.verifyToken); 


router.post('/change-password', protect, authController.changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post('/logout', authController.logout);

// @route   POST /api/auth/setup-admin
// @desc    Create the initial admin user (one-time route)
// @access  Public (protected by secret key logic within controller)
router.post('/setup-admin', authController.setupAdmin);

module.exports = router;
