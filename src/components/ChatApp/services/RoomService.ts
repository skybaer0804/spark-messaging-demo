import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '../../../services/ConnectionService';

export type RoomJoinedCallback = (roomId: string) => void;
export type RoomLeftCallback = (roomId: string) => void;

export class RoomService {
    private client: SparkMessaging;
    private connectionService: ConnectionService;
    private unsubscribeCallbacks: Array<() => void> = [];
    private currentRoomRef: string | null = null;
    private joinedRooms: Set<string> = new Set();

    constructor(client: SparkMessaging, connectionService: ConnectionService) {
        this.client = client;
        this.connectionService = connectionService;
    }

    public getCurrentRoom(): string | null {
        return this.currentRoomRef;
    }

    public getJoinedRooms(): string[] {
        return Array.from(this.joinedRooms);
    }

    public onRoomJoined(callback: RoomJoinedCallback): () => void {
        const unsubscribe = this.client.onRoomJoined((roomId: string) => {
            this.joinedRooms.add(roomId);
            this.currentRoomRef = roomId;
            callback(roomId);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public onRoomLeft(callback: RoomLeftCallback): () => void {
        const unsubscribe = this.client.onRoomLeft((roomId: string) => {
            this.joinedRooms.delete(roomId);
            if (this.currentRoomRef === roomId) {
                this.currentRoomRef = null;
            }
            callback(roomId);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public async joinRoom(roomId: string): Promise<void> {
        const status = this.connectionService.getConnectionStatus();
        if (!status.isConnected) {
            throw new Error('서버에 연결되어 있지 않습니다.');
        }

        if (this.joinedRooms.has(roomId)) {
            // 이미 참여 중인 방이면 바로 선택
            this.currentRoomRef = roomId;
            return;
        }

        await this.client.joinRoom(roomId);
        // handleRoomJoined에서 처리됨
    }

    public async leaveRoom(roomId: string): Promise<void> {
        const status = this.connectionService.getConnectionStatus();
        if (!status.isConnected || !this.currentRoomRef) {
            return;
        }

        await this.client.leaveRoom(roomId);
        // handleRoomLeft에서 처리됨
    }

    public setCurrentRoom(roomId: string | null) {
        this.currentRoomRef = roomId;
    }

    public cleanup() {
        this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
        this.unsubscribeCallbacks = [];
        this.currentRoomRef = null;
        this.joinedRooms.clear();
    }
}
