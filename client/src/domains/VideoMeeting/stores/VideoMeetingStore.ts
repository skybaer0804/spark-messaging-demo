import { signal, type Signal } from '@preact/signals';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { RoomService } from '../services/RoomService';
import { ParticipantService } from '../services/ParticipantService';
import { WebRTCService } from '../services/WebRTCService';
import { videoMeetingApi } from '@/core/api/ApiService';
import type { Room, Participant, UserRole, Category, ChatMessage } from '../types';

export interface ScheduledMeeting {
  _id: string;
  title: string;
  description?: string;
  scheduledAt: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  hostId: { _id: string; username: string };
  roomId?: string;
}

interface ToastFunctions {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

export class VideoMeetingStore {
  // ... existing signals ...
  // 연결 상태
  public readonly isConnected: Signal<boolean> = signal(false);

  // 예약된 회의 리스트
  public readonly scheduledMeetings: Signal<ScheduledMeeting[]> = signal([]);
  public readonly showScheduleModal: Signal<boolean> = signal(false);

  // 사용자 역할
  public readonly userRole: Signal<UserRole | null> = signal(null);

  // 룸 관련
  public readonly currentRoom: Signal<Room | null> = signal(null);
  public readonly roomList: Signal<Room[]> = signal([]);
  public readonly showCreateForm: Signal<boolean> = signal(false);
  public readonly selectedCategory: Signal<Category> = signal('회의');
  public readonly roomTitle: Signal<string> = signal('');

  // 참가자 관련
  public readonly participants: Signal<Participant[]> = signal([]);
  public readonly pendingRequests: Signal<Array<{ socketId: string; name: string }>> = signal([]);
  public readonly joinRequestStatus: Signal<'idle' | 'pending' | 'approved' | 'rejected'> = signal('idle');
  public readonly requestedRoomId: Signal<string | null> = signal(null);
  public readonly socketId: Signal<string | null> = signal(null);

  // 서비스 레퍼런스
  private connectionService: ConnectionService | null = null;
  private chatService: ChatService | null = null;
  private fileTransferService: FileTransferService | null = null;
  private roomService: RoomService | null = null;
  private participantService: ParticipantService | null = null;
  private webRTCService: WebRTCService | null = null;

  // ChatStore 참조 (메시지 수신 시 업데이트)
  private chatStore: { addMessage: (message: ChatMessage) => void; clearMessages: () => void } | null = null;
  private chatUnsubscribe: (() => void) | null = null;

  // Toast 기능 참조
  private toast: ToastFunctions | null = null;

  public setToast(toast: ToastFunctions) {
    this.toast = toast;
  }

  private showSuccess(message: string) {
    if (this.toast) this.toast.showSuccess(message);
    else console.log('SUCCESS:', message);
  }

  private showError(message: string) {
    if (this.toast) this.toast.showError(message);
    else console.error('ERROR:', message);
  }

  // ChatStore 설정
  public setChatStore(chatStore: { addMessage: (message: ChatMessage) => void; clearMessages: () => void }): void {
    this.chatStore = chatStore;
    // ChatStore가 설정된 후에 채팅 메시지 리스너 설정
    this.setupChatMessageListener();
  }

  // 채팅 메시지 리스너 설정
  private setupChatMessageListener() {
    // 기존 리스너가 있으면 제거
    if (this.chatUnsubscribe) {
      this.chatUnsubscribe();
      this.chatUnsubscribe = null;
    }

    // ChatService와 ChatStore가 모두 준비되었을 때만 리스너 설정
    if (this.chatService && this.chatStore) {
      console.log('[DEBUG] 채팅 메시지 리스너 설정');
      // ChatService의 onRoomMessage를 사용하여 메시지 수신
      this.chatUnsubscribe = this.chatService.onRoomMessage((message) => {
        if (!this.chatStore) return;

        console.log('[DEBUG] 채팅 메시지 수신:', message);

        // ChatService가 이미 ChatMessage 형태로 변환해주므로 그대로 사용
        const chatMessage: ChatMessage = {
          id: message.id,
          content: message.content,
          timestamp: message.timestamp,
          type: message.type,
          senderId: message.senderId,
          fileData: message.fileData,
        };
        this.chatStore.addMessage(chatMessage);
      });
    }
  }

