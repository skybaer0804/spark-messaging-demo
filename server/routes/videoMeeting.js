const express = require('express');
const router = express.Router();
const { getMeetings, createMeeting, startMeeting } = require('../controllers/videoMeetingController');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.post('/:meetingId/start', startMeeting);

module.exports = router;
