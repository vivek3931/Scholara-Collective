const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        match: [/.+@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: function() {
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    role: {
        type: String,
        enum: ['student', 'admin', 'superadmin', 'guest'],
        default: 'student'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // CHANGED: from isEmailVerified to isVerified
    isVerified: {
        type: Boolean,
        default: false
    },
    // MOVED: bio from profile to root level
    bio: {
        type: String,
        maxlength: 500,
        default: ''
    },
    uploadedResources: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        }
    ],
    savedResources: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource'
        }
    ],
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
        }
        // REMOVED: bio (moved to root level)
    },
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
    adminNotes: {
        type: String,
        default: '',
        select: false
    },
    // KEEP: OTP fields (these are correct)
    otp: {
    type: String,
    select: false,
    trim: true,  // Add trim to ensure no whitespace
    validate: {
        validator: function(v) {
            return /^\d{6}$/.test(v); // Ensure 6-digit OTP
        },
        message: props => `${props.value} is not a valid 6-digit OTP!`
    }
},
   otpExpires: {
    type: Date,
    select: false,
    index: { expires: '10m' } // Auto-expire after 10 minutes
},
    // OPTIONAL: Keep these if you use password reset functionality
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetExpiry: {
        type: Date,
        select: false
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

// Add indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ otpExpires: 1 });

// Pre-save middleware
userSchema.pre('save', async function(next) {
    this.updatedAt = new Date();
    
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

userSchema.methods.verifyOtp = function(enteredOtp) {
    // Debug logs
    console.log('OTP Verification:', {
        storedOtp: this.otp,
        enteredOtp: enteredOtp,
        typeMatch: typeof this.otp === typeof enteredOtp,
        timeRemaining: this.timeUntilOtpExpiry / 1000 + ' seconds'
    });

    // Convert both to string and trim whitespace
    const cleanStored = String(this.otp).trim();
    const cleanEntered = String(enteredOtp).trim();
    
    return cleanStored === cleanEntered && this.otpExpires > new Date();
};

// Update pre-save hook to handle OTP changes
userSchema.pre('save', async function(next) {
    this.updatedAt = new Date();
    
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Auto-set OTP expiration if OTP is being set
    if (this.isModified('otp') && this.otp) {
        this.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    }
    
    next();
});

// Password comparison method
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Admin functionality methods
userSchema.methods.isAdmin = function() {
    return this.role === 'admin' || this.role === 'superadmin';
};

userSchema.methods.isSuperAdmin = function() {
    return this.role === 'superadmin';
};

userSchema.methods.canManageUser = function(targetUser) {
    if (this.role === 'superadmin') {
        return targetUser.role !== 'superadmin' || this._id.equals(targetUser._id);
    }
    if (this.role === 'admin') {
        return ['student', 'guest'].includes(targetUser.role);
    }
    return false;
};

// User statistics method
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

// Static method to get admin users
userSchema.statics.getAdmins = function() {
    return this.find({ role: { $in: ['admin', 'superadmin'] } });
};

// Static method to get active users
userSchema.statics.getActiveUsers = function() {
    return this.find({ isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;