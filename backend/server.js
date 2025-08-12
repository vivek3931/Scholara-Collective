// server.js
require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import CORS
const http = require('http'); // For WebSocket setup
const { Server } = require('socket.io'); // For WebSocket setup
const path = require('path');

const authRoutes = require('./routes/authRoutes'); // Your auth routes
const resourceRoutes = require('./routes/resourceRoutes'); // Example: Your resource routes
const analyticsRoutes = require('./routes/analyticsRoutes'); // Example: Your analytics routes
const adminRoutes = require('./routes/adminRoutes'); // Example: Your admin routes

const { errorHandler } = require('./middleware/errorMiddleware'); // Custom error handler

const app = express();

// --- CORS Configuration ---
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000', // Primary frontend URL
        'http://localhost:5173', // Your Vite dev server
        'https://scholara-collective.onrender.com' // Production URL
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Added PATCH for consistency
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'client', 'build')));

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
    });
}

// --- Security Headers ---
app.use((req, res, next) => {
    res.header('Cross-Origin-Embedder-Policy', 'require-corp');
    res.header('Cross-Origin-Opener-Policy', 'same-origin');
    next();
});

// --- Middleware ---
app.use(express.json()); // Body parser for JSON

// --- Connect to MongoDB ---
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error('MongoDB Connection Error:', err.message);
        process.exit(1); // Exit process with failure
    }
};
connectDB();

// --- Define Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// --- WebSocket Setup ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost:5173',
            'https://scholara-collective.onrender.com'
        ],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);
    socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Make io available to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Error Handling Middleware ---
// This should be the last middleware added, after all routes
app.use(errorHandler);

// --- Start Server ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
