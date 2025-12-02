import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from './ConnectionService';
import { ChatService } from './ChatService';
import type { FileData } from './ChatService';

export class FileTransferService {
    private client: SparkMessaging;
    private connectionService: ConnectionService;
    private chatService: ChatService;

    // 파일 타입 정의
    static readonly SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    static readonly SUPPORTED_DOCUMENT_TYPES = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
        'application/vnd.ms-excel', // xls
        'text/csv', // csv
        'application/csv', // csv (일부 브라우저)
        'text/markdown', // md
        'text/plain', // md (일부 브라우저에서 md 파일을 text/plain으로 인식)
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/msword', // doc
        'application/pdf', // pdf
    ];
    static readonly SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
    static readonly SUPPORTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

    // 파일 크기 제한 (MB)
    static readonly MAX_FILE_SIZE = 10; // 10MB

    constructor(client: SparkMessaging, connectionService: ConnectionService, chatService: ChatService) {
        this.client = client;
        this.connectionService = connectionService;
        this.chatService = chatService;
    }

    // 파일 확장자로 타입 감지
    private detectFileTypeByExtension(fileName: string): 'image' | 'document' | 'video' | 'audio' | 'unknown' {
        const extension = fileName.toLowerCase().split('.').pop() || '';

        // 이미지
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
            return 'image';
        }

        // 문서
        if (['xlsx', 'xls', 'csv', 'md', 'docx', 'doc', 'pdf'].includes(extension)) {
            return 'document';
        }

        // 동영상
        if (['mp4', 'webm', 'mov'].includes(extension)) {
            return 'video';
        }

        // 오디오
        if (['mp3', 'wav', 'ogg'].includes(extension)) {
            return 'audio';
        }

        return 'unknown';
    }

    // 파일 타입 감지 (MIME 타입 우선, 없으면 확장자 사용)
    public detectFileType(mimeType: string, fileName?: string): 'image' | 'document' | 'video' | 'audio' | 'unknown' {
        // MIME 타입이 있으면 우선 사용
        if (mimeType && mimeType !== '') {
            if (FileTransferService.SUPPORTED_IMAGE_TYPES.includes(mimeType)) {
                return 'image';
            }
            if (FileTransferService.SUPPORTED_DOCUMENT_TYPES.includes(mimeType)) {
                return 'document';
            }
            if (FileTransferService.SUPPORTED_VIDEO_TYPES.includes(mimeType)) {
                return 'video';
            }
            if (FileTransferService.SUPPORTED_AUDIO_TYPES.includes(mimeType)) {
                return 'audio';
            }
        }

        // MIME 타입이 없거나 인식되지 않으면 확장자로 확인
        if (fileName) {
            return this.detectFileTypeByExtension(fileName);
        }

        return 'unknown';
    }

    // 파일 검증
    public validateFile(file: File): { valid: boolean; error?: string } {
        // 파일 크기 검증
        const maxSizeBytes = FileTransferService.MAX_FILE_SIZE * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `파일 크기가 ${FileTransferService.MAX_FILE_SIZE}MB를 초과합니다.`,
            };
        }

        // MIME 타입 및 확장자 검증
        const fileType = this.detectFileType(file.type || '', file.name);
        if (fileType === 'unknown') {
            return {
                valid: false,
                error: '지원하지 않는 파일 타입입니다.',
            };
        }

        return { valid: true };
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

    // 파일 전송
    public async sendFile(roomId: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
        // 파일 검증
        const validation = this.validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        // 파일 읽기 (0-50%)
        const base64Data = await this.readFileAsBase64(file, onProgress);

        // 데이터 준비 (50-80%)
        if (onProgress) {
            onProgress(75);
        }

        const fileType = this.detectFileType(file.type || '', file.name);

        // MIME 타입이 없으면 확장자 기반으로 설정
        let mimeType = file.type;
        if (!mimeType || mimeType === '') {
            const extension = file.name.toLowerCase().split('.').pop() || '';
            if (extension === 'md') {
                mimeType = 'text/markdown';
            } else if (extension === 'csv') {
                mimeType = 'text/csv';
            }
        }

        const fileData: FileData = {
            fileName: file.name,
            fileType: fileType as 'image' | 'document' | 'video' | 'audio',
            mimeType: mimeType || 'application/octet-stream',
            size: file.size,
            data: base64Data,
        };

        // 이미지 썸네일 생성 (선택사항)
        if (fileType === 'image') {
            try {
                const thumbnail = await this.generateThumbnail(file, 200, 200);
                fileData.thumbnail = thumbnail;
            } catch (error) {
                console.warn('썸네일 생성 실패:', error);
            }
        }

        // 소켓 전송 (80-100%)
        if (onProgress) {
            onProgress(90);
        }

        const content = JSON.stringify({ fileData });
        await this.chatService.sendRoomMessage(roomId, 'file-transfer', content);

        if (onProgress) {
            onProgress(100);
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
