// server/routes/resourceRoutes.js

const express = require('express');
const router = express.Router();
const crypto = require('crypto');   
const cloudinary = require('cloudinary').v2;
const Resource = require('../models/Resource');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User'); 
const axios = require('axios');
const mongoose = require('mongoose');
const pdf = require('pdf-parse');
const Subject = require('../models/Subject')

require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    timeout: 60000 
});

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' ||
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'application/msword' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            file.mimetype === 'application/vnd.ms-excel' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
            file.mimetype === 'application/vnd.ms-powerpoint' || 
            file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' 
        ) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type.'), false);
        }
    }
});

// --- Helper Functions ---
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

// === Public Routes - IMPORTANT: Specific routes first, then general dynamic routes ===

// GET /api/resources/suggestions (Specific)
router.get('/suggestions', async (req, res) => {
    try {
        const { search } = req.query;
        if (!search || search.trim().length < 2) {
            return res.status(400).json({ msg: 'Search query must be at least 2 characters long' });
        }
        const textResults = await Resource.aggregate([
            { $match: { $text: { $search: search }, visibility: 'public' } },
            { $project: { _id: 1, title: 1, score: { $meta: "textScore" } } },
            { $sort: { score: { $meta: "textScore" } } },
            { $limit: 5 }
        ]);
        if (textResults.length < 5) {
            const regexResults = await Resource.find({
                title: { $regex: search, $options: 'i' },
                visibility: 'public'
            })
            .select('_id title')
            .limit(5 - textResults.length)
            .lean();
            const combined = [...textResults, ...regexResults]
                .filter((v, i, a) => a.findIndex(t => t._id.toString() === v._id.toString()) === i)
                .slice(0, 5);
            return res.json(combined);
        }
        res.json(textResults);
    } catch (err) {
        console.error('Suggestions route error:', err.message);
        res.status(500).json({ 
            msg: 'Failed to fetch suggestions',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// GET /api/resources/analytics/stats (Specific)
router.get('/analytics/stats', async (req, res) => {
    try {
        const resources = await Resource.countDocuments({ visibility: 'public' });
        const students = await User.countDocuments();
        const courses = await Resource.distinct('course').length;
        const universities = await Resource.distinct('institution').length;
        res.json({ resources, students, courses, universities });
    } catch (err) {
        console.error('Analytics stats error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// GET /api/resources/trending (Specific)
router.get('/trending', async (req, res) => { 
    try {
        const trendingResources = await Resource.find({ visibility: 'public' })
            .sort({ averageRating: -1, downloads: -1, createdAt: -1 }) 
            .limit(9) 
            .populate('uploadedBy', 'username'); 

        res.json(trendingResources);
    } catch (err) {
        console.error('Error fetching trending resources:', err.message);
        res.status(500).json({ msg: 'Server error fetching trending resources' });
    }
});

router.get("resources/:resourceId/thumbnail", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.resourceId); // Your DB logic
    if (!resource || !resource.filePath) return res.status(404).json({ msg: "Resource not found" });

    const output = await fromPath(resource.filePath, {
      density: 100, // Low resolution
      format: "jpeg",
      width: 200,
      height: 300,
      page: 1,
    }).bulk(-1);
    
    res.set("Content-Type", "image/jpeg");
    res.send(output[0].buffer);
  } catch (err) {
    console.error("Thumbnail generation failed:", err);
    res.status(500).json({ msg: "Failed to generate thumbnail" });
  }
});

// GET /api/resources/community/feed (Specific, and protected)
router.get('/community/feed', protect, async (req, res) => { 
    try {
        const recentComments = await Resource.aggregate([
            { $unwind: '$comments' },
            { $sort: { 'comments.createdAt': -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: 'comments.postedBy',
                    foreignField: '_id',
                    as: 'comments.user'
                }
            },
            { $unwind: '$comments.user' },
            {
                $project: {
                    _id: '$comments._id',
                    type: 'comment',
                    action: 'commented on',
                    user: {
                        _id: '$comments.user._id',
                        username: '$comments.user.username'
                    },
                    resource: {
                        _id: '$_id',
                        title: '$title'
                    },
                    createdAt: '$comments.createdAt'
                }
            }
        ]);

        const recentRatings = await Resource.aggregate([
            { $unwind: '$ratings' },
            { $sort: { 'ratings.createdAt': -1 } },
            { $limit: 10 }, 
            {
                $lookup: {
                    from: 'users',
                    localField: 'ratings.postedBy',
                    foreignField: '_id',
                    as: 'ratings.user'
                }
            },
            { $unwind: '$ratings.user' },
            {
                $project: {
                    _id: '$ratings._id',
                    type: 'rating',
                    action: 'rated',
                    rating: '$ratings.rating',
                    user: {
                        _id: '$ratings.user._id',
                        username: '$ratings.user.username'
                    },
                    resource: {
                        _id: '$_id',
                        title: '$title'
                    },
                    createdAt: '$ratings.createdAt'
                }
            }
        ]);

        const allActivity = [...recentComments, ...recentRatings].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 15);

        res.json(allActivity);
    } catch (err) {
        console.error('Error fetching community activity feed:', err.message);
        res.status(500).json({ msg: 'Server error fetching community feed' });
    }
});


// Get resources uploaded by the current user
router.get('/my-uploaded', protect, async (req, res) => {
    try {
        const resources = await Resource.find({ uploadedBy: req.user.id })
            .populate('uploadedBy', 'username')
            .populate('comments.postedBy', 'username')
            .sort({ createdAt: -1 });
        res.json({ resources });
    } catch (err) {
        console.error('My uploaded resources route error:', err.message);
        res.status(500).json({ msg: 'Server error while fetching uploaded resources' });
    }
});
// Get all resources (main browse page - more general)
router.get('/', async (req, res) => {
    try {
        const { search, subject, year, tags, sort, page = 1, limit = 10 } = req.query;
        const query = { visibility: 'public' };
        let sortOptions = {};

        if (search) {
            query.$text = { $search: search };
            sortOptions.score = { $meta: 'textScore' };
        }

        if (subject) query.subject = subject;
        if (year) query.year = year;
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagArray };
        }

        if (!search && sort) {
            switch (sort) {
                case 'newest': sortOptions.createdAt = -1; break;
                case 'downloads': sortOptions.downloads = -1; break;
                case 'rating': sortOptions.averageRating = -1; break;
                default: sortOptions.createdAt = -1;
            }
        } else if (Object.keys(sortOptions).length === 0) {
            sortOptions.createdAt = -1;
        }

        const projection = search ? { score: { $meta: 'textScore' } } : {};

        const resources = await Resource.find(query, projection)
            .sort(sortOptions)
            .limit(parseInt(limit))
            .skip((page - 1) * parseInt(limit))
            .populate('uploadedBy', 'username')
            .populate('comments.postedBy', 'username'); 

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
// GET a single resource by ID (Dynamic - should come AFTER all more specific public routes)
router.get('/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id)
            .populate('uploadedBy', 'username')
            .populate('comments.postedBy', 'username'); 

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        
        res.json({ resource, comments: resource.comments }); 
    } catch (err) {
        console.error('Get resource by ID route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found or invalid ID' });
        }
        res.status(500).json({ msg: 'Server error fetching resource details' });
    }
});

// Download a resource (Dynamic)
// server/routes/resourceRoutes.js

// @route   GET /api/resources/:id/download
// @desc    Download a resource after purchase verification
// @access  Private
// @route   GET /api/resources/:id/download
// @desc    Download a resource after purchase verification (Admin bypass)
// @access  Private
router.get('/:id/download', protect, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        const user = await User.findById(req.user.id);

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isOwner = user._id.toString() === resource.uploadedBy.toString();
        const hasPurchased = (user.purchasedResources || []).includes(resource._id.toString());
        const isAdmin = user.role === 'admin' || user.role === 'superadmin'; // ✅ ADD ADMIN CHECK

        // Check if the user is the owner, has purchased the resource, OR is an admin
        if (!isOwner && !hasPurchased && !isAdmin) {
            return res.status(403).json({ msg: 'Forbidden: You must purchase this resource to download it.' });
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
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Download failed. Please try again later.' });
    }
});

router.post('/:id/purchase', protect, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        const user = await User.findById(req.user.id);
        const { cost } = req.body;

        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Ensure user.purchasedResources is an array
        user.purchasedResources = user.purchasedResources || [];

        // Check if already purchased
        if (user.purchasedResources.includes(resource._id)) {
            return res.status(400).json({ msg: 'Resource already purchased' });
        }

        // Check if the user has enough coins
        if (user.scholaraCoins < cost) {
            return res.status(400).json({ msg: 'Insufficient coins' });
        }

        // Perform the transaction
        user.scholaraCoins -= cost;
        user.purchasedResources.push(resource._id);

        await user.save();
        
        // IMPORTANT: Return the updated user data including purchasedResources
        res.json({ 
            success: true, 
            message: 'Purchase successful', 
            scholaraCoins: user.scholaraCoins,
            purchasedResources: user.purchasedResources, // Add this line
            user: {
                _id: user._id,
                username: user.username,
                scholaraCoins: user.scholaraCoins,
                purchasedResources: user.purchasedResources
            }
        });

    } catch (err) {
        console.error('Purchase route error:', err.message);
        res.status(500).json({ msg: 'Server error during resource purchase.' });
    }
});

