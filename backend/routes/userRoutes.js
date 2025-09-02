const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken'); // Added for token generation
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route   GET /api/users/me
// @desc    Get current user's profile and coin balance
// @access  Private
router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            scholaraCoins: user.scholaraCoins,
            role: user.role,
            isVerified: user.isVerified,
            bio: user.bio,
            createdAt: user.createdAt,
            purchasedResources: user.purchasedResources || [],
            savedResources: user.savedResources || [],
        });
    } catch (err) {
        console.error('Get user data error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/users/profile
// @desc    Update user profile (matches frontend call)
// @access  Private
router.patch('/profile', protect, async (req, res) => {
    try {
        const { username, email, notifications, bio } = req.body;
        
        console.log('Profile update request:', { username, email, bio });
        console.log('User ID:', req.user.id);
        
        // Validate input
        if (username && username.trim().length < 2) {
            return res.status(400).json({ message: 'Username must be at least 2 characters long' });
        }

        // Check if username already exists (if changing username)
        if (username && username.trim() !== req.user.username) {
            const existingUser = await User.findOne({ 
                username: username.trim(), 
                _id: { $ne: req.user.id } 
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already exists' });
            }
        }

        const updateFields = {};
        if (username !== undefined) updateFields.username = username.trim();
        if (email !== undefined) updateFields.email = email.trim();
        if (notifications !== undefined) updateFields.notifications = notifications;
        if (bio !== undefined) updateFields.bio = bio.trim();

        console.log('Update fields:', updateFields);

        const user = await User.findByIdAndUpdate(
            req.user.id,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('Updated user from DB:', user.username, user.bio);
        
        const responseData = {
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                scholaraCoins: user.scholaraCoins,
                role: user.role,
                isVerified: user.isVerified,
                bio: user.bio,
                createdAt: user.createdAt,
                purchasedResources: user.purchasedResources || [],
                savedResources: user.savedResources || []
            }
        };
        
        console.log('Sending response:', responseData);
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Update Profile Error:', error);
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({ message: `${field} already exists` });
        }
        res.status(400).json({ message: 'Failed to update profile' });
    }
});

// @route   PUT /api/users/me/profile
// @desc    Update user profile (legacy endpoint)
// @access  Private
router.put('/me/profile', protect, async (req, res) => {
    try {
        const { username, email, notifications, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username, email, notifications, bio },
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                scholaraCoins: user.scholaraCoins,
                role: user.role,
                isVerified: user.isVerified,
                bio: user.bio,
                createdAt: user.createdAt,
                purchasedResources: user.purchasedResources || [],
                savedResources: user.savedResources || []
            }
        });
    } catch (error) {
        console.error('Update Profile Error:', error.message);
        res.status(400).json({ message: 'Failed to update profile' });
    }
});

// @route   PUT /api/users/me/password
// @desc    Change user password
// @access  Private
router.put('/me/password', protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Input validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Both current and new passwords are required' });
        }

        const user = await User.findById(req.user.id).select('+password'); // Include password field
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Validate new password
        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        // Invalidate existing sessions by updating a passwordResetToken
        user.passwordResetToken = undefined; // Optional: Clear any existing reset token
        user.passwordChangedAt = Date.now(); // Add timestamp to track password change

        await user.save();

        // Log for debugging
        console.log(`Password updated for user: ${user.username} at ${new Date().toISOString()}`);

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error.message);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

// @route   POST /api/users/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user by email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user._id,
                role: user.role,
            }
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                scholaraCoins: user.scholaraCoins,
                role: user.role,
                isVerified: user.isVerified,
                bio: user.bio,
                createdAt: user.createdAt,
                purchasedResources: user.purchasedResources || [],
                savedResources: user.savedResources || []
            }
        });
    } catch (error) {
        console.error('Login Error:', error.message);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/users/
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/referrals
// @desc    Get user referral count
// @access  Private
router.get('/referrals', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json({ referralCount: user.referralCount });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;