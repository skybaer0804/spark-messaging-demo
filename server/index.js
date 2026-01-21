require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const socketService = require('./services/socketService');
const configureWebPush = require('./config/push');
const schedulerService = require('./services/schedulerService');

const { initializeSystem } = require('./utils/initialize');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Databases
connectDB().then(() => {
  // DB 연결 후 시스템 초기화 실행
  initializeSystem();
});
connectRedis();

// Initialize Services
socketService.initialize();
configureWebPush();
schedulerService.initialize();

// Initialize File Processing Worker (비동기 파일 처리)
try {
  require('./workers/fileProcessingWorker');
  console.log('✅ 파일 처리 워커 초기화 완료');
} catch (error) {
  console.error('❌ 파일 처리 워커 초기화 실패:', error.message);
  console.warn('⚠️  파일 처리 워커 없이 계속 진행합니다. (Bull Queue 미설치 시 정상)');
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '600mb' }));
// multipart/form-data는 multer가 처리하므로, urlencoded는 일반 폼 데이터용
app.use(express.urlencoded({ extended: true, limit: '600mb' })); // 대용량 파일 지원

// Static files for uploads (Local storage)
// 한글 파일명 지원을 위한 커스텀 미들웨어
const fileServeUrl = process.env.FILE_SERVE_URL || 'http://localhost:5000/files';
const fileBasePath = process.env.FILE_UPLOAD_PATH || 'C:/project/file';
const expressStatic = express.static(fileBasePath, {
  setHeaders: (res, filePath) => {
    // 한글 파일명을 위한 Content-Disposition 헤더 설정
    const fileName = path.basename(filePath);
    // UTF-8 인코딩된 파일명 (RFC 5987 형식)
    const encodedFileName = encodeURIComponent(fileName);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`);
  }
});
app.use('/files', expressStatic);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/push', require('./routes/push'));
app.use('/api/workspace', require('./routes/workspace'));
app.use('/api/notification', require('./routes/notification'));
app.use('/api/video-meeting', require('./routes/videoMeeting'));
app.use('/api/team', require('./routes/team'));

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
