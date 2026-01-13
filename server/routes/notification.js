const express = require('express');
const router = express.Router();
const {
  createNotification,
  getNotifications,
  syncNotifications,
  deleteNotification,
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/', createNotification);
router.get('/', getNotifications);
router.get('/sync', syncNotifications);
router.delete('/:notificationId', deleteNotification);

module.exports = router;
