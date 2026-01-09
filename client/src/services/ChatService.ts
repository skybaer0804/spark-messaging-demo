import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { MessageData, RoomMessageData } from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from './ConnectionService';
import { chatApi } from './ApiService';

export interface FileData {
  fileName: string;
  fileType: 'image' | 'document' | 'video' | 'audio';
  mimeType: string;
  size: number;
  data: string; // Base64
  thumbnail?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'sent' | 'received';
  room?: string;
  senderId?: string;
  senderName?: string;
  fileData?: FileData;
}

export type MessageCallback = (message: ChatMessage) => void;
export type RoomMessageCallback = (message: ChatMessage) => void;

export class ChatService {
  private client: SparkMessaging;
  private connectionService: ConnectionService;
  private unsubscribeCallbacks: Array<() => void> = [];
  private currentRoomRef: string | null = null;
  private userId: string | null = null;
  private debugMode: boolean = false;

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
    
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

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public async setCurrentRoom(roomId: string | null) {
    this.currentRoomRef = roomId;
    try {
      await chatApi.setActiveRoom(roomId);
    } catch (error) {
      console.error('Failed to set active room on server:', error);
    }
  }

  public getCurrentRoom(): string | null {
    return this.currentRoomRef;
  }

  public onMessage(callback: MessageCallback, filterByRoom: boolean = false): () => void {
    const unsubscribe = this.client.onMessage((msg: MessageData) => {
      this.logDebug('Received Global Message:', msg);

      // Room에 있으면 일반 메시지는 무시
      if (filterByRoom && this.currentRoomRef) {
        this.logDebug('Global message ignored (currently in a room)');
        return;
      }

      // 메시지 타입 검증
      const msgType = (msg as any).type || (msg as any).msgType;
      const validMessageTypes = ['text', 'image', 'file', 'chat', 'file-transfer'];
      if (msgType && !validMessageTypes.includes(msgType)) {
        return;
      }
      const isOwnMessage = this.isOwnMessage(msg);
      
      // 콘텐트가 객체인 경우 (중첩된 경우) 처리
      let content = '';
      if (typeof msg.content === 'object' && msg.content !== null) {
        content = (msg.content as any).content || JSON.stringify(msg.content);
      } else {
        content = String(msg.content || '');
      }

      const senderId = typeof msg.content === 'object' && (msg.content as any).senderId
        ? (msg.content as any).senderId
        : (msg as any).from || msg.senderId;
      const senderName = typeof msg.content === 'object' && (msg.content as any).senderName
        ? (msg.content as any).senderName
        : undefined;

      const message: ChatMessage = {
        id: `${msg.timestamp || Date.now()}-${Math.random()}`,
        content,
        timestamp: new Date(msg.timestamp || Date.now()),
        type: isOwnMessage ? 'sent' : 'received',
        senderId,
        senderName,
      };

      // 파일 전송 메시지 처리
      if ((msg as any).type === 'file-transfer') {
        try {
          const fileData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
          if (fileData.fileData) {
            message.fileData = fileData.fileData;
          }
        } catch (error) {
          console.error('Failed to parse file data:', error);
        }
      }

      callback(message);
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public onRoomMessage(callback: RoomMessageCallback): () => void {
    const unsubscribe = this.client.onRoomMessage((msg: RoomMessageData) => {
      this.logDebug('Received Room Message:', msg);

      // 현재 Room의 메시지만 처리
      if (msg.room !== this.currentRoomRef) {
        this.logDebug(`Room message ignored (Mismatch: ${msg.room} !== ${this.currentRoomRef})`);
        return;
      }

      // text, image, file, chat 및 file-transfer 타입만 채팅 메시지로 처리
      const msgType = (msg as any).type || msg.type;
      const validMessageTypes = ['text', 'image', 'file', 'chat', 'file-transfer'];
      if (!validMessageTypes.includes(msgType)) {
        return; // 시스템 메시지(join-request, join-approved, webrtc-offer 등)는 무시
      }

      const isOwnMessage = this.isOwnMessage(msg);
      
      // 콘텐트가 객체인 경우 (중첩된 경우) 처리
      let content = '';
      if (typeof msg.content === 'object' && msg.content !== null) {
        content = (msg.content as any).content || JSON.stringify(msg.content);
      } else {
        content = String(msg.content || '');
      }

      const senderId = typeof msg.content === 'object' && (msg.content as any).senderId
        ? (msg.content as any).senderId
        : (msg as any).from || msg.senderId;
      const senderName = typeof msg.content === 'object' && (msg.content as any).senderName
        ? (msg.content as any).senderName
        : undefined;

      const message: ChatMessage = {
        id: `${msg.timestamp || Date.now()}-${Math.random()}`,
        content,
        timestamp: new Date(msg.timestamp || Date.now()),
        type: isOwnMessage ? 'sent' : 'received',
        room: msg.room,
        senderId,
        senderName,
      };

      // 파일 전송 메시지 처리
      if (msgType === 'file-transfer') {
        try {
          const fileData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
          if (fileData.fileData) {
            message.fileData = fileData.fileData;
          }
        } catch (error) {
          console.error('Failed to parse file data:', error);
        }
      }

      callback(message);
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public async sendMessage(type: string, content: string): Promise<void> {
    // 백엔드 API를 통해 메시지 전송 (DB 저장 및 브로드캐스트 트리거)
    await chatApi.sendMessage({
      content,
      type
    });
  }

  public async sendRoomMessage(roomId: string, type: string, content: string): Promise<void> {
    // 백엔드 API를 통해 메시지 전송 (DB 저장 및 브로드캐스트 트리거)
    await chatApi.sendMessage({
      roomId,
      content,
      type
    });
  }

  public async getRooms() {
    const response = await chatApi.getRooms();
    return response.data;
  }

  public async getMessages(roomId: string) {
    const response = await chatApi.getMessages(roomId);
    return response.data;
  }

  public async createRoom(data: { name: string; members?: string[]; invitedOrgs?: string[]; isGroup?: boolean }) {
    const response = await chatApi.createRoom(data);
    return response.data;
  }

  private isOwnMessage(msg: MessageData | RoomMessageData): boolean {
    if (this.userId) {
      const senderId = (msg as any).from || msg.senderId;
      return senderId === this.userId;
    }
    const currentSocketId = this.connectionService.getConnectionStatus().socketId;
    return msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
  }

  public cleanup() {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}
