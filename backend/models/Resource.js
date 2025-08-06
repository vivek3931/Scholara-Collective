
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    cloudinaryUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    fileType: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, required: true },
    course: {
        type: String,
        required: true,
        enum: ['Notes', 'Question Paper', 'Book', 'Presentation', 'Syllabus', 'Other']
    },
    year: { type: Number, required: true },
    institution: { type: String, required: true },
    tags: [String],
    ratings: [
        {
            postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            value: { type: Number, min: 1, max: 5 }
        }
    ],
    averageRating: { type: Number, default: 0 },
    comments: [
        {
            postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            text: String,
            upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }], // Upvotes are on the comment, not the resource
            createdAt: { type: Date, default: Date.now }
        }
    ],
    flags: [
        {
            postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            reason: String,
            createdAt: { type: Date, default: Date.now }
        }
    ],
    visibility: { type: String, enum: ['public', 'private'], default: 'public' },
    downloads: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Create a weighted text index for smarter search functionality
// You must drop your old index and restart your app to build this new one
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

// A standard index for filtering by user and sorting by date
resourceSchema.index({ uploadedBy: 1, createdAt: -1, visibility: 1 });

resourceSchema.pre('save', function(next) {
    if (this.ratings.length > 0) {
        this.averageRating = this.ratings.reduce((acc, curr) => acc + curr.value, 0) / this.ratings.length;
    } else {
        this.averageRating = 0;
    }
    this.updatedAt = Date.now();
    next();
});

// Virtual property to calculate rating on the fly (for readability/non-persisted checks)
resourceSchema.virtual('calculatedAverageRating').get(function() {
    return this.ratings.length > 0 ? this.ratings.reduce((acc, curr) => acc + curr.value, 0) / this.ratings.length : 0;
});

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;