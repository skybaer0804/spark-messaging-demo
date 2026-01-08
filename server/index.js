require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const socketService = require('./services/socketService');
const configureWebPush = require('./config/push');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Databases
connectDB();
connectRedis();

// Initialize Services
socketService.initialize();
configureWebPush();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads (Absolute path for local storage)
app.use('/uploads', express.static('C:/project/file'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/push', require('./routes/push'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err);
  res.status(500).json({
    message: 'Global server error',
    error: err.message,
    stack: err.stack,
  });
});

// Basic Route
app.get('/', (req, res) => {
  res.send('Spark Messaging API is running...');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
