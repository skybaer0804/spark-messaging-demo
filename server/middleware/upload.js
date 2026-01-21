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

/**
 * 파일명 디코딩 헬퍼 함수
 * Multer는 파일명을 latin1로 인코딩하여 전달하므로 UTF-8로 변환 필요
 * 브라우저가 보낸 파일명이 이미 깨진 경우를 대비해 여러 방법 시도
 */
function decodeFileName(originalName) {
  if (!originalName) return originalName;
  
  try {
    // 방법 1: latin1 -> UTF-8 변환 (가장 일반적인 경우)
    const decoded1 = Buffer.from(originalName, 'latin1').toString('utf8');
    
    // 방법 2: 이미 UTF-8인 경우 (변환 후 검증)
    // 한글이 포함되어 있는지 확인
    const hasKorean = /[가-힣]/.test(decoded1);
    if (hasKorean) {
      return decoded1;
    }
    
    // 방법 3: URL 디코딩 시도 (브라우저가 URL 인코딩한 경우)
    try {
      const urlDecoded = decodeURIComponent(originalName);
      if (/[가-힣]/.test(urlDecoded)) {
        return urlDecoded;
      }
    } catch (e) {
      // URL 디코딩 실패는 무시
    }
    
    // 방법 4: 원본이 이미 올바른 경우
    if (/[가-힣]/.test(originalName)) {
      return originalName;
    }
    
    return decoded1; // 기본적으로 latin1 -> UTF-8 변환 결과 반환
  } catch (error) {
    console.warn('파일명 디코딩 실패, 원본 사용:', error, 'originalName:', originalName);
    return originalName;
  }
}

// 파일 필터링 (파일 타입별 허용 여부 확인)
// 한글 파일명 지원: Multer는 파일명을 latin1로 인코딩하여 전달하므로 UTF-8로 변환
const fileFilter = (req, file, cb) => {
  // 원본 파일명 저장 (디버깅용)
  const originalFileName = file.originalname;
  
  // 파일명을 UTF-8로 디코딩 (한글 파일명 지원)
  const decodedFileName = decodeFileName(file.originalname);
  file.originalname = decodedFileName; // 원본 파일명을 UTF-8로 변환
  
  // 디버깅: 파일명 변환 로그 (변경된 경우만)
  if (originalFileName !== decodedFileName) {
    console.log('📝 [Multer] 파일명 디코딩:', {
      원본: originalFileName,
      변환: decodedFileName,
      한글포함: /[가-힣]/.test(decodedFileName)
    });
  }
  
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

