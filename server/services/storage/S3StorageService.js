const AWS = require('aws-sdk');
const crypto = require('crypto');
const storageConfig = require('../../config/storageConfig');

/**
 * AWS S3를 사용한 저장소 서비스
 * 프로덕션 환경에서 사용
 */
class S3StorageService {
  constructor() {
    this.config = storageConfig.s3;

    // AWS S3 클라이언트 초기화
    this.s3 = new AWS.S3({
      region: this.config.region,
      accessKeyId: this.config.accessKeyId,
      secretAccessKey: this.config.secretAccessKey,
    });

    this.bucket = this.config.bucket;
    this.folderPrefix = this.config.folderPrefix;
  }

  /**
   * 파일 저장
   * @param {Object} file - Express Multer file object (memoryStorage)
   * @param {String} type - 'original' 또는 'thumbnail'
   * @returns {Promise<Object>} - { filename, url, s3Key }
   */
  async saveFile(file, type = 'original') {
    try {
      // 파일명 생성
      const ext = this.getExtension(file.originalname);
      const filename =
        file.filename ||
        `${crypto.randomBytes(8).toString('hex')}.${ext}`;

      // S3 Key 구성
      const key = `${this.folderPrefix}/${type}/${filename}`;

      // S3 업로드 파라미터
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer, // Multer memoryStorage에서 제공
        ContentType: file.mimetype,
        Metadata: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
        },
      };

      // S3 업로드
      const result = await this.s3.upload(params).promise();

      return {
        filename: filename,
        url: result.Location, // AWS가 제공하는 URL
        s3Key: key, // 삭제 시 필요
      };
    } catch (error) {
      console.error('❌ S3StorageService.saveFile error:', error);
      throw error;
    }
  }

  /**
   * 썸네일 저장
   * @param {Buffer} thumbnailBuffer - 썸네일 바이너리
   * @param {String} filename - 썸네일 파일명
   * @returns {Promise<Object>} - { filename, url, s3Key }
   */
  async saveThumbnail(thumbnailBuffer, filename) {
    try {
      // S3 Key 구성
      const key = `${this.folderPrefix}/${this.config.thumbnailDir || 'thumbnails'}/${filename}`;

      // S3 업로드 파라미터
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: thumbnailBuffer,
        ContentType: 'image/webp',
        Metadata: {
          type: 'thumbnail',
          uploadedAt: new Date().toISOString(),
        },
      };

      // S3 업로드
      const result = await this.s3.upload(params).promise();

      return {
        filename: filename,
        url: result.Location,
        s3Key: key,
      };
    } catch (error) {
      console.error('❌ S3StorageService.saveThumbnail error:', error);
      throw error;
    }
  }

  /**
   * 3D 변환 모델 저장
   * @param {Buffer} renderBuffer - GLB 바이너리
   * @param {String} filename - 파일명
   * @returns {Promise<Object>} - { filename, url, s3Key }
   */
  async saveRender(renderBuffer, filename) {
    try {
      // S3 Key 구성
      const key = `${this.folderPrefix}/${this.config.renderDir || 'render'}/${filename}`;

      // S3 업로드 파라미터
      const params = {
        Bucket: this.bucket,
        Key: key,
        Body: renderBuffer,
        ContentType: 'model/gltf-binary',
        Metadata: {
          type: 'render',
          uploadedAt: new Date().toISOString(),
        },
      };

      // S3 업로드
      const result = await this.s3.upload(params).promise();

      return {
        filename: filename,
        url: result.Location,
        s3Key: key,
      };
    } catch (error) {
      console.error('❌ S3StorageService.saveRender error:', error);
      throw error;
    }
  }

  /**
   * 파일 삭제
   * @param {String} fileUrl - S3 파일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteFile(fileUrl) {
    try {
      // S3 URL에서 Key 추출
      // https://bucket.s3.region.amazonaws.com/chat-files/original/filename.png
      const urlPath = new URL(fileUrl).pathname.replace(/^\//, '');

      const params = {
        Bucket: this.bucket,
        Key: urlPath,
      };

      // S3 삭제
      await this.s3.deleteObject(params).promise();

      return true;
    } catch (error) {
      console.error('❌ S3StorageService.deleteFile error:', error);
      throw error;
    }
  }

  /**
   * 썸네일 삭제
   * @param {String} thumbnailUrl - 썸네일 URL
   * @returns {Promise<Boolean>} - 삭제 성공 여부
   */
  async deleteThumbnail(thumbnailUrl) {
    return this.deleteFile(thumbnailUrl);
  }

  /**
   * 파일 확장자 추출
   * @param {String} filename - 파일명
   * @returns {String} - 확장자
   */
  getExtension(filename) {
    return filename.split('.').pop();
  }
}

module.exports = S3StorageService;