  // 초기화
  public initialize() {
    this.connectionService = new ConnectionService(sparkMessagingClient);
    this.chatService = new ChatService(sparkMessagingClient, this.connectionService);
    this.fileTransferService = new FileTransferService(sparkMessagingClient, this.connectionService, this.chatService);
    this.roomService = new RoomService(sparkMessagingClient, this.connectionService);
    this.participantService = new ParticipantService(sparkMessagingClient, this.connectionService);
    this.webRTCService = new WebRTCService(sparkMessagingClient, this.connectionService);

    this.setupEventListeners();
    this.refreshScheduledMeetings();

    // 초기 연결 상태 확인
    const status = this.connectionService.getConnectionStatus();
    if (status.isConnected) {
      this.isConnected.value = true;
      if (status.socketId) {
        this.socketId.value = status.socketId;
        this.participantService.initializeUser(status.socketId);
      }
    }

    return {
      connectionService: this.connectionService,
      roomService: this.roomService,
      participantService: this.participantService,
    };
  }

  private setupEventListeners() {
    if (!this.connectionService || !this.roomService || !this.participantService) return;

    // 연결 상태 관리
    this.connectionService.onConnected((data) => {
      this.isConnected.value = true;
      this.socketId.value = data.socketId;
      this.participantService?.initializeUser(data.socketId);
    });

    this.connectionService.onConnectionStateChange((connected) => {
      this.isConnected.value = connected;
    });

    this.connectionService.onError((error) => {
      console.error('❌ Error:', error);
      this.isConnected.value = false;
    });

    // Room 관리
    this.roomService.onMessage(() => {
      this.roomList.value = [...this.roomService!.getRoomList()];
    });

    this.roomService.onRoomJoined(async (roomId) => {
      if (!this.roomService || !this.participantService || !this.connectionService) return;

      const room = this.roomService.getRoomList().find((r) => r.roomId === roomId);
      if (room) {
        this.currentRoom.value = room;
        this.roomService.setCurrentRoomRef(roomId);
        this.chatService?.setCurrentRoom(roomId);
        this.participantService.setCurrentRoomRef(roomId);
        this.webRTCService?.setCurrentRoomRef(roomId);

        // 채팅 메시지 초기화
        this.chatStore?.clearMessages();

        const status = this.connectionService.getConnectionStatus();
        const isMyRoom = this.roomService.getMyRooms().has(roomId);

        // 룸 소유자(수요자)인 경우 userRole 설정
        if (isMyRoom) {
          this.participantService.setUserRole('demander');
          this.userRole.value = 'demander';
        }

        const currentUserRole = this.participantService.getUserRole();
        if (status.socketId) {
          const myInfo =
            currentUserRole === 'demander'
              ? { name: '수요자', role: 'demander' as UserRole }
              : { name: '공급자', role: 'supplier' as UserRole };

          // 공급자가 참가 요청 후 룸에 입장한 경우는 참가자 목록에 추가하지 않음 (승인 전까지)
          // 수요자이거나 승인된 공급자만 참가자 목록에 추가
          if (currentUserRole === 'demander' || isMyRoom) {
            this.participantService.addParticipant({ socketId: status.socketId, ...myInfo });
            this.participants.value = [...this.participantService.getParticipants()];
            // user-joined 메시지 전송 (수요자만)
            await this.participantService.sendUserJoined(roomId, status.socketId, 1);
          }
        }
      }
    });

    this.roomService.onRoomLeft((roomId) => {
      if (this.currentRoom.value?.roomId === roomId) {
        this.currentRoom.value = null;
        this.participants.value = [];
        this.pendingRequests.value = [];
        this.participantService?.clear();
      }
    });

    // Participant 관리
    this.participantService.onRoomMessage({
      onJoinRequest: () => {
        this.pendingRequests.value = [...this.participantService!.getPendingRequests()];
      },
      onJoinApproved: async (socketId, roomId) => {
        if (!this.connectionService || !this.roomService) return;

        const status = this.connectionService.getConnectionStatus();
        if (socketId === status.socketId) {
          console.log('[DEBUG] 참가 승인됨 - 룸 입장 시작:', roomId);
          this.joinRequestStatus.value = 'approved';
          this.showSuccess('참가 요청이 승인되었습니다!');

          const targetRoomId = roomId || this.requestedRoomId.value;
          if (targetRoomId) {
            try {
              await this.roomService.joinRoom(targetRoomId);
              const approvedRoom = this.roomService.getRoomList().find((r) => r.roomId === targetRoomId);
              if (approvedRoom) {
                this.currentRoom.value = approvedRoom;
                this.userRole.value = 'supplier';
                this.joinRequestStatus.value = 'idle';
                this.requestedRoomId.value = null;
              }
            } catch (error) {
              console.error('[ERROR] 승인된 룸 입장 실패:', error);
            }
          }
        }
      },
      onJoinRejected: (socketId) => {
        if (!this.connectionService || !this.roomService) return;

        const status = this.connectionService.getConnectionStatus();
        if (socketId === status.socketId) {
          this.joinRequestStatus.value = 'rejected';
          this.requestedRoomId.value = null;
          this.showError('참가 요청이 거부되었습니다.');
          if (this.currentRoom.value) {
            this.roomService.leaveRoom(this.currentRoom.value.roomId);
          }
        }
      },
      onUserJoined: (participant) => {
        if (!this.participantService) return;

        const isApprovedSupplier =
          this.participantService.getPendingRequests().find((r) => r.socketId === participant.socketId) === undefined;
        if (isApprovedSupplier || this.userRole.value === 'demander') {
          this.participants.value = [...this.participantService.getParticipants()];
        }
      },
      onUserLeft: () => {
        this.participants.value = [...this.participantService!.getParticipants()];
      },
    });

    // Chat 메시지 리스너는 setChatStore()에서 설정됨

    // WebRTC 메시지 처리
    if (this.webRTCService) {
      const webRTCUnsubscribe = this.webRTCService.onRoomMessage({
        onStreamReceived: (socketId: string, stream: MediaStream) => {
          console.log('[DEBUG] Store에서 원격 스트림 수신:', {
            socketId,
            streamId: stream.id,
            active: stream.active,
            videoTracks: stream.getVideoTracks().length,
          });
          // 참가자 스트림 업데이트
          this.participantService?.updateParticipantStream(socketId, stream);
          this.participants.value = [...this.participantService!.getParticipants()];
          console.log('[DEBUG] 참가자 목록 업데이트 완료:', {
            participants: this.participants.value.length,
            updatedParticipant: socketId,
          });
        },
        onVideoStopped: (socketId: string) => {
          console.log('[DEBUG] Store에서 비디오 중지 수신:', socketId);
          // 참가자 비디오 상태 업데이트
          this.participantService?.updateParticipantVideoStatus(socketId, false);
          this.participants.value = [...this.participantService!.getParticipants()];
        },
      });
      (this as any).webRTCUnsubscribe = webRTCUnsubscribe;
    }
  }

