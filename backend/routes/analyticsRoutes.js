const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const User = require('../models/User');
const auth = require('../middleware/auth'); // For protecting admin routes
const moment = require('moment'); // For date-based queries (npm install moment)

// @route   GET /api/analytics/admin/summary
// @desc    Get overall platform summary for admin dashboard
// @access  Private (Admin Only) - Requires role check
router.get('/admin/summary', auth, async (req, res) => {
    try {
        // Basic role check (you might want a more robust middleware for this)
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const totalUsers = await User.countDocuments();
        const totalResources = await Resource.countDocuments();
        const totalDownloads = (await Resource.aggregate([
            { $group: { _id: null, total: { $sum: '$downloads' } } }
        ]))[0]?.total || 0;

        // You could also add:
        // - Resources uploaded in last 7 days
        // - New users in last 7 days
        // - Most flagged resources
        // - Average rating across all resources

        res.json({
            totalUsers,
            totalResources,
            totalDownloads
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/analytics/admin/popular-resources
// @desc    Get top N most downloaded resources for admin
// @access  Private (Admin Only)
router.get('/admin/popular-resources', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const limit = parseInt(req.query.limit) || 10; // Default to top 10

        const popularResources = await Resource.find({})
            .sort({ downloads: -1 }) // Sort by downloads in descending order
            .limit(limit)
            .select('title downloads averageRating'); // Select specific fields

        res.json(popularResources);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/analytics/admin/flagged-resources
// @desc    Get all resources that have been flagged for admin review
// @access  Private (Admin Only)
router.get('/admin/flagged-resources', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const flaggedResources = await Resource.find({ 'flags.0': { '$exists': true } }) // Check if flags array is not empty
            .populate('uploadedBy', 'username email')
            .populate('flags.user', 'username email') // Populate user who flagged
            .sort({ 'flags.createdAt': -1 }); // Sort by latest flag

        res.json(flaggedResources);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET /api/analytics/user/my-activity
// @desc    Get user's upload/download history for their dashboard
// @access  Private (User specific)
router.get('/user/my-activity', auth, async (req, res) => {
    try {
        // For user view of upload/download history 
        const userId = req.user.id;

        const uploadedResources = await Resource.find({ uploadedBy: userId })
            .select('title downloads createdAt')
            .sort({ createdAt: -1 });

        // Note: Tracking downloads by a specific user is complex without
        // adding a specific 'downloadedBy' array to resources or a dedicated
        // download history in the User model. For now, we'll show uploaded.
        // If you need per-user download history, you'd need to modify the
        // Resource model or User model to store that data.

        const savedResourcesCount = (await User.findById(userId).select('savedResources')).savedResources.length;

        res.json({
            uploadedResources,
            savedResourcesCount, // Count of resources saved to personal library
            // downloadsByMe: [...] // Placeholder if you implement specific user download tracking
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;