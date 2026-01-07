const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/pushController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/subscribe', subscribe);
router.post('/unsubscribe', unsubscribe);

module.exports = router;

