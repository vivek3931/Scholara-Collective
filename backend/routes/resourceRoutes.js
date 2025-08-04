// server/routes/resourceRoutes.js

const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Resource = require('../models/Resource');
// CRITICAL: Import both the 'protect' and 'authorize' middleware for security
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');
const axios = require('axios');
const mongoose = require('mongoose');

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000 // Set a timeout of 60 seconds
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Max 10MB file size
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/msword' || // .doc
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || // .docx
            file.mimetype === 'application/vnd.ms-excel' || // .xls
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || // .xlsx
            file.mimetype === 'application/vnd.ms-powerpoint' || // .ppt
            file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'), false);
        }
    }
});

// --- Helper Functions (Consolidated and Refined) ---
const getCloudinaryResourceType = (mimetype) => {
    if (mimetype.startsWith('image/')) {
        return 'image';
    }
    return 'raw';
};

const getFileExtensionFromMime = (mimeType) => {
    switch (mimeType) {
        case 'application/pdf': return '.pdf';
        case 'image/jpeg': return '.jpg';
        case 'image/png': return '.png';
        case 'image/gif': return '.gif';
        case 'image/svg+xml': return '.svg';
        case 'application/msword': return '.doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return '.docx';
        case 'application/vnd.ms-excel': return '.xls';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return '.xlsx';
        case 'application/vnd.ms-powerpoint': return '.ppt';
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': return '.pptx';
        default: return '';
    }
};

const getFileExtensionFromUrl = (url) => {
    if (!url) return '';
    const path = new URL(url).pathname;
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex > -1) {
        return path.substring(lastDotIndex).split(/[?#]/)[0].toLowerCase();
    }
    return '';
};

const uploadWithRetry = async (fileBuffer, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
        try {
            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(result);
                });
                uploadStream.end(fileBuffer);
            });
        } catch (error) {
            console.error(`Cloudinary upload failed (attempt ${i + 1}/${retries}):`, error);
            if (i === retries - 1) throw error;
            await new Promise(res => setTimeout(res, 2000 * (i + 1)));
        }
    }
};

// --- API Routes ---
// The following routes are organized by access level for clarity.

// === Public Routes ===
// Anyone can access these endpoints without a token.
router.get('/', async (req, res) => {
    try {
        const { search, subject, year, tags, sort, page = 1, limit = 10 } = req.query;
        const query = { visibility: 'public' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                { tags: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (subject) query.subject = subject;
        if (year) query.year = year;
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        const sortOptions = {};
        if (sort) {
            switch (sort) {
                case 'newest': sortOptions.createdAt = -1; break;
                case 'downloads': sortOptions.downloads = -1; break;
                case 'rating': sortOptions.averageRating = -1; break;
                default: sortOptions.createdAt = -1;
            }
        }

        const resources = await Resource.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit))
            .populate('uploadedBy', 'username')
            .populate('comments.postedBy', 'username'); // Changed from comments.user to comments.postedBy

        const total = await Resource.countDocuments(query);
        
        res.json({
            resources,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total
        });
    } catch (err) {
        console.error('Get all resources route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/analytics/stats', async (req, res) => {
  try {
    const resources = await Resource.countDocuments({ visibility: 'public' });
    // Placeholder logic for other stats (implement based on your data model)
    const students = await User.countDocuments(); // Assuming a User model
    const courses = await Resource.distinct('course').length; // Unique courses
    const universities = await Resource.distinct('institution').length; // Unique institutions
    res.json({ resources, students, courses, universities });
  } catch (err) {
    console.error('Analytics stats error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
}); 

router.get('/my-library', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'savedResources',
            populate: {
                path: 'uploadedBy',
                select: 'username'
            }
        });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user.savedResources);
    } catch (err) {
        console.error('My-library route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
        .populate('uploadedBy', 'username')
        .populate('comments.user', 'username');
        
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.json(resource);
    } catch (err) {
        console.error('Get resource by ID route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/:id/download', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        const fileUrl = resource.cloudinaryUrl;
        const fileExtension = getFileExtensionFromUrl(fileUrl);
        const headResponse = await axios.head(fileUrl);
        const contentType = headResponse.headers['content-type'];
        const contentDisposition = `attachment; filename="${encodeURIComponent(resource.title)}${fileExtension}"`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        response.data.pipe(res);
        response.data.on('error', (err) => {
            console.error('Download stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ msg: 'Error streaming the file' });
            }
        });
    } catch (err) {
        console.error('Download route error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Download failed. Please try again later.' });
        }
    }
});

