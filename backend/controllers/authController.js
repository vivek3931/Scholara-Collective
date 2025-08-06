// server/controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// IMPORTANT: Ensure you have process.env.JWT_SECRET defined in your .env file
// Example: JWT_SECRET=your_super_secret_jwt_key_here

const signToken = (payload) => {
    return new Promise((resolve, reject) => {
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) {
                    console.error('Error signing JWT:', err);
                    reject(err);
                }
                resolve(token);
            }
        );
    });
};

exports.register = async (req, res) => {
    const { username, email, password, role, bio } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            username,
            email,
            password,
            role: role || 'student',
            bio: bio || '', // Default to empty string if not provided
        });

        await user.save();

        const payload = {
            user: {
                id: user.id,
                roles: [user.role],
            },
        };

        const token = await signToken(payload);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: [user.role],
                bio: user.bio, // Include bio in the response
            },
            message: 'Registration successful!',
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server Error during registration');
    }
};

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
                roles: [user.role],
            },
        };

        const token = await signToken(payload);

        res.json({
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: [user.role],
                bio: user.bio, // Include bio in the response
            },
            message: 'Login successful!',
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error during login');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username, bio },
            { new: true, runValidators: true }
        ).select('-password');
        res.status(200).json({ user });
    } catch (error) {
        res.status(400).json({ message: 'Failed to update profile' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            _id: user._id,
            username: user.username,
            email: user.email,
            roles: [user.role],
            bio: user.bio, // Include bio in the response
        });
    } catch (err) {
        console.error('Get user data error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.logout = async (req, res) => {
    res.status(200).json({ message: 'Logout successful' });
};

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
            role: 'admin',
            bio: '', // Default bio for admin
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Initial admin account created successfully.' });
    } catch (error) {
        console.error('Error in /setup-admin:', error);
        res.status(500).json({ message: 'Server error during admin setup.' });
    }
};