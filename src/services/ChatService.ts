import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import type { MessageData, RoomMessageData } from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from './ConnectionService';

export interface ChatMessage {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    room?: string;
    senderId?: string;
}

export type MessageCallback = (message: ChatMessage) => void;
export type RoomMessageCallback = (message: ChatMessage) => void;

export class ChatService {
    private client: SparkMessaging;
    private connectionService: ConnectionService;
    private unsubscribeCallbacks: Array<() => void> = [];
    private currentRoomRef: string | null = null;

    constructor(client: SparkMessaging, connectionService: ConnectionService) {
        this.client = client;
        this.connectionService = connectionService;
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

            const isOwnMessage = this.isOwnMessage(msg);
            const message: ChatMessage = {
                id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                content: msg.content,
                timestamp: new Date(msg.timestamp || Date.now()),
                type: isOwnMessage ? 'sent' : 'received',
                senderId: (msg as any).from || msg.senderId,
            };
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

            const isOwnMessage = this.isOwnMessage(msg);
            const message: ChatMessage = {
                id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                content: msg.content,
                timestamp: new Date(msg.timestamp || Date.now()),
                type: isOwnMessage ? 'sent' : 'received',
                room: msg.room,
                senderId: (msg as any).from || msg.senderId,
            };
            callback(message);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public async sendMessage(type: string, content: string): Promise<void> {
        await this.client.sendMessage(type as any, content);
    }

    public async sendRoomMessage(roomId: string, type: string, content: string): Promise<void> {
        await this.client.sendRoomMessage(roomId, type as any, content);
    }

    private isOwnMessage(msg: MessageData | RoomMessageData): boolean {
        const currentSocketId = this.connectionService.getConnectionStatus().socketId;
        return msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
    }

    public cleanup() {
        this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
        this.unsubscribeCallbacks = [];
    }
}
