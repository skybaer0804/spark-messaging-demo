const express = require('express');
const router = express.Router();
const { 
  createRoom, 
  getRooms, 
  sendMessage, 
  getMessages, 
  uploadFile, 
  setActiveRoom,
  syncMessages,
  markAsRead 
} = require('../controllers/chatController');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(auth); // 모든 채팅 라우트는 인증 필요

router.post('/rooms', createRoom);
router.get('/rooms', getRooms);
router.post('/messages', sendMessage);
router.get('/messages/:roomId', getMessages);
router.get('/sync/:roomId', syncMessages);
router.post('/read/:roomId', markAsRead);
router.post('/active-room', setActiveRoom);

// 파일 업로드 라우트 추가
router.post('/upload', upload.single('file'), uploadFile);

module.exports = router;

