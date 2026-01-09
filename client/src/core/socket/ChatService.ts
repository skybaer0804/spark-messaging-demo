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

      // v2.2.0: 메시지 포맷팅 (서버에서 보낸 필드 반영)
      const content = msg.content as any;
      const message: Message = {
        _id: content._id || `${msg.timestamp}-${Math.random()}`,
        roomId: msg.room,
        senderId: content.senderId || msg.senderId,
        senderName: content.senderName,
        content: content.content || (typeof msg.content === 'string' ? msg.content : ''),
        type: (msg.type as MessageType) || 'text',
        sequenceNumber: content.sequenceNumber || 0,
        tempId: content.tempId,
        readBy: [],
        timestamp: new Date(msg.timestamp || Date.now()),
        status: 'sent',
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

  public async getRooms() {
    const response = await chatApi.getRooms();
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

  public async createRoom(data: { name: string; members?: string[]; invitedOrgs?: string[]; isGroup?: boolean }) {
    const response = await chatApi.createRoom(data);
    return response.data;
  }

  public cleanup() {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
  }
}
