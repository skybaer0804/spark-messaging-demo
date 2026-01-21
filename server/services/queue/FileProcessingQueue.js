const Queue = require('bull');
const redisConfig = require('../../config/redis');

/**
 * 파일 처리 큐 (Bull Queue)
 * 썸네일/프리뷰 생성을 비동기로 처리
 */
class FileProcessingQueue {
  constructor() {
    // Redis 연결 설정
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    // 파일 처리 큐 생성
    this.queue = new Queue('file-processing', {
      redis: redisUrl,
      defaultJobOptions: {
        attempts: 3, // 최대 3번 재시도
        backoff: {
          type: 'exponential',
          delay: 2000, // 2초부터 시작하여 지수적으로 증가
        },
        removeOnComplete: {
          age: 3600, // 1시간 후 완료된 작업 삭제
          count: 100, // 최대 100개 유지
        },
        removeOnFail: {
          age: 86400, // 24시간 후 실패한 작업 삭제
        },
      },
    });

    // 큐 이벤트 리스너
    this.setupEventListeners();
  }

  /**
   * 큐 이벤트 리스너 설정
   */
  setupEventListeners() {
    this.queue.on('completed', (job, result) => {
      console.log(`✅ 파일 처리 완료: Job ${job.id} - ${job.data.fileType}`);
    });

    this.queue.on('failed', (job, err) => {
      console.error(`❌ 파일 처리 실패: Job ${job.id} - ${err.message}`);
    });

    this.queue.on('error', (error) => {
      console.error('❌ 큐 에러:', error);
    });
  }

  /**
   * 파일 처리 작업 추가
   * @param {Object} jobData - 작업 데이터
   * @param {string} jobData.messageId - 메시지 ID
   * @param {string} jobData.fileType - 파일 타입 ('image', 'video', 'audio', 'document')
   * @param {string} jobData.fileUrl - 원본 파일 URL
   * @param {string} jobData.filePath - 로컬 파일 경로 (로컬 스토리지인 경우)
   * @param {Buffer} jobData.fileBuffer - 파일 버퍼 (S3 스토리지인 경우)
   * @param {string} jobData.filename - 파일명
   * @param {string} jobData.mimeType - MIME 타입
   * @returns {Promise<Object>} - Bull Job 객체
   */
  async addFileProcessingJob(jobData) {
    try {
      const job = await this.queue.add('process-file', jobData, {
        priority: this.getPriority(jobData.fileType),
      });
      return job;
    } catch (error) {
      console.error('파일 처리 작업 추가 실패:', error);
      throw error;
    }
  }

  /**
   * 파일 타입별 우선순위 결정
   * @param {string} fileType - 파일 타입
   * @returns {number} - 우선순위 (낮을수록 높은 우선순위)
   */
  getPriority(fileType) {
    const priorities = {
      image: 1, // 이미지는 가장 높은 우선순위
      document: 2,
      audio: 3,
      video: 4, // 동영상은 가장 낮은 우선순위 (처리 시간이 오래 걸림)
    };
    return priorities[fileType] || 5;
  }

  /**
   * 작업 상태 조회
   * @param {string} jobId - 작업 ID
   * @returns {Promise<Object>} - 작업 상태
   */
  async getJobStatus(jobId) {
    const job = await this.queue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();

    return {
      id: job.id,
      state,
      progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  /**
   * 큐 통계 조회
   * @returns {Promise<Object>} - 큐 통계
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
    };
  }

  /**
   * 큐 정리 (테스트/개발용)
   */
  async clean() {
    await this.queue.clean(0, 'completed');
    await this.queue.clean(0, 'failed');
  }
}

// Singleton 인스턴스
module.exports = new FileProcessingQueue();
