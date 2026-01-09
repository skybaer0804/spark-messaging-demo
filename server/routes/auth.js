const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, getAllUsers, updateNotificationSettings } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', auth, logout);
router.get('/me', auth, getMe);
router.get('/users', auth, getAllUsers);
router.post('/notification-settings', auth, updateNotificationSettings);

module.exports = router;

