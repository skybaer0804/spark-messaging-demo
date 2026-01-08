const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

const UPLOAD_BASE_PATH = 'C:/project/file';
const THUMBNAIL_PATH = path.join(UPLOAD_BASE_PATH, 'thumbnails');

// 디렉토리가 없으면 생성
if (!fs.existsSync(THUMBNAIL_PATH)) {
  fs.mkdirSync(THUMBNAIL_PATH, { recursive: true });
}

class ImageService {
  async createThumbnail(originalPath, filename) {
    const fullThumbnailPath = path.join(THUMBNAIL_PATH, `thumb_${filename}.webp`);
    
    try {
      await sharp(originalPath)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFormat('webp')
        .toFile(fullThumbnailPath);
      
      return fullThumbnailPath;
    } catch (error) {
      console.error('Thumbnail generation failed:', error);
      return null;
    }
  }

  // 사용하지 않는 파일 삭제 유틸리티
  async deleteFile(filePath) {
    try {
      await fsPromises.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
}

module.exports = new ImageService();

