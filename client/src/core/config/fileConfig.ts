/**
 * 파일 타입별 설정
 * 백엔드와 동일한 설정을 사용하도록 프론트엔드용 설정
 */

// 환경변수에서 읽거나 기본값 사용 (Vite: import.meta.env)
const getEnv = (key: string, defaultValue: string): number => {
  // Vite 환경변수는 VITE_ 접두사 필요
  const value = import.meta.env[`VITE_${key}`] || import.meta.env[key] || defaultValue;
  return parseInt(value, 10);
};

export const FILE_TYPE_CONFIG = {
  // 이미지 파일 설정
  image: {
    maxSizeMB: getEnv('MAX_IMAGE_SIZE_MB', '10'),
    maxSizeBytes: getEnv('MAX_IMAGE_SIZE_MB', '10') * 1024 * 1024,
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
    maxSizeMB: getEnv('MAX_DOC_SIZE_MB', '20'),
    maxSizeBytes: getEnv('MAX_DOC_SIZE_MB', '20') * 1024 * 1024,
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
    maxSizeMB: getEnv('MAX_VIDEO_SIZE_MB', '300'),
    maxSizeBytes: getEnv('MAX_VIDEO_SIZE_MB', '300') * 1024 * 1024,
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
    maxSizeMB: getEnv('MAX_AUDIO_SIZE_MB', '100'),
    maxSizeBytes: getEnv('MAX_AUDIO_SIZE_MB', '100') * 1024 * 1024,
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
    maxSizeMB: getEnv('MAX_3D_SIZE_MB', '300'),
    maxSizeBytes: getEnv('MAX_3D_SIZE_MB', '300') * 1024 * 1024,
    allowedMimeTypes: [
      // 3D 파일은 표준 MIME 타입이 없으므로 확장자 기반으로 처리
      'application/octet-stream',
      'model/stl',
      'application/sla',
    ],
    extensions: ['.stl', '.obj', '.ply', '.dxd'],
  },
} as const;

/**
 * MIME 타입으로 파일 타입 결정
 */
export function getFileTypeByMime(mimeType: string): 'image' | 'document' | 'video' | 'audio' | '3d' | null {
  if (!mimeType) return null;

  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('model/')) return '3d'; // model/stl 등
  if ((FILE_TYPE_CONFIG.document.allowedMimeTypes as readonly string[]).includes(mimeType)) return 'document';
  // 3D 파일은 MIME 타입이 다양하므로 확장자 기반으로 처리

  return null;
}

/**
 * 파일명 확장자로 파일 타입 결정
 */
export function getFileTypeByExtension(filename: string): 'image' | 'document' | 'video' | 'audio' | '3d' | null {
  if (!filename) return null;

  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  for (const [type, config] of Object.entries(FILE_TYPE_CONFIG)) {
    if ((config.extensions as readonly string[]).includes(ext)) {
      // model3d를 '3d'로 변환
      if (type === 'model3d') return '3d';
      return type as 'image' | 'document' | 'video' | 'audio' | '3d';
    }
  }

  return null;
}

/**
 * 파일 타입 결정 (MIME 타입 우선, 없으면 확장자)
 */
export function getFileType(mimeType: string, filename?: string): 'image' | 'document' | 'video' | 'audio' | '3d' | null {
  return getFileTypeByMime(mimeType) || (filename ? getFileTypeByExtension(filename) : null);
}

/**
 * 파일 타입별 최대 크기 조회
 */
export function getMaxFileSize(mimeType: string, filename?: string): number {
  const fileType = getFileType(mimeType, filename);
  if (!fileType) {
    // 기본값: 문서 크기 제한
    return FILE_TYPE_CONFIG.document.maxSizeBytes;
  }
  
  // '3d' 타입을 'model3d'로 변환 (FILE_TYPE_CONFIG 키와 일치시키기)
  const configKey = fileType === '3d' ? 'model3d' : fileType;
  const config = FILE_TYPE_CONFIG[configKey as keyof typeof FILE_TYPE_CONFIG];
  
  if (!config) {
    // 설정이 없으면 문서 크기 제한 반환
    return FILE_TYPE_CONFIG.document.maxSizeBytes;
  }
  
  return config.maxSizeBytes;
}

/**
 * 파일 타입별 허용 여부 확인
 */
export function isFileTypeAllowed(mimeType: string, filename?: string): boolean {
  const fileType = getFileType(mimeType, filename);
  if (!fileType) return false;

  // 3D 파일은 model3d 키로 저장되어 있음
  const configKey = fileType === '3d' ? 'model3d' : fileType;
  const config = FILE_TYPE_CONFIG[configKey as keyof typeof FILE_TYPE_CONFIG];
  if (!config) return false;

  // 3D 파일은 MIME 타입이 다양하므로 확장자 기반으로만 검증
  if (fileType === '3d') {
    return true; // 확장자로 이미 확인했으므로 허용
  }

  if (mimeType && !(config.allowedMimeTypes as readonly string[]).includes(mimeType)) {
    // MIME 타입이 있으면 정확히 일치해야 함
    return false;
  }

  return true;
}

/**
 * 파일 검증
 */
export function validateFile(file: File): { valid: boolean; error?: string; fileType?: string } {
  if (!file) {
    return { valid: false, error: '파일이 없습니다.' };
  }

  const fileType = getFileType(file.type || '', file.name);
  if (!fileType) {
    return { valid: false, error: '지원하지 않는 파일 형식입니다.' };
  }

  const maxSize = getMaxFileSize(file.type || '', file.name);
  if (file.size > maxSize) {
    // '3d' 타입을 'model3d'로 변환
    const configKey = fileType === '3d' ? 'model3d' : fileType;
    const config = FILE_TYPE_CONFIG[configKey as keyof typeof FILE_TYPE_CONFIG];
    
    if (!config) {
      return {
        valid: false,
        error: '파일 크기가 너무 큽니다.',
      };
    }
    
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. 최대 ${config.maxSizeMB}MB까지 업로드 가능합니다.`,
    };
  }

  return { valid: true, fileType };
}
