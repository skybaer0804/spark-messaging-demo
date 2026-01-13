const express = require('express');
const router = express.Router();
const {
  getMeetings,
  createMeeting,
  startMeeting,
  getMeetingByHash,
  verifyMeetingPassword,
} = require('../controllers/videoMeetingController');
const auth = require('../middleware/auth');

// Public routes (Guests)
router.get('/join/:hash', getMeetingByHash);
router.post('/join/:hash/verify', verifyMeetingPassword);

// Private routes (Authenticated)
router.use(auth);

router.get('/', getMeetings);
router.post('/', createMeeting);
router.post('/:meetingId/start', startMeeting);
router.delete('/:meetingId', auth, require('../controllers/videoMeetingController').deleteMeeting);

module.exports = router;
