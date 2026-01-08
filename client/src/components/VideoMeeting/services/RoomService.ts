import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '../../../services/ConnectionService';
import { chatApi } from '../../../services/ApiService';
import type { Room, Category } from '../types';

export type RoomCreatedCallback = (room: Room) => void;
export type RoomJoinedCallback = (roomId: string) => void;
export type RoomLeftCallback = (roomId: string) => void;

export class RoomService {
  private client: SparkMessaging;
  private connectionService: ConnectionService;
  private unsubscribeCallbacks: Array<() => void> = [];
  private roomList: Room[] = [];
  private myRooms: Set<string> = new Set();
  private currentRoomRef: string | null = null;

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
  }

  public getRoomList(): Room[] {
    return [...this.roomList];
  }

  public getMyRooms(): Set<string> {
    return new Set(this.myRooms);
  }

  public getCurrentRoomRef(): string | null {
    return this.currentRoomRef;
  }

  public setCurrentRoomRef(roomId: string | null) {
    this.currentRoomRef = roomId;
  }

  public onMessage(callback: (msg: any) => void): () => void {
    const unsubscribe = this.client.onMessage((msg: any) => {
      // room-created 타입 메시지 처리
      if (msg.type === 'room-created' || msg.type === 'room-list-update') {
        try {
          const roomData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
          if (roomData.roomId) {
            const newRoom: Room = {
              roomId: roomData.roomId,
              category: roomData.category || '인테리어',
              title: roomData.title || '',
              participants: roomData.participants || 1,
              creatorId: roomData.creatorId || msg.from,
              createdAt: roomData.createdAt || Date.now(),
            };

            const existingIndex = this.roomList.findIndex((r) => r.roomId === newRoom.roomId);
            if (existingIndex >= 0) {
              this.roomList[existingIndex] = newRoom;
            } else {
              this.roomList.push(newRoom);
            }
            callback(newRoom);
          }
        } catch (error) {
          console.error('Failed to parse room data:', error);
        }
      }
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public onRoomJoined(callback: RoomJoinedCallback): () => void {
    const unsubscribe = this.client.onRoomJoined((roomId: string) => {
      this.currentRoomRef = roomId;
      callback(roomId);
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public onRoomLeft(callback: RoomLeftCallback): () => void {
    const unsubscribe = this.client.onRoomLeft((roomId: string) => {
      if (this.currentRoomRef === roomId) {
        this.currentRoomRef = null;
      }
      callback(roomId);
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public async createRoom(category: Category, title: string, creatorId: string): Promise<Room> {
    const status = this.connectionService.getConnectionStatus();
    if (!status.isConnected) {
      throw new Error('서버에 연결되어 있지 않습니다.');
    }

    // v2.0.0: 백엔드 API를 통해 DB에 방 생성
    const response = await chatApi.createRoom({
      name: title.trim(),
      isGroup: true,
    });

    const dbRoom = response.data;
    const roomId = dbRoom._id;

    const roomData: Room = {
      roomId,
      category,
      title: title.trim(),
      participants: 1,
      creatorId,
      createdAt: Date.now(),
    };

    // roomList에 먼저 추가
    this.roomList.push(roomData);

    // 룸 참가
    await this.client.joinRoom(roomId);

    // 룸 생성 메시지 브로드캐스트
    await this.client.sendMessage(
      'room-created' as any,
      JSON.stringify({
        type: 'room-created',
        ...roomData,
      }),
    );

    // 내 룸 목록에 추가
    this.myRooms.add(roomId);
    this.currentRoomRef = roomId;

    return roomData;
  }

  public async joinRoom(roomId: string): Promise<void> {
    const status = this.connectionService.getConnectionStatus();
    if (!status.isConnected) {
      throw new Error('서버에 연결되어 있지 않습니다.');
    }

    if (this.currentRoomRef === roomId) {
      return; // 이미 룸에 있으면 중복 참가 방지
    }

    await this.client.joinRoom(roomId);
    // handleRoomJoined에서 처리됨
  }

  public async leaveRoom(roomId: string): Promise<void> {
    const status = this.connectionService.getConnectionStatus();
    if (!status.isConnected) {
      return;
    }

    await this.client.leaveRoom(roomId);
    // handleRoomLeft에서 처리됨
  }

  public updateRoomParticipants(roomId: string, participants: number) {
    const room = this.roomList.find((r) => r.roomId === roomId);
    if (room) {
      room.participants = participants;
    }
  }

  public cleanup() {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.currentRoomRef = null;
    this.myRooms.clear();
    this.roomList = [];
  }
}
