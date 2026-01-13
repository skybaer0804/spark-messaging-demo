import { signal, type Signal } from '@preact/signals';
import sparkMessagingClient, { MEETING_CONFIG } from '../../../config/sparkMessaging';
import { ConnectionService } from '@/core/socket/ConnectionService';
import { ChatService } from '@/core/socket/ChatService';
import { FileTransferService } from '@/core/api/FileTransferService';
import { RoomService } from '../services/RoomService';
import { ParticipantService } from '../services/ParticipantService';
import { WebRTCService } from '../services/WebRTCService';
import { VideoStore } from './VideoStore';
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
  joinHash: string;
  isPrivate: boolean;
  isReserved: boolean;
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

  // 로컬 미디어 상태
  public readonly isLocalVideoEnabled: Signal<boolean> = signal(false);
  public readonly isLocalAudioEnabled: Signal<boolean> = signal(false);

  // 서비스 레퍼런스
  private connectionService: ConnectionService | null = null;
  private chatService: ChatService | null = null;
  private fileTransferService: FileTransferService | null = null;
  private roomService: RoomService | null = null;
  private participantService: ParticipantService | null = null;
  private webRTCService: WebRTCService | null = null;

  private chatStore: { addMessage: (message: ChatMessage) => void; clearMessages: () => void } | null = null;
  private chatUnsubscribe: (() => void) | null = null;
  private videoStore: VideoStore | null = null;

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

  // VideoStore 설정
  public setVideoStore(videoStore: VideoStore): void {
    this.videoStore = videoStore;
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
          id: message._id,
          content: message.content,
          timestamp: message.timestamp.getTime(),
          type: message.type === 'file' ? 'file-transfer' : 'chat',
          senderId: message.senderId,
          senderName: message.senderName, // v2.4.0: 이름 필드 추가
          fileData: message.fileData,
        };
        this.chatStore.addMessage(chatMessage);
      });
    }
  }

  // 초기화
  public initialize() {
    this.connectionService = new ConnectionService(sparkMessagingClient);
    this.chatService = new ChatService(sparkMessagingClient);
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
            // user-joined 메시지 전송 (내 정보를 다른 사람들에게 알림)
            await this.participantService.sendUserJoined(roomId, status.socketId, 1);
          } else {
            // 공급자 등 일반 참가자는 입장 후 기존 참가자 목록 요청
            await this.participantService.requestParticipants(roomId);
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

    // 룸 폭파 알림 처리
    sparkMessagingClient.onMessage((msg: any) => {
      if (msg.type === 'room-destroyed') {
        const content = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
        if (content.roomId === this.currentRoom.value?.roomId) {
          this.showError('방장이 방을 종료했습니다.');
          this.leaveRoom();
        }
      }
    });

    // Participant 관리
    this.participantService.onRoomMessage({
      onUserJoined: (participant) => {
        if (!this.participantService) return;
        console.log('[DEBUG] 사용자 입장:', participant.socketId);

        // 기존 참가자 목록 업데이트
        this.participants.value = [...this.participantService.getParticipants()];

        // 새로운 사용자가 들어오면 WebRTC 연결 시작 (내가 이미 스트림을 가지고 있는 경우에만)
        if (this.webRTCService?.getLocalStream()) {
          console.log('[DEBUG] 새 사용자에게 WebRTC 연결 시도:', participant.socketId);
          this.webRTCService.createPeerConnection(participant.socketId, true);
        }
      },
      onUserLeft: (socketId) => {
        if (!this.participantService) return;
        console.log('[DEBUG] 사용자 퇴장:', socketId);
        this.webRTCService?.removePeerConnection(socketId);
        this.participants.value = [...this.participantService.getParticipants()];
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

    // 인원 제한 확인 (v2.4.0: 2명 제한 커스텀 메시지 적용)
    const currentParticipantsCount = room.participants || 0;
    if (currentParticipantsCount >= MEETING_CONFIG.MAX_PARTICIPANTS) {
      this.showError(`이미 방에 참여자가 꽉 찼습니다. (${MEETING_CONFIG.MAX_PARTICIPANTS}명 제한)`);
      return;
    }

    const isMyRoom = this.roomService.getMyRooms().has(room.roomId);

    if (this.roomService.getCurrentRoomRef() === room.roomId) {
      return;
    }

    try {
      // 모든 사용자가 즉시 입장 (허락 로직 제거)
      await this.roomService.joinRoom(room.roomId);
      this.currentRoom.value = room;

      if (isMyRoom) {
        this.participantService.setUserRole('demander');
        this.userRole.value = 'demander';
      } else {
        this.participantService.setUserRole('supplier');
        this.userRole.value = 'supplier';
      }

      this.pendingRequests.value = [];
      this.joinRequestStatus.value = 'idle';
    } catch (error) {
      console.error('[ERROR] 룸 참가 실패:', error);
      this.showError('룸 참가에 실패했습니다.');
    }
  }

  // 게스트 입장 로직
  public async joinAsGuest(hash: string, nickname: string): Promise<void> {
    if (!this.isConnected.value || !this.roomService || !this.participantService) return;

    try {
      const res = await videoMeetingApi.getMeetingByHash(hash);
      const meeting = res.data;

      if (!meeting.roomId) {
        this.showError('유효하지 않은 회의실입니다.');
        return;
      }

      // 게스트 전용 역할 설정
      this.userRole.value = 'guest' as any;

      await this.roomService.joinRoom(meeting.roomId);

      const room: Room = {
        roomId: meeting.roomId,
        title: meeting.title,
        category: '회의',
        hostSocketId: '',
        participants: 0,
        createdAt: Date.now(),
      };
      this.currentRoom.value = room;

      this.showSuccess(`${nickname}님, 환영합니다!`);
    } catch (error) {
      console.error('[Guest] Join failed:', error);
      this.showError('회의 참여에 실패했습니다.');
    }
  }

  // 참가 요청 승인
  public async approveRequest(requesterSocketId: string): Promise<void> {
    if (!this.currentRoom.value || !this.isConnected.value || !this.participantService) return;

    // 인원 제한 확인
    if (this.participants.value.length >= MEETING_CONFIG.MAX_PARTICIPANTS) {
      this.showError(`최대 인원(${MEETING_CONFIG.MAX_PARTICIPANTS}명)을 초과하여 승인할 수 없습니다.`);
      return;
    }

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

      // 로컬 스트림 정리
      if (this.webRTCService) {
        this.webRTCService.stopLocalStream();
      }
    } catch (error) {
      console.error('[ERROR] 룸 나가기 실패:', error);
    }
  }

  // 방 폭파 (방장 전용)
  public async destroyRoom(): Promise<void> {
    if (!this.currentRoom.value || !this.isConnected.value || !this.roomService) return;

    try {
      const roomId = this.currentRoom.value.roomId;

      // 1. 백엔드 DB에서 회의 삭제 (ID가 있다면)
      // currentRoom에는 DB ID가 없을 수 있으므로 roomId로 조회하거나
      // scheduledMeetings에서 찾아야 할 수도 있음.
      // 하지만 여기서는 간단히 roomId 기반으로 처리하거나 skip 가능
      // 여기서는 roomId가 DB의 _id인 경우가 많음 (createRoom 참고)

      await videoMeetingApi.deleteMeeting(roomId).catch((err) => {
        console.warn('DB meeting delete failed (might be a direct room):', err);
      });

      // 2. 룸 파괴 메시지 브로드캐스트
      if (this.connectionService) {
        await sparkMessagingClient.sendMessage('room-destroyed' as any, JSON.stringify({ roomId }));
      }

      await this.leaveRoom();
      this.showSuccess('방을 폭파했습니다.');
    } catch (error) {
      console.error('[ERROR] 방 폭파 실패:', error);
      this.showError('방 폭파에 실패했습니다.');
    }
  }

  // 비디오 토글
  public async toggleVideo(): Promise<void> {
    if (!this.webRTCService || !this.videoStore) return;

    const isVideoEnabled = this.videoStore.isVideoEnabled.value;
    if (isVideoEnabled) {
      this.webRTCService.stopLocalStream();
      this.videoStore.setLocalStream(null);
      this.isLocalVideoEnabled.value = false;
      this.isLocalAudioEnabled.value = false;

      // 다른 사람들에게 비디오 중지 알림
      if (this.currentRoom.value) {
        await this.webRTCService.sendVideoStopped(this.currentRoom.value.roomId);
      }
    } else {
      try {
        const stream = await this.webRTCService.startLocalStream();
        this.videoStore.setLocalStream(stream);
        this.isLocalVideoEnabled.value = true;
        this.isLocalAudioEnabled.value = true;

        // 새로 시작하면 기존 참가자들과 연결 시도
        if (this.currentRoom.value) {
          this.participants.value.forEach((p) => {
            if (p.socketId !== this.socketId.value) {
              this.webRTCService?.createPeerConnection(p.socketId, true);
            }
          });
        }
      } catch (error) {
        console.error('Failed to start video:', error);
        this.showError('카메라를 시작할 수 없습니다.');
      }
    }
  }

  // 오디오 토글
  public async toggleAudio(): Promise<void> {
    const stream = this.webRTCService?.getLocalStream();
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.isLocalAudioEnabled.value = audioTrack.enabled;
        this.showSuccess(audioTrack.enabled ? '마이크가 켜졌습니다.' : '마이크가 꺼졌습니다.');
      }
    }
  }

  public async refreshScheduledMeetings() {
    // 게스트이거나 인증되지 않은 경우 호출하지 않음
    const token = localStorage.getItem('token');
    if (!token) return;

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
    invitedWorkspaces?: string[];
    isReserved?: boolean;
    isPrivate?: boolean;
    password?: string;
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