  // 룸 생성
  public async createRoom(category: Category, title: string): Promise<Room | null> {
    if (!title.trim() || !this.isConnected.value || !this.roomService || !this.connectionService) {
      return null;
    }

    const status = this.connectionService.getConnectionStatus();
    if (!status.socketId) return null;

    try {
      const room = await this.roomService.createRoom(category, title, status.socketId);
      this.participantService?.setUserRole('demander');
      this.userRole.value = 'demander';
      this.showCreateForm.value = false;
      this.roomTitle.value = '';
      this.currentRoom.value = room;
      return room;
    } catch (error) {
      console.error('Failed to create room:', error);
      this.showError('룸 생성에 실패했습니다.');
      return null;
    }
  }

  // 룸 참가
  public async joinRoom(room: Room): Promise<void> {
    if (!this.isConnected.value || !this.roomService || !this.participantService) return;

    const isMyRoom = this.roomService.getMyRooms().has(room.roomId);

    if (this.roomService.getCurrentRoomRef() === room.roomId) {
      return;
    }

    // 승인된 상태면 바로 입장
    if (this.joinRequestStatus.value === 'approved' && !isMyRoom) {
      try {
        await this.roomService.joinRoom(room.roomId);
        this.currentRoom.value = room;
        this.userRole.value = 'supplier';
        this.joinRequestStatus.value = 'idle';
        return;
      } catch (error) {
        console.error('[ERROR] 승인된 룸 입장 실패:', error);
      }
    }

    // 내 룸이면 바로 입장
    if (isMyRoom) {
      try {
        await this.roomService.joinRoom(room.roomId);
        this.participantService.setUserRole('demander');
        this.userRole.value = 'demander';
        this.currentRoom.value = room;
        this.pendingRequests.value = [];
        this.joinRequestStatus.value = 'idle';
      } catch (error) {
        console.error('[ERROR] 룸 참가 실패:', error);
        this.showError('룸 참가에 실패했습니다.');
      }
    } else {
      // 공급자는 참가 요청만 보내고 룸에 입장하지 않음
      if (this.joinRequestStatus.value === 'idle' || this.joinRequestStatus.value === 'rejected') {
        try {
          this.joinRequestStatus.value = 'pending';
          this.requestedRoomId.value = room.roomId;
          await this.participantService.sendJoinRequest(room.roomId, room.category);
          this.userRole.value = 'supplier';
        } catch (error) {
          console.error('[ERROR] 참가 요청 실패:', error);
          this.showError('참가 요청에 실패했습니다.');
          this.joinRequestStatus.value = 'idle';
          this.requestedRoomId.value = null;
        }
      }
    }
  }

