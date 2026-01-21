import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { RoomMessageData } from '@skybaer0804/spark-messaging-client';
import { chatApi } from '@/core/api/ApiService';
import { Message, MessageType } from '@/domains/Chat/types';

export type MessageCallback = (message: Message) => void;
export type RoomMessageCallback = (message: Message) => void;

export class ChatService {
  private client: SparkMessaging;
  private unsubscribeCallbacks: Array<() => void> = [];
  private currentRoomRef: string | null = null;
  private debugMode: boolean = false;

  constructor(client: SparkMessaging) {
    this.client = client;

    // 로컬 스토리지에서 디버그 모드 설정 확인
    this.debugMode = localStorage.getItem('chat_debug_mode') === 'true';
  }

  public setDebugMode(enabled: boolean) {
    this.debugMode = enabled;
    localStorage.setItem('chat_debug_mode', enabled.toString());
    console.log(`[ChatService] Debug Mode ${enabled ? 'Enabled' : 'Disabled'}`);
  }

  private logDebug(message: string, data?: any) {
    if (this.debugMode) {
      console.log(`%c[ChatDebug] ${message}`, 'color: #00bcd4; font-weight: bold;', data || '');
    }
  }

  public setUserId(_userId: string | null) {
    // v2.2.0: userId는 이제 필요시 서버에서 토큰으로 확인하거나 개별 요청에 포함
  }

  public async setCurrentRoom(roomId: string | null) {
    this.currentRoomRef = roomId;
    try {
      await chatApi.setActiveRoom(roomId);
      if (roomId) {
        await chatApi.markAsRead(roomId);
      }
    } catch (error) {
      console.error('Failed to update room status on server:', error);
    }
  }

  public getCurrentRoom(): string | null {
    return this.currentRoomRef;
  }

  public onRoomMessage(callback: RoomMessageCallback): () => void {
    const unsubscribe = this.client.onRoomMessage((msg: RoomMessageData) => {
      this.logDebug('Received Room Message:', msg);

      // 현재 Room의 메시지만 처리
      if (msg.room !== this.currentRoomRef) {
        this.logDebug(`Room message ignored (Mismatch: ${msg.room} !== ${this.currentRoomRef})`);
        return;
      }

      // v2.4.0: 시스템 이벤트 메시지는 채팅에 표시하지 않도록 필터링
      const systemEventTypes = [
        'user-joined',
        'user-left',
        'webrtc-offer',
        'webrtc-answer',
        'webrtc-ice-candidate',
        'webrtc-stopped',
        'request-participants',
        'participants-list',
        'room-destroyed',
      ];
      if (systemEventTypes.includes(msg.type as string)) {
        this.logDebug(`System message ignored for chat UI: ${msg.type}`);
        return;
      }

      // v2.2.0: 메시지 포맷팅 (서버에서 보낸 필드 반영)
      // 서버에서 socketService.sendRoomMessage를 통해 { content, senderId, timestamp } 구조로 한 번 더 감싸서 보냄
      const payload = msg.content as any;
      const contentData = payload.content || {};

      // 파일 데이터 변환 (fileUrl, thumbnailUrl → fileData)
      let fileData: any = undefined;
      if (contentData.fileUrl || contentData.thumbnailUrl) {
        // 메시지 타입 결정 (contentData.type 우선, 없으면 msg.type 사용)
        const messageType = (contentData.type || msg.type) as MessageType;
        
        // MIME 타입 결정
        let mimeType = contentData.mimeType || 'application/octet-stream';
        if (!contentData.mimeType && messageType) {
          // MIME 타입이 없으면 메시지 타입으로 추론
          if (messageType === 'video') mimeType = 'video/mp4';
          else if (messageType === 'audio') mimeType = 'audio/mpeg';
          else if (messageType === 'image') mimeType = 'image/jpeg';
          else if (messageType === '3d') mimeType = 'application/octet-stream'; // 3D 파일은 바이너리
        }
        
        // data 필드 결정 (동영상/오디오/3D는 원본 URL 사용, 이미지는 썸네일 우선)
        let dataUrl = contentData.fileUrl;
        if (messageType === 'image' && contentData.thumbnailUrl) {
          dataUrl = contentData.thumbnailUrl; // 이미지는 썸네일 우선
        } else {
          dataUrl = contentData.fileUrl; // 동영상/오디오/3D는 원본 URL
        }
        
        fileData = {
          fileName: contentData.fileName || 'unknown',
          fileType: messageType || 'file',
          mimeType: mimeType,
          size: contentData.fileSize || 0,
          url: contentData.fileUrl, // 원본 파일 URL (다운로드/재생용)
          thumbnail: contentData.thumbnailUrl, // 썸네일 URL (이미지인 경우)
          data: dataUrl, // 표시용 URL (동영상/오디오는 원본, 이미지는 썸네일)
        };
      }

      const message: Message = {
        _id: contentData._id || `${msg.timestamp}-${Math.random()}`,
        roomId: msg.room,
        senderId: contentData.senderId || payload.senderId || msg.senderId,
        senderName: contentData.senderName,
        content:
          typeof contentData.content === 'string'
            ? contentData.content
            : typeof msg.content === 'string'
            ? msg.content
            : '',
        type: (msg.type as MessageType) || 'text',
        sequenceNumber: contentData.sequenceNumber || 0,
        tempId: contentData.tempId,
        readBy: contentData.readBy || [], // [v2.4.0] 서버에서 받은 readBy 반영
        timestamp: new Date(msg.timestamp || Date.now()),
        status: 'sent',
        fileData, // 파일 데이터 추가
      };

      callback(message);
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public async sendMessage(roomId: string, content: string, type: MessageType = 'text', tempId?: string): Promise<any> {
    const response = await chatApi.sendMessage({
      roomId,
      content,
      type,
      tempId,
    });
    return response.data;
  }

  public async getRooms(workspaceId?: string) {
    const response = await chatApi.getRooms(workspaceId);
    return response.data;
  }

  public async getMessages(roomId: string) {
    const response = await chatApi.getMessages(roomId);
    return response.data;
  }

  public async syncMessages(roomId: string, fromSequence: number) {
    const response = await chatApi.syncMessages(roomId, fromSequence);
    return response.data;
  }

  public async createRoom(data: {
    name?: string;
    members?: string[];
    description?: string;
    workspaceId?: string;
    type?: string;
    teamId?: string;
    parentId?: string;
    isPrivate?: boolean;
  }) {
    return await chatApi.createRoom(data);
  }

  public async leaveRoom(roomId: string) {
    const response = await chatApi.leaveRoom(roomId);
    return response.data;
  }

  public async markAsRead(roomId: string) {
    const response = await chatApi.markAsRead(roomId);
    return response.data;
  }

  public cleanup() {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}
