const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const FileProcessingQueue = require('../services/queue/FileProcessingQueue');
const StorageService = require('../services/storage/StorageService');
const storageConfig = require('../config/storageConfig');
const Message = require('../models/Message');
const socketService = require('../services/socketService');

/**
 * 파일 처리 워커
 * 썸네일/프리뷰 생성 및 메타데이터 추출을 비동기로 처리
 */
class FileProcessingWorker {
  constructor() {
    this.queue = FileProcessingQueue.queue;
    this.setupProcessor();
  }

  /**
   * 큐 프로세서 설정
   */
  setupProcessor() {
    // 파일 처리 작업 프로세서
    this.queue.process('process-file', async (job) => {
      const { messageId, fileType, fileUrl, filePath, fileBuffer, filename, mimeType } = job.data;

      console.log(`🔄 파일 처리 시작: ${fileType} - ${filename} (Job ${job.id})`);

      try {
        let result = {};

        // 파일 타입별 처리
        switch (fileType) {
          case 'image':
            result = await this.processImage(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'video':
            result = await this.processVideo(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'audio':
            result = await this.processAudio(job, filePath, fileBuffer, fileUrl, filename);
            break;
          case 'document':
            result = await this.processDocument(job, filePath, fileBuffer, fileUrl, filename);
            break;
          default:
            throw new Error(`지원하지 않는 파일 타입: ${fileType}`);
        }

        // DB 업데이트
        await this.updateMessage(messageId, result);

        console.log(`✅ 파일 처리 완료: ${fileType} - ${filename} (Job ${job.id})`);
        return result;
      } catch (error) {
        console.error(`❌ 파일 처리 실패: ${fileType} - ${filename} (Job ${job.id})`, error);
        
        // 실패 상태로 DB 업데이트
        await this.updateMessage(messageId, {
          processingStatus: 'failed',
          error: error.message,
        });

        throw error;
      }
    });
  }

  /**
   * URL에서 파일 다운로드 (S3용)
   */
  async downloadFileFromUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`파일 다운로드 실패: ${response.statusCode}`));
          return;
        }

        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }

  /**
   * 이미지 처리 (썸네일 생성)
   */
  async processImage(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // 이미지 버퍼 로드
    let imageBuffer;
    if (fileBuffer) {
      // 버퍼가 직접 제공된 경우 (S3 모드에서 즉시 처리 시)
      imageBuffer = fileBuffer;
    } else if (filePath && fs.existsSync(filePath)) {
      // 로컬 모드: 파일 경로에서 읽기
      imageBuffer = fs.readFileSync(filePath);
    } else if (fileUrl) {
      // S3 모드: URL에서 다운로드
      job.progress(20);
      imageBuffer = await this.downloadFileFromUrl(fileUrl);
    } else {
      throw new Error('이미지 파일을 찾을 수 없습니다.');
    }

    job.progress(30);

    // 썸네일 생성
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .toFormat('webp')
      .toBuffer();

    job.progress(60);

    // 썸네일 저장
    const thumbnailFilename = `thumb_${filename}.webp`;
    const thumbnailResult = await StorageService.saveThumbnail(
      thumbnailBuffer,
      thumbnailFilename
    );

    job.progress(100);

    return {
      thumbnailUrl: thumbnailResult.url,
      processingStatus: 'completed',
    };
  }

  /**
   * 동영상 처리 (썸네일 생성 - 추후 FFmpeg 통합 예정)
   */
  async processVideo(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: FFmpeg를 사용한 썸네일 추출
    // 현재는 기본 정보만 반환
    // 추후 FFmpeg 통합 시 구현

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: thumbnailUrl, duration, resolution 등 추가
    };
  }

  /**
   * 오디오 처리 (메타데이터 추출 - 추후 구현)
   */
  async processAudio(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: 오디오 메타데이터 추출 (duration, bitrate 등)
    // 현재는 기본 정보만 반환

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: duration, bitrate 등 추가
    };
  }

  /**
   * 문서 처리 (프리뷰 생성 - 추후 구현)
   */
  async processDocument(job, filePath, fileBuffer, fileUrl, filename) {
    job.progress(10);

    // TODO: PDF 첫 페이지 이미지 변환 등
    // 현재는 기본 정보만 반환

    job.progress(100);

    return {
      processingStatus: 'completed',
      // TODO: previewUrl 등 추가
    };
  }

  /**
   * 메시지 업데이트 및 소켓 브로드캐스트
   */
  async updateMessage(messageId, updateData) {
    try {
      const message = await Message.findByIdAndUpdate(
        messageId,
        { $set: updateData },
        { new: true }
      ).populate('roomId');

      if (!message) {
        console.error(`메시지를 찾을 수 없습니다: ${messageId}`);
        return;
      }

      // 소켓으로 메시지 업데이트 브로드캐스트
      await socketService.sendMessageUpdate(message.roomId._id.toString(), {
        messageId: message._id.toString(),
        ...updateData,
      });

      console.log(`📢 메시지 업데이트 브로드캐스트: ${messageId}`);
    } catch (error) {
      console.error('메시지 업데이트 실패:', error);
      throw error;
    }
  }
}

// 워커 인스턴스 생성 및 시작
const worker = new FileProcessingWorker();

module.exports = worker;
