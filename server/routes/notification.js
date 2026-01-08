const express = require('express');
const router = express.Router();
const { createNotification, getNotifications } = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createNotification);
router.get('/', getNotifications);

module.exports = router;
