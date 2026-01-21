/**
 * 파일 타입별 설정
 * 환경변수로 관리되는 파일 크기 제한 및 타임아웃 설정
 */

const FILE_TYPE_CONFIG = {
  // 이미지 파일 설정
  image: {
    maxSizeMB: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
    maxSizeBytes: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10) * 1024 * 1024,
    timeoutMs: parseInt(process.env.IMAGE_UPLOAD_TIMEOUT_MS || '60000', 10), // 60초
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  },

  // 문서 파일 설정
  document: {
    maxSizeMB: parseInt(process.env.MAX_DOC_SIZE_MB || '20', 10),
    maxSizeBytes: parseInt(process.env.MAX_DOC_SIZE_MB || '20', 10) * 1024 * 1024,
    timeoutMs: parseInt(process.env.DOC_UPLOAD_TIMEOUT_MS || '60000', 10), // 60초
    allowedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'text/csv',
      'text/plain',
      'text/markdown',
    ],
    extensions: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.txt', '.md'],
  },

  // 동영상 파일 설정
  video: {
    maxSizeMB: parseInt(process.env.MAX_VIDEO_SIZE_MB || '300', 10),
    maxSizeBytes: parseInt(process.env.MAX_VIDEO_SIZE_MB || '300', 10) * 1024 * 1024,
    timeoutMs: parseInt(process.env.VIDEO_UPLOAD_TIMEOUT_MS || '300000', 10), // 5분
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
    ],
    extensions: ['.mp4', '.webm', '.mov', '.avi'],
  },

  // 오디오 파일 설정
  audio: {
    maxSizeMB: parseInt(process.env.MAX_AUDIO_SIZE_MB || '100', 10),
    maxSizeBytes: parseInt(process.env.MAX_AUDIO_SIZE_MB || '100', 10) * 1024 * 1024,
    timeoutMs: parseInt(process.env.AUDIO_UPLOAD_TIMEOUT_MS || '120000', 10), // 2분
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/webm',
    ],
    extensions: ['.mp3', '.wav', '.ogg', '.webm'],
  },

  // 3D 모델 파일 설정
  model3d: {
    maxSizeMB: parseInt(process.env.MAX_3D_SIZE_MB || '300', 10),
    maxSizeBytes: parseInt(process.env.MAX_3D_SIZE_MB || '300', 10) * 1024 * 1024,
    timeoutMs: parseInt(process.env.MAX_3D_UPLOAD_TIMEOUT_MS || '300000', 10), // 5분
    allowedMimeTypes: [
      // 3D 파일은 표준 MIME 타입이 없으므로 확장자 기반으로 처리
      'application/octet-stream', // 일반 바이너리 파일
      'model/stl', // STL (일부 시스템에서 사용)
      'application/sla', // STL 대체 MIME
    ],
    extensions: ['.stl', '.obj', '.ply', '.dxd'],
  },
};

/**
 * MIME 타입으로 파일 타입 결정
 * @param {string} mimeType - MIME 타입
 * @returns {string|null} - 'image', 'document', 'video', 'audio', 'model3d' 또는 null
 */
function getFileTypeByMime(mimeType) {
  if (!mimeType) return null;

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('model/')) return 'model3d'; // model/stl 등
  if (FILE_TYPE_CONFIG.document.allowedMimeTypes.includes(mimeType)) return 'document';
  // 3D 파일은 MIME 타입이 다양하므로 확장자 기반으로 처리 (getFileTypeByExtension에서 처리)

  return null;
}

/**
 * 파일명 확장자로 파일 타입 결정
 * @param {string} filename - 파일명
 * @returns {string|null} - 'image', 'document', 'video', 'audio', 'model3d' 또는 null
 */
function getFileTypeByExtension(filename) {
  if (!filename) return null;

  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if (config.extensions.includes(ext)) {
      return type;
    }
  }

  return null;
}

/**
 * 파일 타입 결정 (MIME 타입 우선, 없으면 확장자)
 * @param {string} mimeType - MIME 타입
 * @param {string} filename - 파일명
 * @returns {string|null} - 파일 타입
 */
function getFileType(mimeType, filename) {
  return getFileTypeByMime(mimeType) || getFileTypeByExtension(filename);
}

/**
 * 파일 타입별 최대 크기 조회
 * @param {string} mimeType - MIME 타입
 * @param {string} filename - 파일명
 * @returns {number} - 최대 크기 (bytes)
 */
function getMaxFileSize(mimeType, filename) {
  const fileType = getFileType(mimeType, filename);
  if (!fileType) {
    // 기본값: 문서 크기 제한
    return FILE_TYPE_CONFIG.document.maxSizeBytes;
  }
  return FILE_TYPE_CONFIG[fileType].maxSizeBytes;
}

/**
 * 파일 타입별 타임아웃 조회
 * @param {string} mimeType - MIME 타입
 * @param {string} filename - 파일명
 * @returns {number} - 타임아웃 (ms)
 */
function getFileTimeout(mimeType, filename) {
  const fileType = getFileType(mimeType, filename);
  if (!fileType) {
    // 기본값: 문서 타임아웃
    return FILE_TYPE_CONFIG.document.timeoutMs;
  }
  return FILE_TYPE_CONFIG[fileType].timeoutMs;
}

/**
 * 파일 타입별 허용 여부 확인
 * @param {string} mimeType - MIME 타입
 * @param {string} filename - 파일명
 * @returns {boolean} - 허용 여부
 */
function isFileTypeAllowed(mimeType, filename) {
  const fileType = getFileType(mimeType, filename);
  if (!fileType) return false;

  const config = FILE_TYPE_CONFIG[fileType];
  
  // 3D 파일은 MIME 타입이 다양하므로 확장자 기반으로만 검증
  if (fileType === 'model3d') {
    // 확장자로 이미 확인했으므로 허용
    return true;
  }
  
  if (mimeType && !config.allowedMimeTypes.includes(mimeType)) {
    // MIME 타입이 있으면 정확히 일치해야 함
    return false;
  }

  return true;
}

/**
 * 파일 검증
 * @param {Object} file - Multer file object
 * @returns {{valid: boolean, error?: string, fileType?: string}}
 */
function validateFile(file) {
  if (!file) {
    return { valid: false, error: '파일이 없습니다.' };
  }

  const fileType = getFileType(file.mimetype, file.originalname);
  if (!fileType) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  const maxSize = getMaxFileSize(file.mimetype, file.originalname);
  if (file.size > maxSize) {
    const config = FILE_TYPE_CONFIG[fileType];
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${config.maxSizeMB}MB까지 업로드 가능합니다.`,
    };
  }

  return { valid: true, fileType };
}

module.exports = {
  FILE_TYPE_CONFIG,
  getFileType,
  getFileTypeByMime,
  getFileTypeByExtension,
  getMaxFileSize,
  getFileTimeout,
  isFileTypeAllowed,
  validateFile,
};