router.get('/:id/preview', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        const fileUrl = resource.cloudinaryUrl;
        const fileExtension = getFileExtensionFromUrl(fileUrl);
        const headResponse = await axios.head(fileUrl);
        const contentType = headResponse.headers['content-type'];
        const contentDisposition = `inline; filename="${encodeURIComponent(resource.title)}${fileExtension}"`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        const response = await axios.get(fileUrl, { responseType: 'stream' });
        response.data.pipe(res);
        response.data.on('error', (err) => {
            console.error('Preview stream error:', err);
            if (!res.headersSent) {
                res.status(500).json({ msg: 'Error streaming the file for preview.' });
            }
        });
    } catch (err) {
        console.error('Preview route error:', err.message);
        if (!res.headersSent) {
            res.status(500).json({ msg: 'Failed to generate preview. The file might be unavailable or of an unsupported type.' });
        }
    }
});


// === Private Routes ===
// These routes require an authentication token.
// The `protect` middleware ensures the user is logged in.
// backend/routes/resourceRoutes.js
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ msg: 'No file uploaded.' });
        }
        const { title, subject, year, description, tags, institution, course } = req.body;
        if (!title || !subject || !year || !institution || !course) {
            return res.status(400).json({ msg: 'Please enter all required fields (Title, Subject, Year, Institution, Course).' });
        }
        if (title.length < 3 || title.length > 100) {
            return res.status(400).json({ msg: 'Title must be between 3 and 100 characters.' });
        }
        if (description && description.length > 500) {
            return res.status(400).json({ msg: 'Description cannot exceed 500 characters.' });
        }
        const currentYear = new Date().getFullYear();
        if (year < 1900 || year > currentYear + 5) {
            return res.status(400).json({ msg: `Invalid year. Must be between 1900 and ${currentYear + 5}.` });
        }
        const resourceType = getCloudinaryResourceType(req.file.mimetype);
        const fileExtension = getFileExtensionFromMime(req.file.mimetype) || getFileExtensionFromUrl(req.file.originalname);
        const originalName = req.file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');
        const uploadOptions = {
            folder: 'paperpal_resources',
            resource_type: resourceType,
            public_id: `paperpal_resources/${Date.now()}_${originalName}`,
            overwrite: false,
        };
        const result = await uploadWithRetry(req.file.buffer, uploadOptions);
        if (!result || !result.secure_url) {
            throw new Error('Cloudinary upload failed to return a URL.');
        }
        const newResource = new Resource({
            title,
            subject,
            course,
            year: parseInt(year),
            description: description || '',
            tags: tags ? JSON.parse(tags) : [],
            institution,
            uploadedBy: req.user.id,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            fileType: req.file.mimetype.split('/')[0] === 'image' ? 'image' : (fileExtension.substring(1) || 'document'),
            visibility: 'public' // Ensure visibility is set
        });
        const resource = await newResource.save();

        if (req.io) {
            const stats = await (async () => {
                return {
                    resources: await Resource.countDocuments({ visibility: 'public' }),
                    students: await User.countDocuments(),
                    courses: await Resource.distinct('course').length,
                    universities: await Resource.distinct('institution').length
                };
            })();
            req.io.emit('statsUpdated', stats);
        }

        res.status(201).json(resource);
    } catch (err) {
        console.error('Upload route error:', err.message);
        if (err.message === 'Invalid file type.') {
            return res.status(400).json({ msg: 'Invalid file type.' });
        }
        if (err instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Server error during upload. ' + err.message });
    }
});


