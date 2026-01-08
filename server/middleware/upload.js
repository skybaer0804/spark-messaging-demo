const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const fs = require('fs');

const UPLOAD_BASE_PATH = 'C:/project/file';
const ORIGINAL_PATH = path.join(UPLOAD_BASE_PATH, 'original');

// 디렉토리가 없으면 생성
if (!fs.existsSync(ORIGINAL_PATH)) {
  fs.mkdirSync(ORIGINAL_PATH, { recursive: true });
}

// 저장 위치 및 파일명 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ORIGINAL_PATH);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터링 (이미지, 영상, 오디오 등)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 최대 50MB 제한
  }
});

module.exports = upload;

