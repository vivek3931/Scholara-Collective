// server/models/User.js
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
    
    // ENHANCED: Updated role field to support admin roles
    role: {
        type: String,
        enum: ['student', 'admin', 'superadmin', 'guest'], // Added admin roles
        default: 'student'
    },
    
    // ENHANCED: Added admin-specific fields
    isActive: {
        type: Boolean,
        default: true // For admin to activate/deactivate users
    },
    
    // Your existing fields
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
    
    // ENHANCED: Additional user profile fields (optional)
    profile: {
        institution: {
            type: String,
            trim: true,
            default: ''
        },
        course: {
            type: String,
            trim: true,
            default: ''
        },
        yearOfStudy: {
            type: Number,
            min: 1,
            max: 10
        },
        bio: {
            type: String,
            maxlength: 500,
            default: ''
        }
    },
    
    // ENHANCED: Activity tracking for admin dashboard
    stats: {
        uploadCount: {
            type: Number,
            default: 0
        },
        downloadCount: {
            type: Number,
            default: 0
        },
        lastLogin: {
            type: Date,
            default: Date.now
        }
    },
    
    // ENHANCED: Admin notes (for admin use)
    adminNotes: {
        type: String,
        default: '',
        select: false // Don't include in regular queries
    },
    
    // ENHANCED: Account verification fields
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        select: false
    },
    emailVerificationExpiry: {
        type: Date,
        select: false
    },
    
    // ENHANCED: Password reset fields
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpiry: {
        type: Date,
        select: false
    },
    
    // Your existing timestamp field
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    // ENHANCED: Add updatedAt for better tracking
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ENHANCED: Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });

// Your existing pre-save middleware (enhanced)
userSchema.pre('save', async function(next) {
    // Update the updatedAt field
    this.updatedAt = new Date();
    
    // Your existing password hashing logic
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

// Your existing password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// ENHANCED: Additional methods for admin functionality
userSchema.methods.isAdmin = function() {
    return this.role === 'admin' || this.role === 'superadmin';
};

userSchema.methods.isSuperAdmin = function() {
    return this.role === 'superadmin';
};

userSchema.methods.canManageUser = function(targetUser) {
    // Super admin can manage anyone except other super admins
    if (this.role === 'superadmin') {
        return targetUser.role !== 'superadmin' || this._id.equals(targetUser._id);
    }
    
    // Regular admin can manage students and guests
    if (this.role === 'admin') {
        return ['student', 'guest'].includes(targetUser.role);
    }
    
    return false;
};

// ENHANCED: Method to get user statistics
userSchema.methods.getStats = async function() {
    const Resource = mongoose.model('Resource');
    
    const uploadedResources = await Resource.countDocuments({ uploadedBy: this._id });
    const totalDownloads = await Resource.aggregate([
        { $match: { uploadedBy: this._id } },
        { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);
    
    return {
        uploadedResources,
        totalDownloads: totalDownloads[0]?.total || 0,
        savedResources: this.savedResources.length,
        joinDate: this.createdAt,
        lastLogin: this.stats.lastLogin
    };
};

// ENHANCED: Static method to get admin users
userSchema.statics.getAdmins = function() {
    return this.find({ role: { $in: ['admin', 'superadmin'] } });
};

// ENHANCED: Static method to get active users
userSchema.statics.getActiveUsers = function() {
    return this.find({ isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
