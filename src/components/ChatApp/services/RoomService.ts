import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '../../../services/ConnectionService';

export type RoomCreatedCallback = (roomId: string) => void;
export type RoomJoinedCallback = (roomId: string) => void;
export type RoomLeftCallback = (roomId: string) => void;

export class RoomService {
    private client: SparkMessaging;
    private connectionService: ConnectionService;
    private unsubscribeCallbacks: Array<() => void> = [];
    private currentRoomRef: string | null = null;
    private joinedRooms: Set<string> = new Set();
    private roomList: Set<string> = new Set();

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

    public getRoomList(): string[] {
        return Array.from(this.roomList);
    }

    public onMessage(callback: (msg: any) => void): () => void {
        const unsubscribe = this.client.onMessage((msg: any) => {
            // room-created 타입 메시지 처리
            if (msg.type === 'room-created' || msg.type === 'room-list-update') {
                try {
                    const roomData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                    if (roomData.roomId) {
                        this.roomList.add(roomData.roomId);
                        callback(roomData.roomId);
                    }
                } catch (error) {
                    console.error('Failed to parse room data:', error);
                }
            }
            // room-empty 또는 room-deleted 타입 메시지 처리 (룸이 비어있을 때)
            if (msg.type === 'room-empty' || msg.type === 'room-deleted') {
                try {
                    const roomData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                    const roomId = roomData.roomId || roomData;
                    if (roomId && !this.joinedRooms.has(roomId)) {
                        // 참가 중이 아닌 룸이 비어있으면 목록에서 제거
                        this.roomList.delete(roomId);
                        callback(roomId);
                    }
                } catch (error) {
                    console.error('Failed to parse room empty data:', error);
                }
            }
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public onRoomJoined(callback: RoomJoinedCallback): () => void {
        const unsubscribe = this.client.onRoomJoined((roomId: string) => {
            this.joinedRooms.add(roomId);
            this.roomList.add(roomId);
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
            // 룸이 비어있으면 목록에서 제거
            // 참가 중인 룸이 아니면 목록에서 제거 (다른 사용자가 모두 나갔을 경우)
            if (!this.joinedRooms.has(roomId)) {
                this.roomList.delete(roomId);
            }
            callback(roomId);
        });
        this.unsubscribeCallbacks.push(unsubscribe);
        return unsubscribe;
    }

    public async createRoom(roomId: string): Promise<void> {
        const status = this.connectionService.getConnectionStatus();
        if (!status.isConnected) {
            throw new Error('서버에 연결되어 있지 않습니다.');
        }

        // roomList에 먼저 추가
        this.roomList.add(roomId);

        // 룸 참가
        await this.client.joinRoom(roomId);

        // 룸 생성 메시지 브로드캐스트
        await this.client.sendMessage(
            'room-created' as any,
            JSON.stringify({
                type: 'room-created',
                roomId,
            })
        );

        // handleRoomJoined에서 처리됨
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
        this.roomList.clear();
    }
}
