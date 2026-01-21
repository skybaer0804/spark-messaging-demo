import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from './ConnectionService';
import { ChatService } from './ChatService';
import { chatApi } from './ApiService';
import { validateFile as validateFileConfig, getFileType, FILE_TYPE_CONFIG } from '../config/fileConfig';

export class FileTransferService {
  private chatService: ChatService;

  constructor(_client: SparkMessaging, _connectionService: ConnectionService, chatService: ChatService) {
    this.chatService = chatService;
  }

  // 파일 검증 (백엔드와 동일한 로직 사용)
  public validateFile(file: File): { valid: boolean; error?: string } {
    const validation = validateFileConfig(file);
    return validation;
  }

  // 파일을 Base64로 읽기
  public readFileAsBase64(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const progress = (e.loaded / e.total) * 50; // 0-50% 범위
          onProgress(progress);
        }
      };

      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };

      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };

      reader.readAsDataURL(file);
    });
  }

  // 파일 전송 (v2.0.0 DB-First 방식)
  public async sendFile(roomId: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    // 1. 파일 검증
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (onProgress) onProgress(10);

    // 2. FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', roomId);

    try {
      if (onProgress) onProgress(30);

      // 3. 백엔드 API를 통해 파일 업로드 (DB 저장 및 소켓 브로드캐스트 포함)
      await chatApi.uploadFile(formData);

      if (onProgress) onProgress(100);
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }

  // 이미지 썸네일 생성
  private generateThumbnail(file: File, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context를 가져올 수 없습니다.'));
        return;
      }

      img.onload = () => {
        // 비율 유지하며 리사이징
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnail);
      };

      img.onerror = () => {
        reject(new Error('이미지 로드 실패'));
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
      reader.readAsDataURL(file);
    });
  }
}
