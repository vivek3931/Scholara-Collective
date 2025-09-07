// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');
const { 
    notifyNewUser, 
    notifyResourceFlagged, 
    notifyNewResource,
    notifySystemAlert 
} = require('../socket/adminSocket');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000,
});

// Helper function to get Cloudinary resource type
const getCloudinaryResourceType = (fileType) => {
    if (fileType.startsWith('image')) return 'image';
    return 'raw';
};

// @route   GET /api/admin/dashboard
// @desc    Get admin dashboard statistics
// @access  Private (Admin or Superadmin)
router.get('/dashboard', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalResources = await Resource.countDocuments();
        const totalDownloads = (await Resource.aggregate([
            { $group: { _id: null, total: { $sum: '$downloads' } } },
        ]))[0]?.total || 0;
        const flaggedResources = await Resource.countDocuments({ 'flags.0': { $exists: true } });

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
        const recentResources = await Resource.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        // Get recent activities for notifications
        const recentActivities = await Promise.all([
            User.find({ createdAt: { $gte: thirtyDaysAgo } })
                .select('username email createdAt')
                .sort({ createdAt: -1 })
                .limit(5),
            Resource.find({ 'flags.0': { $exists: true } })
                .populate('uploadedBy', 'username')
                .populate('flags.postedBy', 'username')
                .sort({ 'flags.createdAt': -1 })
                .limit(5)
        ]);

        const topSubjects = await Resource.aggregate([
            { $group: { _id: '$subject', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        const topInstitutions = await Resource.aggregate([
            { $group: { _id: '$institution', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        const activeUsers = await User.find({ 'stats.uploadCount': { $gt: 0 } })
            .sort({ 'stats.uploadCount': -1 })
            .limit(10)
            .select('username email stats.uploadCount');

        res.json({
            stats: {
                totalUsers,
                totalResources,
                totalDownloads: totalDownloads,
                flaggedResources,
                recentUsers,
                recentResources,
            },
            topSubjects,
            topInstitutions,
            activeUsers,
            recentActivities: {
                newUsers: recentActivities[0],
                flaggedResources: recentActivities[1]
            }
        });
    } catch (err) {
        console.error('Admin dashboard error:', err.message);
        
        // Notify admins of system error
        notifySystemAlert('dashboard-error', 'Dashboard data fetch failed', {
            error: err.message,
            timestamp: new Date()
        });
        
        res.status(500).json({ msg: 'Server error' });
    }
});



router.get('/notifications', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        
        // In a real application, you'd store notifications in a database
        // For now, we'll return recent activities as notifications
        const query = {};
        
        if (type && type !== 'all') {
            // Filter by notification type if needed
        }

        // Get recent flagged resources as notifications
        const flaggedResources = await Resource.find({ 'flags.0': { $exists: true } })
            .populate('uploadedBy', 'username email')
            .populate('flags.postedBy', 'username')
            .sort({ 'flags.createdAt': -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit));

        // Get recent users as notifications
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit))
            .select('username email createdAt');

        // Format as notifications
        const notifications = [
            ...flaggedResources.map(resource => ({
                id: `flag_${resource._id}`,
                type: 'resource-flagged',
                title: 'Resource Flagged',
                message: `Resource "${resource.title}" was flagged`,
                timestamp: resource.flags[0]?.createdAt || resource.createdAt,
                data: resource,
                read: false
            })),
            ...recentUsers.map(user => ({
                id: `user_${user._id}`,
                type: 'new-user',
                title: 'New User Registration',
                message: `${user.username} joined the platform`,
                timestamp: user.createdAt,
                data: user,
                read: false
            }))
        ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const total = notifications.length;

        res.json({
            notifications: notifications.slice(0, parseInt(limit)),
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });

    } catch (err) {
        console.error('Get notifications error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});


router.post('/notifications/:id/read', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        // In a real implementation, you'd update the notification status in the database
        console.log(`Notification ${req.params.id} marked as read by admin ${req.user.username}`);
        
        res.json({ msg: 'Notification marked as read' });
    } catch (err) {
        console.error('Mark notification read error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});




// @route   GET /api/admin/users
// @desc    Get all users with pagination and search
// @access  Private (Admin or Superadmin)
router.get('/users', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { search, page = 1, limit = 20, status } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }

        if (status && status !== 'all') {
            query.isActive = status === 'active';
        }

        const users = await User.find(query)
            .select('username email role isActive stats createdAt')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit));

        const total = await User.countDocuments(query);

        res.json({
            users: users,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
        });
    } catch (err) {
        console.error('Admin get users error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Private (Admin or Superadmin)
router.patch('/users/:id/toggle-status', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // A user cannot deactivate/activate themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ msg: 'You cannot change your own status' });
        }

        // Admins cannot change the status of superadmins
        if (req.user.role === 'admin' && user.role === 'superadmin') {
            return res.status(403).json({ msg: 'Admins cannot modify superadmin accounts' });
        }

        user.isActive = !user.isActive;
        await user.save();

        res.json({
            msg: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                isActive: user.isActive,
            },
        });
    } catch (err) {
        console.error('Toggle user status error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and their associated data (GDPR compliance)
// @access  Private (Admin or Superadmin)
router.delete('/users/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // A user cannot delete themselves
        if (req.user.id === req.params.id) {
            return res.status(400).json({ msg: 'You cannot delete your own account' });
        }

        // Superadmins cannot delete other superadmins
        if (req.user.role !== 'superadmin' && userToDelete.role === 'superadmin') {
            return res.status(403).json({ msg: 'Admins cannot delete superadmin accounts' });
        }

        // Admin cannot delete other Admins
        if (req.user.role === 'admin' && userToDelete.role === 'admin') {
            return res.status(403).json({ msg: 'Admins cannot delete other admin accounts' });
        }


        const resources = await Resource.find({ uploadedBy: req.params.id });
        for (const resource of resources) {
            if (resource.cloudinaryPublicId) {
                await cloudinary.uploader.destroy(resource.cloudinaryPublicId, {
                    resource_type: getCloudinaryResourceType(resource.fileType),
                });
            }
            await Resource.deleteOne({ _id: resource._id });
        }

        await Resource.updateMany(
            { 'comments.user': req.params.id },
            { $pull: { comments: { user: req.params.id } } }
        );
        await Resource.updateMany(
            { 'ratings.user': req.params.id },
            { $pull: { ratings: { user: req.params.id } } }
        );
        await Resource.updateMany(
            { 'flags.user': req.params.id },
            { $pull: { flags: { user: req.params.id } } }
        );

        await User.deleteOne({ _id: req.params.id });

        res.json({ msg: 'User and associated data deleted successfully' });
    } catch (err) {
        console.error('Delete user error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/admin/users/:id/promote
// @desc    Promote user to admin (super admin only)
// @access  Private (Superadmin only)
router.put('/users/:id/promote', protect, authorize('superadmin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (user.role === 'admin' || user.role === 'superadmin') {
            return res.status(400).json({ msg: 'User is already an admin or super admin' });
        }

        user.role = 'admin';
        await user.save();

        res.json({
            msg: 'User promoted to admin successfully',
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Promote user error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/admin/resources
// @desc    Get all resources with admin controls
// @access  Private (Admin or Superadmin)
router.get('/resources', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { search, subject, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (subject && subject !== 'all') {
            query.subject = subject;
        }

        if (status && status !== 'all') {
            if (status === 'flagged') {
                query['flags.0'] = { $exists: true };
            } else {
                query.visibility = status;
            }
        }

        const resources = await Resource.find(query)
            .populate('uploadedBy', 'username email')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit));

        const total = await Resource.countDocuments(query);

        res.json({
            resources,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
        });
    } catch (err) {
        console.error('Admin get resources error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/admin/flagged-resources
// @desc    Get all flagged resources for review
// @access  Private (Admin or Superadmin)
router.get('/flagged-resources', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const flaggedResources = await Resource.find({ 'flags.0': { $exists: true } })
            .populate('uploadedBy', 'username email')
            .populate('flags.postedBy', 'username')
            .sort({ 'flags.createdAt': -1 });

        res.json(flaggedResources);
    } catch (err) {
        console.error('Get flagged resources error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/admin/resources/:id/toggle-visibility
// @desc    Toggle resource visibility (public/private)
// @access  Private (Admin or Superadmin)
router.put('/resources/:id/toggle-visibility', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        resource.visibility = resource.visibility === 'public' ? 'private' : 'public';
        await resource.save();

        res.json({
            msg: `Resource ${resource.visibility === 'public' ? 'made public' : 'made private'}`,
            resource: {
                _id: resource._id,
                title: resource.title,
                visibility: resource.visibility,
            },
        });
    } catch (err) {
        console.error('Toggle resource visibility error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/admin/resources/:id
// @desc    Delete a resource (admin or Superadmin)
// @access  Private (Admin or Superadmin)
router.delete('/resources/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (resource.cloudinaryPublicId) {
            try {
                await cloudinary.uploader.destroy(resource.cloudinaryPublicId, {
                    resource_type: getCloudinaryResourceType(resource.fileType),
                });
            } catch (cloudinaryError) {
                console.error('Cloudinary deletion error:', cloudinaryError);
            }
        }

        await User.updateMany(
            { savedResources: resource._id },
            { $pull: { savedResources: resource._id } }
        );

        await Resource.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Resource deleted successfully' });
    } catch (err) {
        console.error('Delete resource error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/resources/:id/resolve-flags', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const { action } = req.body;

        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (action === 'remove') {
            // Delete the resource completely
            if (resource.cloudinaryPublicId) {
                try {
                    await cloudinary.uploader.destroy(resource.cloudinaryPublicId, {
                        resource_type: getCloudinaryResourceType(resource.fileType),
                    });
                } catch (cloudinaryError) {
                    console.error('Cloudinary deletion error:', cloudinaryError);
                }
            }

            // Remove resource from users' saved lists
            await User.updateMany(
                { savedResources: resource._id },
                { $pull: { savedResources: resource._id } }
            );

            await Resource.findByIdAndDelete(req.params.id);
            return res.json({ msg: 'Flagged resource removed successfully' });
        } else if (action === 'approve') {
            // Clear all flags and keep the resource
            resource.flags = [];
            await resource.save();
            return res.json({ msg: 'Flags cleared and resource approved' });
        } else {
            return res.status(400).json({ msg: 'Invalid action. Use "remove" or "approve".' });
        }
    } catch (err) {
        console.error('Resolve flags error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/admin/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/auth/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username email role isActive');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error('Get user error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/admin/system-info
// @desc    Get system information and health status
// @access  Private (Superadmin only)
router.get('/system-info', protect, authorize('superadmin'), async (req, res) => {
    try {
        const dbStats = await mongoose.connection.db.stats();
        const collections = await mongoose.connection.db.listCollections().toArray();

        res.json({
            database: {
                size: dbStats.dataSize,
                collections: collections.length,
                indexes: dbStats.indexes,
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                nodeVersion: process.version,
            },
            timestamp: new Date(),
        });
    } catch (err) {
        console.error('System info error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
