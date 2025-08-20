const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailSender');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { JWT_SECRET } = process.env;

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
            bio: bio || '',
            isVerified: false,
        });

        await user.save();

        res.status(201).json({
            message: 'Registration initiated. Please verify your email.',
        });
    } catch (err) {
        console.error('Registration Error:', err.message);
        res.status(500).send('Server Error during registration');
    }
};

exports.sendRegistrationOtp = async (req, res) => {
    const { email } = req.body;
    try {
        console.log('--- sendRegistrationOtp hit ---');
        console.log('Email received:', email);

        if (!email || !email.includes('@')) {
            return res.status(400).json({ message: 'Valid email address is required.' });
        }

        let user = await User.findOne({ email }).select('+otp +otpExpires');

        if (user && user.isVerified) {
            console.log('User already verified, rejecting request');
            return res.status(400).json({ message: 'Email already registered and verified.' });
        }

        if (!user || (user.username.startsWith('temp_user_') && !user.isVerified)) {
            console.log('Creating/updating temporary user');
            const tempPassword = crypto.randomBytes(16).toString('hex');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(tempPassword, salt);
            
            user = user || new User({
                email,
                username: `temp_user_${Date.now()}`,
                password: hashedPassword,
                isVerified: false,
            });

            user.password = hashedPassword;
            user.isVerified = false;
            user.otp = undefined;
            user.otpExpires = undefined;
            
            await user.save();
            console.log('Temporary user created/updated');
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 10 * 60 * 1000;

        console.log('Generated OTP:', otp);
        console.log('OTP expires at:', new Date(otpExpires));

        user.otp = otp;
        user.otpExpires = new Date(otpExpires);
        await user.save();

        console.log('OTP saved to user. User OTP:', user.otp, 'Expires:', user.otpExpires);

        const emailSubject = 'Your Scholara Collective Registration OTP';
        const emailHtml = `
            <div style="font-family: 'Inter', sans-serif; line-height: 1.6; color: #333; background-color: #f8f8f8; padding: 20px; border-radius: 8px; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                        <td style="padding-bottom: 20px; text-align: center;">
                            <h1 style="color: #F59E0B; font-size: 28px; margin: 0; padding: 0;">Scholara Collective</h1>
                            <p style="color: #666; font-size: 14px; margin-top: 5px;">Your Hub for Knowledge Exchange</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 20px; background-color: #ffffff; border-radius: 8px;">
                            <p style="font-size: 16px; margin-bottom: 15px;">Hello,</p>
                            <p style="font-size: 16px; margin-bottom: 20px;">
                                Thank you for registering with Scholara Collective. To complete your registration and verify your email address, please use the following One-Time Password (OTP):
                            </p>
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h2 style="background-color: #FFFBEB; color: #D97706; font-size: 36px; letter-spacing: 4px; padding: 15px 25px; border-radius: 8px; display: inline-block; border: 1px dashed #FCD34D;">
                                    ${otp}
                                </h2>
                            </div>
                            <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                                This OTP is valid for the next <strong>10 minutes</strong>. Please do not share this code with anyone.
                            </p>
                            <p style="font-size: 14px; color: #555;">
                                If you did not attempt to register with Scholara Collective, please disregard this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top: 25px; text-align: center; font-size: 12px; color: #888;">
                            <p>&copy; ${new Date().getFullYear()} Scholara Collective. All rights reserved.</p>
                            <p>
                                <a href="mailto:support@scholara.com" style="color: #F59E0B; text-decoration: none;">Support</a> |
                                <a href="https://yourwebsite.com/privacy" style="color: #F59E0B; text-decoration: none;">Privacy Policy</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </div>
        `;

        await sendEmail({
            email: user.email,
            subject: emailSubject,
            html: emailHtml,
            text: `Your OTP for Scholara Collective registration is: ${otp}. It is valid for 10 minutes.`,
        });

        console.log('OTP email sent successfully');

        res.status(200).json({ 
            message: 'OTP sent successfully to your email.',
            debug: {
                email: user.email,
                otpGenerated: true,
                otpExpires: user.otpExpires
            }
        });

    } catch (err) {
        console.error('Send OTP Error:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            message: 'Server Error during OTP sending',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
        });
    }
};