  // 참가 요청 승인
  public async approveRequest(requesterSocketId: string): Promise<void> {
    if (!this.currentRoom.value || !this.isConnected.value || !this.participantService) return;

    try {
      await this.participantService.approveRequest(this.currentRoom.value.roomId, requesterSocketId);
      this.participants.value = [...this.participantService.getParticipants()];
      this.pendingRequests.value = [...this.participantService.getPendingRequests()];
    } catch (error) {
      console.error('[ERROR] 승인 실패:', error);
    }
  }

  // 참가 요청 거부
  public async rejectRequest(requesterSocketId: string): Promise<void> {
    if (!this.currentRoom.value || !this.isConnected.value || !this.participantService) return;

    try {
      await this.participantService.rejectRequest(this.currentRoom.value.roomId, requesterSocketId);
      this.pendingRequests.value = [...this.participantService.getPendingRequests()];
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  }

  // 룸 나가기
  public async leaveRoom(): Promise<void> {
    if (!this.currentRoom.value || !this.isConnected.value || !this.roomService || !this.participantService) return;

    try {
      const currentParticipants = this.participants.value.length;
      const status = this.connectionService?.getConnectionStatus();
      if (status?.socketId) {
        await this.participantService.sendUserLeft(
          this.currentRoom.value.roomId,
          status.socketId,
          Math.max(0, currentParticipants - 1),
        );
      }

      await this.roomService.leaveRoom(this.currentRoom.value.roomId);
      this.currentRoom.value = null;
      this.userRole.value = null;
      this.participants.value = [];
      this.pendingRequests.value = [];
      this.joinRequestStatus.value = 'idle';
      this.requestedRoomId.value = null;
    } catch (error) {
      console.error('[ERROR] 룸 나가기 실패:', error);
    }
  }

  public async refreshScheduledMeetings() {
    try {
      const res = await videoMeetingApi.getMeetings();
      this.scheduledMeetings.value = res.data;
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
    }
  }

  public async scheduleMeeting(data: {
    title: string;
    description?: string;
    scheduledAt: string;
    invitedUsers?: string[];
    invitedOrgs?: string[];
  }) {
    try {
      await videoMeetingApi.createMeeting(data);
      await this.refreshScheduledMeetings();
      this.showScheduleModal.value = false;
      this.showSuccess('Meeting scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      this.showError('Failed to schedule meeting');
    }
  }

  // UI 상태 업데이트
  public setShowCreateForm(value: boolean): void {
    this.showCreateForm.value = value;
  }

  public setSelectedCategory(category: Category): void {
    this.selectedCategory.value = category;
  }

  public setRoomTitle(title: string): void {
    this.roomTitle.value = title;
  }

  // 서비스 접근자
  public getConnectionService(): ConnectionService | null {
    return this.connectionService;
  }

  public getChatService(): ChatService | null {
    return this.chatService;
  }

  public getFileTransferService(): FileTransferService | null {
    return this.fileTransferService;
  }

  public getRoomService(): RoomService | null {
    return this.roomService;
  }

  public getParticipantService(): ParticipantService | null {
    return this.participantService;
  }

  public getWebRTCService(): WebRTCService | null {
    return this.webRTCService;
  }

  public getMyRooms(): Set<string> {
    return this.roomService?.getMyRooms() || new Set();
  }

  public getSocketId(): string | null {
    return this.socketId.value;
  }

  public getSocketIdSignal(): Signal<string | null> {
    return this.socketId;
  }

  // 정리
  public cleanup(): void {
    if (this.chatUnsubscribe) {
      this.chatUnsubscribe();
      this.chatUnsubscribe = null;
    }
    if ((this as any).webRTCUnsubscribe) {
      (this as any).webRTCUnsubscribe();
    }
    this.connectionService?.cleanup();
    this.chatService?.cleanup();
    this.roomService?.cleanup();
    this.participantService?.cleanup();
    // WebRTCService는 별도 cleanup이 없으므로 스트림만 정리
    if (this.webRTCService) {
      this.webRTCService.stopLocalStream();
    }
  }
}
