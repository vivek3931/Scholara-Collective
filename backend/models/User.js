const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/.+@.+\..+/, 'Please fill a valid email address'] // Basic email validation
    },
    password: {
        type: String,
        required: function() {
            // Password is not required if using Google OAuth
            return !this.googleId;
        }
    },
    googleId: { // For Google OAuth
        type: String,
        unique: true,
        sparse: true // Allows null values to not violate unique constraint
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'guest'], // As per project features 
        default: 'student'
    },
    uploadedResources: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        }
    ],
    savedResources: [ // For the personal library feature 
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        }
    ],
    // Could add more fields like profile picture, join date etc.
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving the user (for local signup)
userSchema.pre('save', async function(next) {
    if (this.isModified('password') && this.password) { // Only hash if password is modified and exists
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;