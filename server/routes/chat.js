const express = require('express');
const router = express.Router();
const { createRoom, getRooms, sendMessage, getMessages } = require('../controllers/chatController');
const auth = require('../middleware/auth');

router.use(auth); // 모든 채팅 라우트는 인증 필요

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.post('/messages', sendMessage);
router.get('/messages/:roomId', getMessages);

module.exports = router;

