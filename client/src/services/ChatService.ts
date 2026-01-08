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

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
  }

  public setUserId(userId: string | null) {
    this.userId = userId;
  }

  public setCurrentRoom(roomId: string | null) {
    this.currentRoomRef = roomId;
  }

  public getCurrentRoom(): string | null {
    return this.currentRoomRef;
  }

  public onMessage(callback: MessageCallback, filterByRoom: boolean = false): () => void {
    const unsubscribe = this.client.onMessage((msg: MessageData) => {
      // Room에 있으면 일반 메시지는 무시
      if (filterByRoom && this.currentRoomRef) {
        return;
      }

      // 메시지 타입 검증
      const msgType = (msg as any).type || (msg as any).msgType;
      const validMessageTypes = ['text', 'image', 'file', 'chat', 'file-transfer'];
      if (msgType && !validMessageTypes.includes(msgType)) {
        return;
      }
      const content = typeof msg.content === 'object' && (msg.content as any).content 
        ? (msg.content as any).content 
        : msg.content;
      const senderId = typeof msg.content === 'object' && (msg.content as any).senderId
        ? (msg.content as any).senderId
        : (msg as any).from || msg.senderId;

      const message: ChatMessage = {
        id: `${msg.timestamp || Date.now()}-${Math.random()}`,
        content,
        timestamp: new Date(msg.timestamp || Date.now()),
        type: isOwnMessage ? 'sent' : 'received',
        senderId,
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
      // 현재 Room의 메시지만 처리
      if (msg.room !== this.currentRoomRef) {
        return;
      }

      // text, image, file, chat 및 file-transfer 타입만 채팅 메시지로 처리
      const msgType = (msg as any).type || msg.type;
      const validMessageTypes = ['text', 'image', 'file', 'chat', 'file-transfer'];
      if (!validMessageTypes.includes(msgType)) {
        return; // 시스템 메시지(join-request, join-approved, webrtc-offer 등)는 무시
      }

      const isOwnMessage = this.isOwnMessage(msg);
      const content = typeof msg.content === 'object' && (msg.content as any).content 
        ? (msg.content as any).content 
        : msg.content;
      const senderId = typeof msg.content === 'object' && (msg.content as any).senderId
        ? (msg.content as any).senderId
        : (msg as any).from || msg.senderId;

      const message: ChatMessage = {
        id: `${msg.timestamp || Date.now()}-${Math.random()}`,
        content,
        timestamp: new Date(msg.timestamp || Date.now()),
        type: isOwnMessage ? 'sent' : 'received',
        room: msg.room,
        senderId,
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

  public async createRoom(name: string, members: string[] = []) {
    const response = await chatApi.createRoom({ name, members });
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
