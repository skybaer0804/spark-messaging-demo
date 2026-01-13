import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '@/core/socket/ConnectionService';
import type { Participant, UserRole } from '../types';
import { parseMessageContent } from '@/core/utils/messageUtils';

export type ParticipantJoinedCallback = (participant: Participant) => void;
export type ParticipantLeftCallback = (socketId: string) => void;

export class ParticipantService {
  private client: SparkMessaging;
  private connectionService: ConnectionService;
  private unsubscribeCallbacks: Array<() => void> = [];
  private participants: Map<string, Participant> = new Map();
  private mockUsers: Map<string, { name: string; role: UserRole }> = new Map();
  private currentRoomRef: string | null = null;
  private userRole: UserRole | null = null;

  constructor(client: SparkMessaging, connectionService: ConnectionService) {
    this.client = client;
    this.connectionService = connectionService;
  }

  public setCurrentRoomRef(roomId: string | null) {
    this.currentRoomRef = roomId;
  }

  public setUserRole(role: UserRole | null) {
    this.userRole = role;
  }

  public getUserRole(): UserRole | null {
    return this.userRole;
  }

  public getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  public getPendingRequests(): Array<{ socketId: string; name: string }> {
    // 임시 구현: 실제로는 서버로부터 요청 목록을 받아와야 함
    return [];
  }

  public async approveRequest(_roomId: string, _requesterSocketId: string): Promise<void> {
    // 임시 구현: 서버에 승인 메시지 전송 로직 필요
  }

  public async rejectRequest(_roomId: string, _requesterSocketId: string): Promise<void> {
    // 임시 구현: 서버에 거절 메시지 전송 로직 필요
  }

  public initializeUser(socketId: string, name?: string, role?: UserRole) {
    if (!this.mockUsers.has(socketId)) {
      this.mockUsers.set(socketId, {
        name: name || `사용자${socketId.substring(0, 6)}`,
        role: role || 'supplier',
      });
    }
  }

  public onRoomMessage(callbacks: {
    onUserJoined?: ParticipantJoinedCallback;
    onUserLeft?: ParticipantLeftCallback;
  }): () => void {
    const unsubscribe = this.client.onRoomMessage((msg: any) => {
      const msgType = msg.type || (msg as any).type;
      const parsedContent = parseMessageContent(msg.content);
      const fromSocketId = (msg as any).from || msg.senderId;
      const status = this.connectionService.getConnectionStatus();
      const mySocketId = status.socketId;

      const isWebRTCMessage = msgType === 'webrtc-offer' || msgType === 'webrtc-answer' || msgType === 'ice-candidate';

      if (!isWebRTCMessage && msg.room !== this.currentRoomRef) {
        return;
      }

      switch (msgType) {
        case 'user-joined':
          if (callbacks.onUserJoined) {
            const joinedSocketId = parsedContent?.socketId || fromSocketId;
            if (joinedSocketId && mySocketId && joinedSocketId !== mySocketId) {
              const userInfo = parsedContent?.userInfo ||
                this.mockUsers.get(joinedSocketId) || {
                  name: `사용자${joinedSocketId.substring(0, 6)}`,
                  role: 'supplier' as UserRole,
                };
              const participant: Participant = {
                socketId: joinedSocketId,
                ...userInfo,
              };
              this.participants.set(joinedSocketId, participant);
              callbacks.onUserJoined(participant);
            }
          }
          break;

        case 'request-participants':
          // 내가 수요자(호스트)인 경우 현재 참가자 목록을 응답
          if (this.userRole === 'demander' && fromSocketId !== mySocketId) {
            this.sendParticipantsList(fromSocketId);
          }
          break;

        case 'participants-list':
          // 호스트로부터 참가자 목록을 수신
          if (parsedContent?.to === mySocketId && parsedContent?.participants) {
            console.log('[DEBUG] 참가자 목록 수신:', parsedContent.participants);
            parsedContent.participants.forEach((p: Participant) => {
              // 내 소켓 ID가 확실히 정의되어 있고, 목록의 ID와 다를 때만 추가
              if (mySocketId && p.socketId !== mySocketId) {
                this.participants.set(p.socketId, p);
                if (callbacks.onUserJoined) {
                  callbacks.onUserJoined(p);
                }
              }
            });
          }
          break;

        case 'user-left':
          if (callbacks.onUserLeft) {
            const leftSocketId = parsedContent?.socketId || fromSocketId;
            if (leftSocketId) {
              this.participants.delete(leftSocketId);
              callbacks.onUserLeft(leftSocketId);
            }
          }
          break;
      }
    });
    this.unsubscribeCallbacks.push(unsubscribe);
    return unsubscribe;
  }

  public addParticipant(participant: Participant) {
    this.participants.set(participant.socketId, participant);
  }

  public removeParticipant(socketId: string) {
    this.participants.delete(socketId);
  }

  public updateParticipantStream(socketId: string, stream: MediaStream | null) {
    const participant = this.participants.get(socketId);
    if (participant) {
      if (stream) {
        participant.stream = stream;
        participant.isVideoEnabled = true;
      } else {
        participant.stream = undefined;
        participant.isVideoEnabled = false;
      }
      this.participants.set(socketId, participant);
    }
  }

  public updateParticipantVideoStatus(socketId: string, isVideoEnabled: boolean) {
    const participant = this.participants.get(socketId);
    if (participant) {
      participant.isVideoEnabled = isVideoEnabled;
      if (!isVideoEnabled) {
        participant.stream = undefined;
      }
      this.participants.set(socketId, participant);
    }
  }

  public async requestParticipants(roomId: string) {
    await this.client.sendRoomMessage(roomId, 'request-participants' as any, JSON.stringify({}));
  }

  private async sendParticipantsList(targetSocketId: string) {
    if (!this.currentRoomRef) return;

    const participants = Array.from(this.participants.values());
    await this.client.sendRoomMessage(
      this.currentRoomRef,
      'participants-list' as any,
      JSON.stringify({
        to: targetSocketId,
        participants: participants.map((p) => ({
          socketId: p.socketId,
          name: p.name,
          role: p.role,
          isVideoEnabled: p.isVideoEnabled,
        })),
      }),
    );
  }

  // 이제 백엔드에서 자동 처리하므로 명시적 호출 불필요
  public async sendUserJoined(roomId: string, socketId: string, _total: number): Promise<void> {
    const userInfo = this.mockUsers.get(socketId) || {
      name: `사용자${socketId.substring(0, 6)}`,
      role: 'supplier' as UserRole,
    };

    await this.client.sendRoomMessage(
      roomId,
      'user-joined' as any,
      JSON.stringify({
        socketId,
        userInfo,
        timestamp: Date.now(),
      }),
    );
  }

  public async sendUserLeft(_roomId: string, _socketId: string, _total: number): Promise<void> {
    // 레거시 지원을 위해 빈 함수로 유지하거나 제거
  }

  public clear() {
    this.participants.clear();
  }

  public cleanup() {
    this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
    this.unsubscribeCallbacks = [];
    this.participants.clear();
    this.currentRoomRef = null;
  }
}
