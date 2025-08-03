    const mongoose = require('mongoose');

    const resourceSchema = new mongoose.Schema({
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true
        },
        cloudinaryUrl: { // This will store the URL to the file on Cloudinary
            type: String,
            required: true
        },
        cloudinaryPublicId: { // This will store the public ID from Cloudinary for deletion/management
            type: String,
            required: true
        },
        fileType: { // e.g., 'pdf', 'image', 'document'
            type: String,
            required: true
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Reference to the User model
            required: true
        },
        subject: {
            type: String,
            required: true
        },
        course: {
    type: String,
    required: true,
    enum: ['Notes', 'Question Paper', 'Book', 'Presentation', 'Syllabus', 'Other']
},
        year: {
            type: Number, // e.g., 2023, 2024
            required: true
        },
        institution: {
            type: String,
            required: true
        },
        tags: [String], // Array of strings for tags
        ratings: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                value: { type: Number, min: 1, max: 5 }
            }
        ],
        averageRating: {
            type: Number,
            default: 0
        },
        comments: [
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                text: String,
                createdAt: { type: Date, default: Date.now }
            }
        ],
        upvotes: { // Could be an array of user IDs or just a count
            type: Number,
            default: 0
        },
        flags: [ // For flagging low-quality content
            {
                user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                reason: String,
                createdAt: { type: Date, default: Date.now }
            }
        ],
        visibility: {
            type: String,
            enum: ['public', 'private'], // Could add 'unlisted' if needed
            default: 'public'
        },
        downloads: {
            type: Number,
            default: 0
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    resourceSchema.index({ title: 'text', description: 'text', subject: 'text', course: 'text', institution: 'text', tags: 'text' });
    resourceSchema.index({ uploadedBy: 1, createdAt: -1 }); // Index for user-specific queries

    // Middleware to update averageRating before saving (optional, can be done on read)
    resourceSchema.pre('save', function(next) {
        if (this.ratings.length > 0) {
            this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.value, 0) / this.ratings.length;
        } else {
            this.averageRating = 0;
        }
        this.updatedAt = Date.now();
        next();
    });

    const Resource = mongoose.model('Resource', resourceSchema);

    module.exports = Resource;