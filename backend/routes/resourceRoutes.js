const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const Resource = require('../models/Resource');
const auth = require('../middleware/auth');
const User = require('../models/User');
const axios = require('axios'); // Ensure axios is required at the top
const mongoose = require('mongoose'); // Added for ValidationError check

// Configure Cloudinary using environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000 // Set a timeout of 60 seconds (was 30000, increased for robustness)
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

// Helper function to get the correct Cloudinary resource type
const getCloudinaryResourceType = (mimetype) => {
    if (mimetype.startsWith('image/')) {
        return 'image';
    }
    // All documents and non-image files are treated as 'raw' for direct upload
    return 'raw';
};

// Helper function to get a file extension from a mimetype
const getFileExtensionFromMime = (mimeType) => {
    switch (mimeType) {
        case 'application/pdf':
            return '.pdf';
        case 'image/jpeg':
            return '.jpg';
        case 'image/png':
            return '.png';
        case 'image/gif':
            return '.gif';
        case 'image/svg+xml':
            return '.svg';
        case 'application/msword': // .doc
            return '.doc';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': // .docx
            return '.docx';
        case 'application/vnd.ms-excel': // .xls
            return '.xls';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': // .xlsx
            return '.xlsx';
        case 'application/vnd.ms-powerpoint': // .ppt
            return '.ppt';
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation': // .pptx
            return '.pptx';
        default:
            // Fallback for types not explicitly listed, extract from filename if possible later.
            return '';
    }
};

// Helper function to extract file extension from a URL (useful for existing Cloudinary URLs)
const getFileExtensionFromUrl = (url) => {
    if (!url) return '';
    const path = new URL(url).pathname;
    const lastDotIndex = path.lastIndexOf('.');
    if (lastDotIndex > -1) {
        return path.substring(lastDotIndex).split(/[?#]/)[0].toLowerCase();
    }
    return '';
};

// Function to handle Cloudinary upload with retries
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
            if (i === retries - 1) throw error; // Re-throw if last attempt
            await new Promise(res => setTimeout(res, 2000 * (i + 1))); // Exponential backoff
        }
    }
};

// --- API Routes ---

// @route   POST /api/resources/upload
// @desc    Upload a new academic resource
// @access  Private
router.post('/upload', auth, upload.single('file'), async (req, res) => {
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
        // Use the original filename's extension for Cloudinary public_id, for better recognition
        const fileExtension = getFileExtensionFromMime(req.file.mimetype) || getFileExtensionFromUrl(req.file.originalname);
        const originalName = req.file.originalname.replace(/\s/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');

        const uploadOptions = {
            folder: 'paperpal_resources',
            resource_type: resourceType,
            public_id: `paperpal_resources/${Date.now()}_${originalName}`,
            overwrite: false,
            // Automatically convert office documents to PDF for better preview options if desired later
            // This is a powerful Cloudinary feature
            // If resourceType is 'raw' and it's an office doc, you could add:
            // raw_convert: 'as_pdf'
            // Keep in mind 'raw_convert' makes it a PDF, so fileType might change
            // For now, let's keep it simple and just upload as is.
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
            fileType: req.file.mimetype.split('/')[0] === 'image' ? 'image' : (fileExtension.substring(1) || 'document') // Store primary type or derived extension
        });

        const resource = await newResource.save();
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

// @route   GET /api/resources
// @desc    Fetch all resources with optional filtering, sorting, and pagination
// @access  Public
router.get('/', async (req, res) => {
    try {
        const { search, subject, year, tags, sort, page = 1, limit = 10 } = req.query;
        const query = { visibility: 'public' };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } },
                // Use a lookup or populate the uploadedBy field to search username
                // For simplicity here, assuming 'uploadedBy.username' is populated or directly searchable
                // A better way would be to get user IDs from usernames first if not populated
                // { 'uploadedBy.username': { $regex: search, $options: 'i' } }, // This needs adjustments with populate
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
                case 'newest':
                    sortOptions.createdAt = -1;
                    break;
                case 'downloads':
                    sortOptions.downloads = -1;
                    break;
                case 'rating':
                    sortOptions.averageRating = -1;
                    break;
                default:
                    sortOptions.createdAt = -1;
            }
        }

        const resources = await Resource.find(query)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit))
            .populate('uploadedBy', 'username')
            .populate('comments.user', 'username');

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

router.get('/my-library', auth, async (req, res) => {
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
// @route   GET /api/resources/:id
// @desc    Fetch a single resource by ID
// @access  Public
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

// @route   POST /api/resources/:id/rate
// @desc    Rate a resource
// @access  Private
router.post('/:id/rate', auth, async (req, res) => {
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

// @route   POST /api/resources/:id/comment
// @desc    Add a comment to a resource
// @access  Private
router.post('/:id/comment', auth, async (req, res) => {
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

// @route   PUT /api/resources/:id/save
// @desc    Save a resource to a user's library
// @access  Private
router.put('/:id/save', auth, async (req, res) => {
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

// @route   PUT /api/resources/:id/unsave
// @desc    Remove a resource from a user's library
// @access  Private
router.put('/:id/unsave', auth, async (req, res) => {
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

// @route   GET /api/resources/my-library
// @desc    Get all resources saved by the current user
// @access  Private

// @route   PUT /api/resources/:id/upvote
// @desc    Upvote a comment
// @access  Private
router.put('/:id/upvote', auth, async (req, res) => {
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

// @route   POST /api/resources/:id/flag
// @desc    Flag a resource for review
// @access  Private
router.post('/:id/flag', auth, async (req, res) => {
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

// @route   GET /api/resources/:id/download
// @desc    Streams a file for download and increments the download count
// @access  Public (Consider making this Private if downloads should be restricted)
router.get('/:id/download', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        const fileUrl = resource.cloudinaryUrl;
        const fileExtension = getFileExtensionFromUrl(fileUrl); // Use the general helper

        const headResponse = await axios.head(fileUrl);
        const contentType = headResponse.headers['content-type'];
        const contentDisposition = `attachment; filename="${encodeURIComponent(resource.title)}${fileExtension}"`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);

        const response = await axios.get(fileUrl, { responseType: 'stream' });
        response.data.pipe(res);

        // This increment is now replaced by a separate frontend call in your `handleDownload`
        // resource.downloads += 1;
        // await resource.save();

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

// --- NEW PREVIEW ROUTE ---
// @route   GET /api/resources/:id/preview
// @desc    Streams a file for preview without incrementing the download count
// @access  Public (or Private if previews should be restricted)
router.get('/:id/preview', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        const fileUrl = resource.cloudinaryUrl;
        const fileExtension = getFileExtensionFromUrl(fileUrl); // Use the general helper

        // Fetch headers to get content type and verify file existence
        const headResponse = await axios.head(fileUrl);
        const contentType = headResponse.headers['content-type'];

        // For preview, we want 'inline' disposition or omit it entirely.
        // Omitting often works, but 'inline' explicitly tells the browser to display.
        const contentDisposition = `inline; filename="${encodeURIComponent(resource.title)}${fileExtension}"`;

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', contentDisposition);
        res.setHeader('X-Content-Type-Options', 'nosniff'); // Security header to prevent MIME sniffing

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
            // A generic error for preview failure. Client-side should handle displaying a message.
            res.status(500).json({ msg: 'Failed to generate preview. The file might be unavailable or of an unsupported type.' });
        }
    }
});

// @route   PUT /api/resources/:id/increment-download
// @desc    Increments download count via a separate API call (e.g., after successful download initiated client-side)
// @access  Private (or Public) - Best called from frontend after actual download initiates
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

module.exports = router;