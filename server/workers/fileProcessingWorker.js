const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const os = require('os');
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
      const { messageId, roomId, fileType, fileUrl, filePath, fileBuffer, filename, mimeType } = job.data;

      console.log(`🔄 파일 처리 시작: ${fileType} - ${filename} (Job ${job.id}, Room ${roomId})`);

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
          case 'model3d':
          case '3d':
            result = await this.processModel3D(job, filePath, fileBuffer, fileUrl, filename, roomId);
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
   * 진행률 전송 헬퍼
   */
  async reportProgress(job, messageId, roomId, progress) {
    job.progress(progress);
    if (roomId) {
      await socketService.sendMessageProgress(roomId, {
        messageId,
        progress
      });
    }
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
   * 3D 모델 처리 (GLB 썸네일 생성)
   * .stl, .obj, .ply 파일만 프리뷰 생성 (.dxd는 제외)
   */
  async processModel3D(job, filePath, fileBuffer, fileUrl, filename, roomId) {
    const messageId = job.data.messageId;

    try {
      // .dxd 파일은 프리뷰 생성하지 않음 (업로드/다운로드는 지원)
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.dxd') {
        console.log(`⏭️  .dxd 파일은 프리뷰를 생성하지 않습니다: ${filename}`);
        return {
          // processingStatus 제외
        };
      }

      // 지원하는 형식 확인 (.stl, .obj, .ply만)
      const supportedFormats = ['.stl', '.obj', '.ply'];
      if (!supportedFormats.includes(ext)) {
        console.log(`⏭️  지원하지 않는 3D 파일 형식: ${ext} (${filename})`);
        return {
          // processingStatus 제외
        };
      }

      // 1. 원본 파일 로드
      let originalBuffer;
      if (fileBuffer) {
        originalBuffer = fileBuffer;
      } else if (filePath && fs.existsSync(filePath)) {
        // 로컬 모드: 파일 경로에서 읽기
        originalBuffer = fs.readFileSync(filePath);
      } else if (fileUrl) {
        // S3 모드: URL에서 다운로드
        originalBuffer = await this.downloadFileFromUrl(fileUrl);
      } else {
        throw new Error('3D 모델 파일을 찾을 수 없습니다.');
      }

      // 2. 환경변수에서 스케일 값 가져오기 (기본값: 0.1)
      const scale = parseFloat(process.env.MODEL3D_THUMBNAIL_SCALE || '0.1');

      // 3. 임시 파일 경로 생성
      const tempDir = os.tmpdir();
      const tempInputPath = path.join(tempDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`);
      const tempOutputPath = path.join(tempDir, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.glb`);

      try {
        // 원본 파일을 임시 경로에 저장
        fs.writeFileSync(tempInputPath, originalBuffer);

        // 4. Assimp로 STL/OBJ/PLY → GLB 변환 (assimpjs 사용)
        let ajs;
        try {
          // assimpjs는 Promise를 반환하므로 await 필요
          ajs = await require('assimpjs')();
        } catch (requireError) {
          console.error(`❌ assimpjs 모듈 로드 실패:`, requireError);
          throw new Error(`assimpjs 모듈을 로드할 수 없습니다: ${requireError.message}`);
        }

        try {
          // assimpjs API: FileList를 생성하고 파일 추가
          const fileList = new ajs.FileList();
          fileList.AddFile(
            path.basename(tempInputPath),
            new Uint8Array(originalBuffer)
          );
          
          // ConvertFileList 호출 (fileList, 출력 형식)
          // assimpjs에서 gltf2(JSON)를 명시하여 구조적 안정성 확보
          const result = ajs.ConvertFileList(fileList, 'gltf2');
          
          // 변환 성공 여부 확인
          if (!result.IsSuccess() || result.FileCount() === 0) {
            const errorCode = result.GetErrorCode();
            throw new Error(`assimpjs 변환 실패: ${errorCode}`);
          }
          
          let gltfJson = null;
          const resources = {};

          for (let i = 0; i < result.FileCount(); i++) {
            const resFile = result.GetFile(i);
            const fileName = resFile.GetPath();
            const fileContent = resFile.GetContent(); // Uint8Array
            
            if (fileName.toLowerCase().endsWith('.gltf')) {
              gltfJson = JSON.parse(new TextDecoder().decode(fileContent));
            } else {
              // bin 파일이나 이미지 파일들을 리소스로 저장
              resources[fileName] = Buffer.from(fileContent);
            }
          }

          if (!gltfJson) {
            throw new Error('변환 결과 중 glTF JSON 파일을 찾을 수 없습니다.');
          }

          // 5. gltf-pipeline로 glTF(JSON) → GLB 변환 및 Draco 압축
          let gltfPipeline;
          try {
            gltfPipeline = require('gltf-pipeline');
          } catch (requireError) {
            console.error(`❌ gltf-pipeline 모듈 로드 실패:`, requireError);
            throw new Error(`gltf-pipeline 모듈을 로드할 수 없습니다: ${requireError.message}`);
          }

          const DRACO_THRESHOLD = 5 * 1024 * 1024; // 5MB (유저 요청에 따라 5MB로 복구)
          // 실제 gltfJson 구조의 크기를 가늠하기 어려우므로 원본 크기 기준으로 압축 여부 결정
          const shouldCompress = originalBuffer.length > DRACO_THRESHOLD;

          const options = {
            resourceDirectory: tempDir,
            separate: false,
            dracoOptions: shouldCompress ? { 
              compressionLevel: 7,
              quantizePositionBits: 14,
            } : undefined,
            fixUnusedElements: true,
            optimizeForCesium: false
          };

          // gltf-pipeline은 resources를 직접 넘기는 API가 제한적이므로 
          // 내부 파일들을 임시 디렉토리에 써주어야 gltfToGlb가 찾을 수 있음
          for (const [name, buffer] of Object.entries(resources)) {
            fs.writeFileSync(path.join(tempDir, name), buffer);
          }

          const conversionResult = await gltfPipeline.gltfToGlb(gltfJson, options);
          let finalGlbBuffer = conversionResult.glb;

          // 5-1. 최종 생성된 바이너리 검증
          try {
            const validator = require('gltf-validator');
            const report = await validator.validateBytes(new Uint8Array(finalGlbBuffer));
            
            if (report.issues.numErrors > 0) {
              console.warn(`⚠️  최종 GLB 검증 결과 오류 발견 (${report.issues.numErrors}개)`);
              if (shouldCompress) {
                console.warn(`🔄 Draco 압축 없이 재시도...`);
                const fallbackResult = await gltfPipeline.gltfToGlb(gltfJson, { 
                  resourceDirectory: tempDir,
                  fixUnusedElements: true 
                });
                finalGlbBuffer = fallbackResult.glb;
              }
            }
          } catch (validatorError) {
            console.warn(`⚠️  최종 검증 도중 에러 발생: ${validatorError.message}`);
          }

          // 리소스 임시 파일 삭제
          for (const name of Object.keys(resources)) {
            const resourcePath = path.join(tempDir, name);
            if (fs.existsSync(resourcePath)) fs.unlinkSync(resourcePath);
          }

          // 6. 3D 변환 모델 저장 (render 폴더)
          const renderFilename = `render_${path.parse(filename).name}.glb`;
          
          const renderResult = await StorageService.saveRender(
            finalGlbBuffer,
            renderFilename
          );

          return {
            renderUrl: renderResult.url, // 변환된 GLB는 renderUrl에 저장
            // processingStatus 제외
          };
        } catch (convertError) {
          console.error(`❌ [3단계/4단계] 변환 프로세스 실패:`, convertError);
          throw convertError;
        }
      } finally {
        // 임시 파일 정리
        try {
          if (fs.existsSync(tempInputPath)) {
            fs.unlinkSync(tempInputPath);
          }
          if (fs.existsSync(tempOutputPath)) {
            fs.unlinkSync(tempOutputPath);
          }
        } catch (cleanupError) {
          console.warn('⚠️  임시 파일 정리 실패:', cleanupError);
        }
      }
    } catch (error) {
      console.error(`❌ [3D 모델 처리 실패] ${filename}:`, error);
      console.error(`   에러 메시지:`, error.message);
      console.error(`   에러 스택:`, error.stack);
      // 에러 발생 시 원본 파일 정보만 반환 (썸네일 없음)
      return {
        // processingStatus 제외
        error: error.message,
        // thumbnailUrl 없음 = 프리뷰 없음, 원본 파일 정보만 표시
      };
    }
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
    } catch (error) {
      console.error('메시지 업데이트 실패:', error);
      throw error;
    }
  }
}

// 워커 인스턴스 생성 및 시작
const worker = new FileProcessingWorker();

module.exports = worker;
