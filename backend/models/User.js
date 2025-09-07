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
    isVerified: {
        type: Boolean,
        default: false
    },
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
    // --- START: New fields for Scholar Coins and Referral System ---
    scholaraCoins: {
        type: Number,
        default: 50, // Initial coins for new users
        required: true
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true // Allows for null values on non-referred users
    },
        referralCount: { type: Number, default: 0 },

    // --- END: New fields for Scholar Coins and Referral System ---
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
    otp: {
        type: String,
        select: false,
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v);
            },
            message: props => `${props.value} is not a valid 6-digit OTP!`
        }
    },
    otpExpires: {
        type: Date,
        select: false,
        index: { expires: '10m' }
    },
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

// Consolidated Pre-save middleware to prevent double hashing and set OTP expiry
userSchema.pre('save', async function(next) {
    this.updatedAt = new Date();
    
    // Hash password only if it's being modified
    if (this.isModified('password') && this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    
    // Set OTP expiration only if the OTP field is being modified
    if (this.isModified('otp') && this.otp) {
        this.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    }
    
    next();
});

userSchema.methods.verifyOtp = function(enteredOtp) {
    console.log('OTP Verification:', {
        storedOtp: this.otp,
        enteredOtp: enteredOtp,
        typeMatch: typeof this.otp === typeof enteredOtp,
        timeRemaining: this.otpExpires ? (this.otpExpires.getTime() - new Date().getTime()) / 1000 + ' seconds' : 'N/A'
    });

    const cleanStored = String(this.otp).trim();
    const cleanEntered = String(enteredOtp).trim();
    
    return cleanStored === cleanEntered && this.otpExpires > new Date();
};

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

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

userSchema.statics.getAdmins = function() {
    return this.find({ role: { $in: ['admin', 'superadmin'] } });
};

userSchema.statics.getActiveUsers = function() {
    return this.find({ isActive: true });
};

const User = mongoose.model('User', userSchema);

module.exports = User;