// Preview a resource (Dynamic)
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
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Failed to generate preview. The file might be unavailable or of an unsupported type.' });
    }
});


// === Private Routes (require 'protect' middleware) ===


// Upload a new resource
router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                msg: 'No file uploaded.'
            });
        }

        // Use a quick byte-for-byte hash for exact duplicates
        const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

        // Check if a resource with the same file hash already exists
        const existingFileHashResource = await Resource.findOne({
            fileHash: fileHash
        });
        if (existingFileHashResource) {
            return res.status(409).json({
                msg: 'This resource (exact file) has already been uploaded. Thank you for contributing!',
                existingResourceId: existingFileHashResource._id
            });
        }

        let textContent = '';
        const isPdf = req.file.mimetype === 'application/pdf';

        if (isPdf) {
            try {
                const data = await pdf(req.file.buffer);
                textContent = data.text;
            } catch (err) {
                console.error("Error extracting text from PDF:", err);
                return res.status(400).json({
                    msg: "Failed to process PDF content."
                });
            }
        }

        // Generate a hash of the text content
        const textHash = crypto.createHash('sha256').update(textContent).digest('hex');

        // Check if a resource with the same text content hash already exists
        if (isPdf) {
            const existingTextHashResource = await Resource.findOne({
                textHash: textHash
            });
            if (existingTextHashResource) {
                return res.status(409).json({
                    msg: 'A resource with similar text content has already been uploaded.',
                    existingResourceId: existingTextHashResource._id
                });
            }
        }

        const {
            title,
            subject,
            year,
            description,
            tags,
            institution,
            course
        } = req.body;

        // --- FIX 1: Handle the subject field sent as an object from the frontend ---
        // This handles cases where the subject is a string or a JSON object.
        let subjectValue;
        if (typeof subject === 'string') {
            try {
                const parsedSubject = JSON.parse(subject);
                subjectValue = parsedSubject.label || parsedSubject.value;
            } catch (e) {
                subjectValue = subject;
            }
        } else if (typeof subject === 'object' && subject !== null) {
            subjectValue = subject.label || subject.value;
        } else {
            subjectValue = subject;
        }

        // --- NEW LOGIC TO HANDLE SUBJECT CREATION ---
        let finalSubjectName;
        if (subjectValue) {
            // Trim whitespace and check against the database
            const trimmedSubject = subjectValue.trim();
            let existingSubject = await Subject.findOne({
                label: trimmedSubject
            });

            if (!existingSubject) {
                // If the subject doesn't exist, create a new one
                existingSubject = new Subject({
                    value: trimmedSubject.toLowerCase().replace(/\s/g, '-'), // create a slug
                    label: trimmedSubject,
                    category: 'User-Generated' // A default category for new subjects
                });
                await existingSubject.save();
                console.log(`New subject created: ${existingSubject.label}`);
            }
            finalSubjectName = existingSubject.label;
        }

        // --- FIX 2: Correctly parse the 'year' to a number once ---
        const parsedYear = parseInt(year);

        if (!title || !finalSubjectName || !parsedYear || !institution || !course) {
            return res.status(400).json({
                msg: 'Please enter all required fields (Title, Subject, Year, Institution, Course).'
            });
        }
        if (title.length < 3 || title.length > 100) {
            return res.status(400).json({
                msg: 'Title must be between 3 and 100 characters.'
            });
        }
        if (description && description.length > 500) {
            return res.status(400).json({
                msg: 'Description cannot exceed 500 characters.'
            });
        }
        // Use the parsedYear for your validation check
        const currentYear = new Date().getFullYear();
        if (parsedYear < 1900 || parsedYear > currentYear + 5) {
            return res.status(400).json({
                msg: `Invalid year. Must be between 1900 and ${currentYear + 5}.`
            });
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
            subject: finalSubjectName, // Use the extracted subject string
            course,
            year: parsedYear, // Use the parsed integer year
            description: description || '',
            tags: tags ? JSON.parse(tags) : [],
            institution,
            uploadedBy: req.user.id,
            cloudinaryUrl: result.secure_url,
            cloudinaryPublicId: result.public_id,
            fileType: req.file.mimetype.split('/')[0] === 'image' ? 'image' : (fileExtension.substring(1) || 'document'),
            visibility: 'public',
            fileHash: fileHash,
            textHash: isPdf ? textHash : undefined, // Save text hash only for PDFs
        });

        const resource = await newResource.save();

        // --- START: Coin System Logic for Upload ---
        const user = await User.findById(req.user.id);
        if (user) {
            user.scholaraCoins += 80; // Award 80 coins for upload
            await user.save();
        }
        // --- END: Coin System Logic for Upload ---

        if (req.io) {
            const stats = await (async () => {
                return {
                    resources: await Resource.countDocuments({
                        visibility: 'public'
                    }),
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
            return res.status(400).json({
                msg: 'Invalid file type.'
            });
        }
        if (err instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                msg: err.message
            });
        }
        res.status(500).json({
            msg: 'Server error during upload. ' + err.message
        });
    }
});

