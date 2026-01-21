const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const storageConfig = require('../config/storageConfig');
const { isFileTypeAllowed, getMaxFileSize, validateFile } = require('../config/fileConfig');

/**
 * 저장소 타입에 따라 Multer 저장소 설정 반환
 * - 로컬: diskStorage (파일 저장)
 * - S3: memoryStorage (버퍼 유지)
 */
const getStorage = () => {
  if (storageConfig.type === 's3') {
    // S3: 메모리 저장 (S3 SDK에서 버퍼 처리)
    console.log('📝 Multer: Using memoryStorage for S3');
    return multer.memoryStorage();
  } else {
    // 로컬: 디스크 저장
    const uploadPath = storageConfig.local.uploadPath;
    const originalDir = path.join(uploadPath, 'original');

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(originalDir)) {
      fs.mkdirSync(originalDir, { recursive: true });
    }

    console.log(`📝 Multer: Using diskStorage for local - ${originalDir}`);

    return multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, originalDir);
      },
      filename: (req, file, cb) => {
        // 랜덤 파일명으로 저장 (충돌 방지)
        const hash = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        const filename = `${hash}${ext}`;
        cb(null, filename);
      },
    });
  }
};

// 파일 필터링 (파일 타입별 허용 여부 확인)
const fileFilter = (req, file, cb) => {
  if (isFileTypeAllowed(file.mimetype, file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('지원하지 않는 파일 형식입니다.'), false);
  }
};

// Multer 설정
// 파일 크기 제한은 동적으로 결정되므로 최대값으로 설정
// 실제 검증은 fileFilter에서 수행
const maxVideoSize = parseInt(process.env.MAX_VIDEO_SIZE_MB || '300', 10) * 1024 * 1024;

const upload = multer({
  storage: getStorage(),
  fileFilter: fileFilter,
  limits: {
    fileSize: maxVideoSize, // 동영상 최대 크기로 설정 (가장 큰 값)
  },
});

// 파일 크기 검증 미들웨어 (Multer 이후 실행)
const validateFileSize = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const validation = validateFile(req.file);
  if (!validation.valid) {
    return res.status(413).json({ 
      message: validation.error,
      code: 'FILE_TOO_LARGE'
    });
  }

  // 파일 타입 정보를 req에 추가 (컨트롤러에서 사용)
  req.file.fileType = validation.fileType;
  next();
};

module.exports = { upload, validateFileSize };

