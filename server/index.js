require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const socketService = require('./services/socketService');
const configureWebPush = require('./config/push');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Initialize Services
socketService.initialize();
configureWebPush();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/push', require('./routes/push'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Spark Messaging API is running...');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

