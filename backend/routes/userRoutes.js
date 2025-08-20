// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
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
            purchasedResources: user.purchasedResources || [], // ✅ ADD THIS LINE
            savedResources: user.savedResources || [],         // ✅ ADD THIS LINE TOO
            // Add other profile fields here as needed
        });
    } catch (err) {
        console.error('Get user data error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/users/me/profile
// @desc    Update user profile
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
        
        // ✅ ALSO UPDATE THIS TO INCLUDE purchasedResources IN PROFILE UPDATE RESPONSE
        res.status(200).json({ 
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                scholaraCoins: user.scholaraCoins,
                role: user.role,
                isVerified: user.isVerified,
                bio: user.bio,
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
        const user = await User.findById(req.user.id);
                
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error.message);
        res.status(500).json({ message: 'Server error during password change' });
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