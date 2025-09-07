const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;
const adminSockets = new Map(); // Store admin socket connections

const initializeSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.user.id).select('username email role isActive');
            
            if (!user || !user.isActive) {
                return next(new Error('User not found or inactive'));
            }

            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.user.role})`);

        // Store admin connections
        if (socket.user.role === 'admin' || socket.user.role === 'superadmin') {
            adminSockets.set(socket.user._id.toString(), socket);
            
            // Join admin room
            socket.join('admin-room');
            
            console.log(`Admin ${socket.user.username} joined admin room`);
        }

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.user.username}`);
            if (socket.user.role === 'admin' || socket.user.role === 'superadmin') {
                adminSockets.delete(socket.user._id.toString());
            }
        });

        // Handle admin notification acknowledgment
        socket.on('mark-notification-read', (notificationId) => {
            // You can implement notification read status here
            console.log(`Notification ${notificationId} marked as read by ${socket.user.username}`);
        });
    });

    return io;
};

// Notification functions
const notifyAdmins = (type, data) => {
    if (!io) return;
    
    const notification = {
        id: Date.now() + Math.random(),
        type,
        data,
        timestamp: new Date(),
        read: false
    };

    // Send to all admins in the admin room
    io.to('admin-room').emit('admin-notification', notification);
    
    console.log(`Admin notification sent: ${type}`, data);
};

const notifyNewUser = (userData) => {
    notifyAdmins('new-user', {
        title: 'New User Registration',
        message: `${userData.username} has joined the platform`,
        user: {
            id: userData._id,
            username: userData.username,
            email: userData.email,
            createdAt: userData.createdAt
        }
    });
};

const notifyResourceFlagged = (resourceData, flagData, userWhoFlagged) => {
    notifyAdmins('resource-flagged', {
        title: 'Resource Flagged',
        message: `Resource "${resourceData.title}" has been flagged for: ${flagData.reason}`,
        resource: {
            id: resourceData._id,
            title: resourceData.title,
            uploadedBy: resourceData.uploadedBy,
            flagReason: flagData.reason,
            flagComment: flagData.comment
        },
        flaggedBy: {
            id: userWhoFlagged._id,
            username: userWhoFlagged.username
        }
    });
};

const notifyNewResource = (resourceData, uploaderData) => {
    notifyAdmins('new-resource', {
        title: 'New Resource Uploaded',
        message: `${uploaderData.username} uploaded "${resourceData.title}"`,
        resource: {
            id: resourceData._id,
            title: resourceData.title,
            subject: resourceData.subject,
            fileType: resourceData.fileType
        },
        uploader: {
            id: uploaderData._id,
            username: uploaderData.username
        }
    });
};

const notifyHighDownloadActivity = (resourceData) => {
    notifyAdmins('high-activity', {
        title: 'High Download Activity',
        message: `Resource "${resourceData.title}" has reached ${resourceData.downloads} downloads`,
        resource: {
            id: resourceData._id,
            title: resourceData.title,
            downloads: resourceData.downloads
        }
    });
};

const notifySystemAlert = (alertType, message, details = {}) => {
    notifyAdmins('system-alert', {
        title: 'System Alert',
        message,
        alertType,
        details
    });
};

module.exports = {
    initializeSocket,
    notifyNewUser,
    notifyResourceFlagged,
    notifyNewResource,
    notifyHighDownloadActivity,
    notifySystemAlert,
    getConnectedAdmins: () => adminSockets.size,
    io: () => io
};