exports.verifyRegistrationOtp = async (req, res) => {
    console.log('--- verifyRegistrationOtp hit ---');
    console.log('Request Body:', req.body);

    const { username, email, password, otp, referralCode } = req.body;

    if (!username || !email || !password || !otp) {
        return res.status(400).json({ 
            success: false,
            message: 'All fields are required: username, email, password, and OTP.' 
        });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const user = await User.findOne({ email })
            .select('+otp +otpExpires +password')
            .session(session);

        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ 
                success: false,
                message: 'No registration request found for this email.' 
            });
        }

        console.log('Verification Context:', {
            dbOtp: user.otp,
            receivedOtp: otp,
            dbType: typeof user.otp,
            receivedType: typeof otp,
            currentTime: new Date(),
            expiresAt: user.otpExpires,
            timeDifference: user.otpExpires ? new Date(user.otpExpires).getTime() - new Date().getTime() : 'N/A'
        });

        const isAlreadyVerified = user.isVerified;
        if (isAlreadyVerified) {
            await session.abortTransaction();
            return res.status(409).json({
                success: false,
                message: 'Email already verified. Please login instead.',
                isAlreadyVerified: true
            });
        }

        const isOtpValidAndNotExpired = user.verifyOtp(otp);

        if (!isOtpValidAndNotExpired) {
            const isOtpExpired = user.otpExpires ? new Date(user.otpExpires) < new Date() : true;
            
            if (!user.otp || !user.otpExpires) {
                 await session.abortTransaction();
                 return res.status(400).json({
                     success: false,
                     message: 'No valid OTP found. Please request a new OTP.'
                 });
            } else if (isOtpExpired) {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: 'OTP has expired. Please request a new OTP.',
                    isOtpExpired: true
                });
            } else {
                await session.abortTransaction();
                return res.status(400).json({
                    success: false,
                    message: 'Invalid OTP. Please check and try again.',
                    debug: {
                        dbOtp: user.otp,
                        receivedOtp: otp,
                        comparison: String(user.otp).trim() === String(otp).trim()
                    }
                });
            }
        }

        const existingUsername = await User.findOne({
            username,
            _id: { $ne: user._id }
        }).session(session);

        if (existingUsername) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Username is already taken.'
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update user details and mark as verified
        user.username = username;
        user.password = hashedPassword;
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.stats.lastLogin = new Date();

        await user.save({ session });
        
        // Referral logic: Award coins to the referrer if a referral code exists
        if (referralCode) {
            const referrer = await User.findById(referralCode).session(session);
            if (referrer) {
                referrer.scholaraCoins += 50;
                referrer.referralCount += 1;
                await referrer.save({ session });
                console.log(`User ${referrer.username} (ID: ${referrer._id}) received 50 coins for a referral.`);
            }
        }

        const token = await signToken({
            user: {
                id: user.id,
                roles: [user.role],
            },
        });

        await session.commitTransaction();

        return res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                email: user.email,
                roles: [user.role],
                isVerified: user.isVerified,
            },
            message: 'Registration successful!',
        });

    } catch (transactionErr) {
        await session.abortTransaction();
        console.error('Verify OTP Transaction Error:', {
            message: transactionErr.message,
            stack: transactionErr.stack,
            time: new Date()
        });
        return res.status(500).json({
            success: false,
            message: 'Server error during verification',
            error: process.env.NODE_ENV === 'development' ? {
                message: transactionErr.message,
                stack: transactionErr.stack
            } : undefined
        });
    } finally {
        session.endSession();
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email address before logging in.' });
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
                bio: user.bio,
                isVerified: user.isVerified,
                scholaraCoins: user.scholaraCoins,
                referralCount: user.referralCount,
            },
            message: 'Login successful!',
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).send('Server Error during login');
    }
};

exports.verifyToken = (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token found! The spaceship is adrift in deep space without a pilot.',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({
        success: false,
        message: 'Token verification failed. Your access key has expired! Looks like your warp drive needs a reboot.',
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Token verified! You are cleared for launch. Welcome aboard, Commander.',
      user: {
        id: user.id,
        roles: user.roles,
      },
    });
  });
};

exports.updateProfile = async (req, res) => {
    try {
        const { username, email, notifications, bio } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { username, email, notifications, bio },
            { new: true, runValidators: true }
        ).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Update Profile Error:', error.message);
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
            notifications: user.notifications,
            bio: user.bio,
            scholaraCoins: user.scholaraCoins,
            referralCount: user.referralCount,
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
            bio: '',
            isVerified: true,
        });

        await newAdmin.save();
        res.status(201).json({ message: 'Initial admin account created successfully.' });
    } catch (error) {
        console.error('Error in /setup-admin:', error);
        res.status(500).json({ message: 'Server error during admin setup.' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change Password Error:', error.message);
        res.status(500).json({ message: 'Server error during password change' });
    }
};