// Get comments for a resource
router.get('/:id/comments', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id).populate('comments.postedBy', 'username');
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.json(resource.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});
// Get ratings for a resource
router.get('/:id/ratings', async (req, res) => {
  try {
    const resourceId = req.params.id;
    const userId = req.query.userId;

    const resource = await Resource.findById(resourceId)
      .select('ratings averageRating')
      .populate('ratings.postedBy', 'username');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Calculate average rating
    const totalRatings = resource.ratings.length;
    const sumRatings = resource.ratings.reduce((sum, rating) => sum + rating.value, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Find user's rating if userId provided
    let userRating = 0;
    if (userId) {
      const userRatingObj = resource.ratings.find(
        r => r.postedBy._id.toString() === userId.toString()
      );
      userRating = userRatingObj ? userRatingObj.value : 0;
    }

    const response = {
      success: true,
      userRating,
      overallRating: parseFloat(averageRating.toFixed(1)),
      ratingsCount: totalRatings,
      ratings: resource.ratings.map(r => ({
        value: r.value,
        postedBy: {
          _id: r.postedBy._id,
          username: r.postedBy.username
        },
        createdAt: r.createdAt
      }))
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('Error getting ratings:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});
router.post('/:id/rate', protect, async (req, res) => {
  try {
    const resourceId = req.params.id;
    const { value } = req.body;
    const userId = req.user._id;

    // Validation
    if (!value || !Number.isInteger(value) || value < 1 || value > 5) {
      return res.status(400).json({ 
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Find the resource
    let resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check for existing rating by this user
    const existingRatingIndex = resource.ratings.findIndex(
      r => r.postedBy.toString() === userId.toString()
    );

    // Update or add rating
    if (existingRatingIndex !== -1) {
      resource.ratings[existingRatingIndex].value = value;
    } else {
      resource.ratings.push({ 
        postedBy: userId, 
        value 
      });
    }

    // Calculate new average rating
    const totalRatings = resource.ratings.length;
    const sumRatings = resource.ratings.reduce((sum, rating) => sum + rating.value, 0);
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Save the resource
    await resource.save();

    // Prepare response
    const response = {
      success: true,
      message: 'Rating saved successfully',
      userRating: value,
      overallRating: parseFloat(averageRating.toFixed(1)),
      ratingsCount: totalRatings,
      resource: {
        _id: resource._id,
        title: resource.title,
        averageRating: parseFloat(averageRating.toFixed(1)),
        ratingsCount: totalRatings
      }
    };

    res.status(200).json(response);

  } catch (err) {
    console.error('Error rating resource:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
});

router.post('/:id/comment', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: 'Comment text is required' });
        }
        
        let resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        
        // ** FIX: Filter out any invalid rating objects before saving **
        resource.ratings = resource.ratings.filter(rating => rating.value !== undefined && rating.value !== null);

        const newComment = {
            text,
            postedBy: req.user.id,
        };
        
        resource.comments.unshift(newComment);
        await resource.save();
        
        // After saving, find the resource again and populate the comments
        const updatedResource = await Resource.findById(req.params.id).populate({
            path: 'comments.postedBy',
            select: 'username',
        });

        const populatedComment = updatedResource.comments[0];

        res.json(populatedComment); 
    } catch (err) {
        console.error('Comment route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/:id/comments/:commentId/replies', protect, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: 'Reply text is required' });
        }

        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        // Find the specific comment by its _id within the resource's comments array
        const comment = resource.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ msg: 'Comment not found' });
        }

        const newReply = {
            text,
            postedBy: req.user.id, // User ID from the protect middleware
            createdAt: new Date(),
        };

        // Add the new reply to the comment's replies array
        // Ensure your commentSchema has a 'replies' array of objects with 'postedBy' and 'text'
        comment.replies.push(newReply);

        // Save the parent resource to persist the changes to the embedded comment and its replies
        await resource.save();

        // Fetch the user's username for the reply to send back in the response
        const user = await User.findById(req.user.id).select('username -_id');
        const populatedReply = {
            ...newReply,
            postedBy: {
                _id: req.user.id,
                username: user ? user.username : 'Anonymous' // Use fetched username
            }
        };

        res.status(201).json(populatedReply);
    } catch (err) {
        console.error('Reply to comment route error:', err.message);
        res.status(500).json({ msg: 'Server error when adding reply' });
    }
});




// Save a resource to user's library
const { ObjectId } = require('mongoose').Types;

router.put('/:id/save', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const resourceId = req.params.id;
        if (!ObjectId.isValid(resourceId)) {
            return res.status(400).json({ msg: 'Invalid resource ID' });
        }

        const resourceObjectId = new ObjectId(resourceId);
        if (user.savedResources.includes(resourceObjectId)) {
            return res.status(400).json({ msg: 'Resource already saved' });
        }

        user.savedResources.unshift(resourceObjectId);
        await user.save({ validateBeforeSave: true });

        res.status(200).json({ msg: 'Resource saved successfully', user });
    } catch (err) {
        console.error('Save route error:', err.message);
        if (err.name === 'CastError') {
            return res.status(400).json({ msg: 'Invalid resource ID' });
        }
        res.status(500).json({ msg: 'Server error' });
    }
});

