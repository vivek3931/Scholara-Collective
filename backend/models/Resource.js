// models/Resource.js
const mongoose = require('mongoose');

// Comment schema
const commentSchema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
    createdAt: { type: Date, default: Date.now }
});

// Rating schema
const ratingSchema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 1, max: 5 }
});

// Flag schema
const flagSchema = new mongoose.Schema({
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now }
});

// Main resource schema
const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    fileHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    textHash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    description: { type: String, trim: true },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    course: {
        type: String,
        required: true,
        enum: ['Notes', 'Question Paper', 'Book', 'Presentation','Mock Test' , 'Previous Year Paper' , 'Syllabus', 'Study Guide', 'Other']
    },
    year: { type: Number, required: true },
    institution: { type: String, required: true },
    tags: [{ type: String }],
    ratings: [ratingSchema],
    averageRating: { type: Number, default: 0 },
    comments: [commentSchema],
    flags: [flagSchema],
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    downloads: { type: Number, default: 0 },
    thumbnailUrl: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Text index for search
resourceSchema.index({
    title: 'text',
    description: 'text',
    subject: 'text',
    course: 'text',
    institution: 'text',
    tags: 'text'
}, {
    weights: {
        title: 10,
        tags: 8,
        subject: 5,
        course: 5,
        institution: 3,
        description: 1
    },
    name: 'resource_text_index'
});

// Additional index for filtering/sorting
resourceSchema.index({ uploadedBy: 1, createdAt: -1, visibility: 1 });

// Pre-save hook to update average rating
resourceSchema.pre('save', function (next) {
    if (this.ratings.length > 0) {
        this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.value, 0) / this.ratings.length;
    } else {
        this.averageRating = 0;
    }
    this.updatedAt = Date.now();
    next();
});

// Virtual property to calculate rating dynamically
resourceSchema.virtual('calculatedAverageRating').get(function () {
    return this.ratings.length > 0
        ? this.ratings.reduce((acc, curr) => acc + curr.value, 0) / this.ratings.length
        : 0;
});

module.exports = mongoose.model('Resource', resourceSchema);
