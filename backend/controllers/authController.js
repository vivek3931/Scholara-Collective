// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTANT: Ensure you have process.env.JWT_SECRET defined in your .env file
// Example: JWT_SECRET=your_super_secret_jwt_key_here

// --- Helper Function to Promisify jwt.sign ---
// This allows us to use async/await with jwt.sign
const signToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // Use your secret from .env
            { expiresIn: '1h' }, // Token expiration time (e.g., 1 hour)
            (err, token) => {
                if (err) {
                    console.error('Error signing JWT:', err); // Log the JWT error
                    reject(err);
                }
                resolve(token);
            }
        );
    });
};

// --- Controller Functions ---

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password,
            role: role || 'student'
        });

        await user.save();

        // After successful registration, immediately generate a token and send it with the user object.
        const payload = {
            user: {
                id: user.id,
                roles: [user.role] // FIX: Ensure roles is an array in the JWT payload
            },
        };

        const token = await signToken(payload);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: [user.role] // FIX: Change 'role' to 'roles' and make it an array in the response
            },
            message: 'Registration successful!'
        });

    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server Error during registration');
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                roles: [user.role] // FIX: Ensure roles is an array in the JWT payload
            },
        };

        const token = await signToken(payload);

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: [user.role] // FIX: Change 'role' to 'roles' and make it an array in the response
            },
            message: 'Login successful!'
        });

    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error during login');
    }
};

// @desc    Get user data by token (profile)
// @route   GET /api/auth/me
// @access  Private (requires auth middleware)
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // FIX: Explicitly construct the response to include 'roles' as an array
        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: [user.role]
        });
    } catch (err) {
        console.error('Get user data error:', err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Logout user (client-side token invalidation, server-side cleanup if needed)
// @route   POST /api/auth/logout
// @access  Public (to allow client to explicitly log out)
exports.logout = async (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};

// @desc    Setup initial admin user (one-time route)
// @route   POST /api/auth/setup-admin
// @access  Public (protected by secret key)
exports.setupAdmin = async (req, res) => {
    const { email, password, secretKey, username } = req.body;
    const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY;

    try {
        console.log('--- Admin Setup Attempt ---');
        console.log(`Backend ADMIN_SETUP_KEY: ${ADMIN_SETUP_KEY}`);
        console.log(`Frontend secretKey received: ${secretKey}`);
        console.log(`Keys match? ${secretKey === ADMIN_SETUP_KEY}`);
        console.log('---------------------------');

        if (secretKey !== ADMIN_SETUP_KEY || !ADMIN_SETUP_KEY) {
            return res.status(403).json({ message: 'Invalid or missing secret key.' });
        }

        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            return res.status(403).json({ message: 'An admin account has already been created. This route is now locked.' });
        }

        if (!email || !password || !username) {
            return res.status(400).json({ message: 'Username, email and password are required.' });
        }

        const newAdmin = new User({
            username,
            email,
            password,
            role: 'admin'
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Initial admin account created successfully.' });

    } catch (error) {
        console.error('Error in /setup-admin:', error);
        res.status(500).json({ message: 'Server error during admin setup.' });
    }
};
