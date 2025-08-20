// backend/routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/analytics/summary
// @desc    Get a summary of platform analytics for the admin dashboard.
// @access  Private (Admin/Superadmin only)
router.get('/public-stats', async (req, res) => {
    try {
        const totalResources = await Resource.countDocuments({ visibility: 'public' });
        const totalStudents = await User.countDocuments(); 
        
        // Corrected lines
        const courses = await Resource.distinct('course');
        const totalCourses = courses.length;
        
        const universities = await Resource.distinct('institution');
        const totalUniversities = universities.length;
        
        // New lines to calculate referral stats
        const totalReferralCoinsResult = await User.aggregate([{ $group: { _id: null, total: { $sum: '$referralCoins' } } }]);
        const totalReferralCoins = totalReferralCoinsResult.length > 0 ? totalReferralCoinsResult[0].total : 0;
        const totalReferrals = await User.countDocuments({ referredBy: { $exists: true } });

        res.json({
            resources: totalResources,
            students: totalStudents,
            courses: totalCourses,
            universities: totalUniversities,
            // Added referral stats to the response
            referralCoins: totalReferralCoins,
            totalReferrals: totalReferrals
        });
    } catch (err) {
        console.error('Public stats route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


router.get('/contributors', async (req, res) => {
    try {
        const frequentContributors = await Resource.aggregate([
            {
                // Group resources by the user who uploaded them, using 'uploadedBy'
                $group: {
                    _id: '$uploadedBy', // <-- CORRECTED: Use 'uploadedBy' from your Resource schema
                    contributionCount: { $sum: 1 } // Count how many resources each user has
                }
            },
            {
                // Filter for users who have contributed more than once
                $match: {
                    contributionCount: { $gt: 1 } // Only include users with more than 1 contribution
                }
            },
            {
                // Join with the User collection to get the full user details
                $lookup: {
                    from: 'users', // The name of your users collection in MongoDB (typically 'users')
                    localField: '_id', // The _id from the $group stage (which is the uploadedBy ID)
                    foreignField: '_id', // The _id from the users collection
                    as: 'userDetails'
                }
            },
            {
                // Unwind the userDetails array (since $lookup returns an array)
                // This ensures we get a single user object per result
                $unwind: '$userDetails'
            },
            {
                // Project to shape the output data with relevant user and contribution info
                $project: {
                    _id: 0, // Exclude the original _id from the grouped stage
                    userId: '$_id', // Rename _id to userId for consistent frontend prop names
                    contributionCount: 1,
                    name: '$userDetails.username', // Assuming User model has a 'name' field
                    email: '$userDetails.email', // Assuming User model has an 'email' field
                    profilePicture: '$userDetails.profilePicture' // If you have a profile picture field
                }
            }
        ]);

        res.json(frequentContributors);
    } catch (err) {
        console.error('Error fetching frequent contributors:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});



router.get('/summary', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalResources = await Resource.countDocuments();
        const totalDownloads = await Resource.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: '$downloads' }
                }
            }
        ]);
        const totalFlags = await Resource.countDocuments({ 'flags.0': { '$exists': true } });

        res.json({
            totalUsers,
            totalResources,
            totalDownloads: totalDownloads[0]?.total || 0,
            totalFlaggedResources: totalFlags
        });
    } catch (err) {
        console.error('Analytics summary route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


// @route   GET /api/analytics/top-resources
// @desc    Get top resources by downloads or ratings for admin view.
// @access  Private (Admin/Superadmin only)
router.get('/top-resources', protect, authorize('admin', 'superadmin'), async (req, res) => {
    const { sortBy = 'downloads', limit = 10 } = req.query;

    // Validate sortBy parameter
    const validSorts = ['downloads', 'averageRating'];
    if (!validSorts.includes(sortBy)) {
      return res.status(400).json({ msg: 'Invalid sort parameter. Use "downloads" or "averageRating".' });
    }

    const sortOptions = {};
    sortOptions[sortBy] = -1; // Sort descending

    try {
        const resources = await Resource.find({})
            .sort(sortOptions)
            .limit(parseInt(limit))
            .populate('uploadedBy', 'username');

        res.json(resources);
    } catch (err) {
        console.error('Top resources route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


router.get('/users/top-contributors', protect, authorize('admin', 'superadmin'), async (req, res) => {
    const { limit = 10 } = req.query;

    try {
        const contributors = await Resource.aggregate([
            {
                $group: {
                    _id: '$uploadedBy',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: parseInt(limit)
            },
            {
                $lookup: {
                    from: 'users', // The name of the collection for the User model
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: '$user._id',
                    username: '$user.username',
                    email: '$user.email',
                    uploadCount: '$count'
                }
            }
        ]);

        res.json(contributors);
    } catch (err) {
        console.error('Top contributors route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


// @route   GET /api/analytics/resources/flags
// @desc    Get a list of all flagged resources for admin review.
// @access  Private (Admin/Superadmin only)
router.get('/resources/flags', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const flaggedResources = await Resource.find({ 'flags.0': { '$exists': true } })
            .sort({ 'flags.createdAt': -1 }) // Sort by newest flag
            .populate('uploadedBy', 'username')
            .populate('flags.postedBy', 'username'); // Correctly populating the user who posted the flag

        res.json(flaggedResources);
    } catch (err) {
        console.error('Flagged resources route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/analytics/user/my-activity
// @desc    Get a summary of the current user's activity (uploads, saved resources).
// @access  Private (Authenticated User only)
router.get('/user/my-activity', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        const uploadedResources = await Resource.find({ uploadedBy: userId })
            .select('title downloads createdAt averageRating')
            .sort({ createdAt: -1 });

        const savedResourcesCount = await User.findById(userId)
            .select('savedResources')
            .then(user => user?.savedResources.length || 0);

        // NOTE: Per-user download tracking is not implemented in the base models.
        // This is a placeholder for future functionality.

        res.json({
            uploadedResources,
            savedResourcesCount,
            // downloadsByMe: [...] // Placeholder for future implementation
        });

    } catch (err) {
        console.error('User activity route error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