router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { rating } = req.body;
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        const hasRated = resource.ratings.some(r => r.postedBy.toString() === req.user.id);
        if (hasRated) {
            return res.status(400).json({ msg: 'You have already rated this resource' });
        }
        resource.ratings.unshift({ postedBy: req.user.id, rating });
        const totalRating = resource.ratings.reduce((acc, item) => item.rating + acc, 0);
        resource.averageRating = totalRating / resource.ratings.length;
        await resource.save();
        res.json(resource);
    } catch (err) {
        console.error('Rate route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/:id/comment', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: 'Comment text is required' });
        }
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        const newComment = {
            text,
            postedBy: req.user.id,
        };
        resource.comments.unshift(newComment);
        await resource.save();
        await resource.populate('comments.user', 'username');
        res.json(resource.comments);
    } catch (err) {
        console.error('Comment route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const resourceId = req.params.id;
        if (user.savedResources.includes(resourceId)) {
            return res.status(400).json({ msg: 'Resource already saved' });
        }
        user.savedResources.unshift(resourceId);
        await user.save();
        res.json({ msg: 'Resource saved successfully' });
    } catch (err) {
        console.error('Save route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/:id/unsave', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        const resourceId = req.params.id;
        user.savedResources = user.savedResources.filter(id => id.toString() !== resourceId);
        await user.save();
        res.json({ msg: 'Resource unsaved successfully' });
    } catch (err) {
        console.error('Unsave route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/:id/upvote', protect, async (req, res) => {
    try {
        const { commentId } = req.body;
        if (!commentId) {
            return res.status(400).json({ msg: 'Comment ID is required' });
        }
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        const comment = resource.comments.find(c => c._id.toString() === commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }
        if (comment.upvotes.includes(req.user.id)) {
            comment.upvotes = comment.upvotes.filter(id => id.toString() !== req.user.id);
        } else {
            comment.upvotes.unshift(req.user.id);
        }
        await resource.save();
        res.json(resource.comments);
    } catch (err) {
        console.error('Upvote route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/:id/flag', protect, async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) {
            return res.status(400).json({ msg: 'Reason is required for flagging' });
        }
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        resource.flags.unshift({
            postedBy: req.user.id,
            reason
        });
        await resource.save();
        res.json({ msg: 'Resource flagged for review' });
    } catch (err) {
        console.error('Flag route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.put('/:id/increment-download', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        resource.downloads += 1;
        await resource.save();
        res.json({ msg: 'Download count incremented successfully', downloads: resource.downloads });
    } catch (err) {
        console.error('Increment download route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});


// === Admin-only Routes ===
// These routes require both a token and the user to have an 'admin' or 'superadmin' role.
// The `protect` middleware is used first to authenticate, and `authorize` is used second to check roles.
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    // This is the implementation of the update logic.
    // It should be moved here from the controller.
    try {
        const { title, description, subject, course, year, tags, institution, visibility } = req.body;
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        const updateFields = {
            title: title || resource.title,
            description: description || resource.description,
            subject: subject || resource.subject,
            course: course || resource.course,
            year: year || resource.year,
            tags: tags || resource.tags,
            institution: institution || resource.institution,
            visibility: visibility || resource.visibility,
        };

        const updatedResource = await Resource.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true } // Return the updated document and run schema validators
        );

        res.json({ msg: 'Resource updated successfully', resource: updatedResource });
    } catch (err) {
        console.error('Update resource route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Server error during resource update.' });
    }
});

router.delete('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        await resource.remove();
        res.json({ msg: 'Resource deleted successfully' });
    } catch (err) {
        console.error('Delete resource route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Server error during resource deletion.' });
    }
});

module.exports = router;
