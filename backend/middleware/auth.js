const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Assuming you have a JWT secret in your environment variables
const jwtSecret = process.env.JWT_SECRET;

module.exports = function(req, res, next) {
    // Get token from header
    // CHANGE THIS LINE: Expect token in 'Authorization: Bearer <token>'
    const authHeader = req.header('Authorization');

    // Check if not token or not starting with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Extract the token string after 'Bearer '
    const token = authHeader.split(' ')[1];

    try {
        // Verify token
        const decoded = jwt.verify(token, jwtSecret);

        // Attach user from token payload to request object
        req.user = decoded.user;
        next();
    } catch (err) {
        // Log the specific error for debugging on the backend
        console.error('Token verification failed:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};