// Unsave a resource from user's library
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

// Upvote a comment
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
        const updatedResource = await Resource.findById(req.params.id)
            .populate('comments.postedBy', 'username');
        res.json(updatedResource.comments);
    } catch (err) {
        console.error('Upvote route error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

// Flag a resource
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

// Increment download count
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
router.put('/:id', protect, authorize('admin', 'superadmin'), async (req, res) => {
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
            { new: true, runValidators: true }
        );

        res.json({ msg: 'Resource updated successfully', resource: updatedResource });
    } catch (err) {
        console.error('Update resource route error:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Resource not found' });
        }
        res.status(500).json({ msg: 'Server error during resource deletion.' });
    }
});

router.delete('/:id/delete-my-resource', protect, async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).json({ msg: 'Resource not found' });
        }

        if (resource.uploadedBy.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to delete this resource' });
        }

        console.log("Attempting to delete Cloudinary file:", {
            publicId: resource.cloudinaryPublicId,
            resourceType: getCloudinaryResourceType(resource.fileType)
        });

        try {
            const cloudinaryResult = await cloudinary.uploader.destroy(resource.cloudinaryPublicId, {
                resource_type: getCloudinaryResourceType(resource.fileType)
            });
            if (!cloudinaryResult || cloudinaryResult.result !== 'ok') {
                throw new Error(`Cloudinary deletion failed: ${cloudinaryResult?.error?.message || 'Unknown error'}`);
            }
            console.log("Cloudinary deletion successful:", cloudinaryResult);
        } catch (cloudinaryErr) {
            console.error(`Failed to delete Cloudinary file for resource ${resource._id}:`, cloudinaryErr);
            return res.status(500).json({
                msg: `Failed to delete file from Cloudinary: ${cloudinaryErr.message}`,
                details: cloudinaryErr
            });
        }

        await resource.deleteOne();
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