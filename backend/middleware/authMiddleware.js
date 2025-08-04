// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const protect = async (req, res, next) => {
    let token; // Change 'const token' to 'let token' if you use it in the if check for !token
    console.log("AUTH MIDDLEWARE: Starting protect middleware."); // ADD THIS
    console.log("AUTH MIDDLEWARE: Authorization Header:", req.header('Authorization')); // ADD THIS

    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("AUTH MIDDLEWARE: No token or invalid format."); // ADD THIS
        return res.status(401).json({ message: 'No token or invalid format, authorization denied' });
    }

    const tokenString = authHeader.split(' ')[1];
    console.log("AUTH MIDDLEWARE: Extracted Token String:", tokenString); // ADD THIS

    try {
        const decoded = jwt.verify(tokenString, process.env.JWT_SECRET);
        console.log("AUTH MIDDLEWARE: Decoded JWT Payload:", decoded); // ADD THIS - CRITICAL LINE

        // Ensure you are using the correct path to ID from your JWT payload
        // Based on authController.js, it should be decoded.user.id
        const userIdFromToken = decoded.user.id;
        console.log("AUTH MIDDLEWARE: User ID from Decoded Token:", userIdFromToken); // ADD THIS

        const user = await User.findById(userIdFromToken).select('-password');

        if (!user) {
            console.log("AUTH MIDDLEWARE: User not found for ID:", userIdFromToken); // ADD THIS
            return res.status(401).json({ message: 'User not found' });
        }

        if (!user.isActive) {
            console.log("AUTH MIDDLEWARE: Account deactivated for user:", user.username); // ADD THIS
            return res.status(401).json({ message: 'Account has been deactivated' });
        }

        // Set the full user object on req.user
        req.user = user;
        console.log("AUTH MIDDLEWARE: Authentication successful for user:", req.user.username, " (ID:", req.user.id, ")"); // ADD THIS
        next();
    } catch (err) {
        console.error('AUTH MIDDLEWARE ERROR: Token verification failed:', err.message); // ADD THIS
        res.status(401).json({ message: 'Token is not valid' });
    }
};
// Middleware to check user roles (works with single role field)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied: User role not found' });
        }
        
        // Check if the user's role is in the allowed roles
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}` 
            });
        }
        
        next();
    };
};

// Legacy exports for backward compatibility
exports.protect = protect;
exports.authorize = authorize;

// Also export as module.exports for consistency
module.exports = {
    protect,
    authorize
};