import type SparkMessaging from '@skybaer0804/spark-messaging-client';
import { ConnectionService } from '../../../services/ConnectionService';
import type { Participant, UserRole } from '../types';
import { parseMessageContent } from '../../../utils/messageUtils';

export type ParticipantJoinedCallback = (participant: Participant) => void;
export type ParticipantLeftCallback = (socketId: string) => void;
export type JoinRequestCallback = (requester: { socketId: string; name: string }) => void;
export type JoinApprovedCallback = (socketId: string, roomId: string) => void;
export type JoinRejectedCallback = (socketId: string) => void;

export class ParticipantService {
    private client: SparkMessaging;
    private connectionService: ConnectionService;
    private unsubscribeCallbacks: Array<() => void> = [];
    private participants: Map<string, Participant> = new Map();
    private pendingRequests: Array<{ socketId: string; name: string }> = [];
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
        return [...this.pendingRequests];
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
        onJoinRequest?: JoinRequestCallback;
        onJoinApproved?: JoinApprovedCallback;
        onJoinRejected?: JoinRejectedCallback;
        onUserJoined?: ParticipantJoinedCallback;
        onUserLeft?: ParticipantLeftCallback;
    }): () => void {
        const unsubscribe = this.client.onRoomMessage((msg: any) => {
            const msgType = msg.type || (msg as any).type;
            const parsedContent = parseMessageContent(msg.content);
            const fromSocketId = (msg as any).from || msg.senderId;
            const status = this.connectionService.getConnectionStatus();
            const mySocketId = status.socketId;

            // join-approved, join-rejected, join-request는 룸에 입장하지 않아도 처리
            const isApprovalMessage = msgType === 'join-approved' || msgType === 'join-rejected';
            const isJoinRequestMessage = msgType === 'join-request';
            const isWebRTCMessage = msgType === 'webrtc-offer' || msgType === 'webrtc-answer' || msgType === 'ice-candidate';

            // join-request는 수요자가 룸에 있으면 받을 수 있도록 (currentRoomRef 체크)
            // join-approved, join-rejected는 룸에 입장하지 않아도 받을 수 있도록
            if (!isApprovalMessage && !isJoinRequestMessage && !isWebRTCMessage && msg.room !== this.currentRoomRef) {
                return;
            }

            switch (msgType) {
                case 'join-request':
                    console.log('[DEBUG] join-request 메시지 수신:', {
                        msgType,
                        userRole: this.userRole,
                        currentRoomRef: this.currentRoomRef,
                        msgRoom: msg.room,
                        fromSocketId,
                        mySocketId,
                    });
                    // 수요자가 룸에 있고, 요청이 해당 룸에 대한 것인지 확인
                    if (this.userRole === 'demander' && this.currentRoomRef && msg.room === this.currentRoomRef && callbacks.onJoinRequest) {
                        const requesterId = parsedContent?.from || fromSocketId;
                        const requesterName = this.mockUsers.get(requesterId)?.name || `사용자${requesterId.substring(0, 6)}`;
                        console.log('[DEBUG] 참가 요청 처리:', { requesterId, requesterName });
                        if (!this.pendingRequests.find((r) => r.socketId === requesterId)) {
                            this.pendingRequests.push({ socketId: requesterId, name: requesterName });
                            callbacks.onJoinRequest({ socketId: requesterId, name: requesterName });
                            console.log('[DEBUG] 참가 요청 콜백 호출 완료');
                        } else {
                            console.log('[DEBUG] 이미 처리된 참가 요청:', requesterId);
                        }
                    } else {
                        console.log('[DEBUG] 참가 요청 처리 조건 불일치:', {
                            isDemander: this.userRole === 'demander',
                            hasCurrentRoom: !!this.currentRoomRef,
                            roomMatch: msg.room === this.currentRoomRef,
                            hasCallback: !!callbacks.onJoinRequest,
                        });
                    }
                    break;

                case 'join-approved':
                    if (callbacks.onJoinApproved && mySocketId) {
                        const approvedTo = parsedContent?.to;
                        if (approvedTo === mySocketId) {
                            callbacks.onJoinApproved(mySocketId, msg.room);
                        }
                    }
                    break;

                case 'join-rejected':
                    if (callbacks.onJoinRejected && mySocketId) {
                        const rejectedTo = parsedContent?.to;
                        if (rejectedTo === mySocketId) {
                            callbacks.onJoinRejected(mySocketId);
                        }
                    }
                    break;

                case 'user-joined':
                    if (callbacks.onUserJoined) {
                        const joinedSocketId = parsedContent?.socketId || fromSocketId;
                        if (joinedSocketId && joinedSocketId !== mySocketId) {
                            const userInfo = this.mockUsers.get(joinedSocketId) || {
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

    public async sendJoinRequest(roomId: string, category: string): Promise<void> {
        const status = this.connectionService.getConnectionStatus();
        if (!status.socketId) {
            throw new Error('Socket ID가 없습니다.');
        }

        console.log('[DEBUG] 참가 요청 전송 시작:', { roomId, socketId: status.socketId, category });

        // 참가 요청을 보내기 위해 룸에 입장 (메시지를 보내기 위해 필요)
        // 승인 전까지는 룸에 머물러야 함
        const wasInRoom = this.currentRoomRef === roomId;
        if (!wasInRoom) {
            try {
                console.log('[DEBUG] 참가 요청을 위한 룸 입장:', roomId);
                await this.client.joinRoom(roomId);
                // 잠시 대기하여 룸 입장이 완료되도록 함
                await new Promise((resolve) => setTimeout(resolve, 200));
                this.currentRoomRef = roomId;
                console.log('[DEBUG] 룸 입장 완료');
            } catch (error) {
                console.error('[ERROR] 참가 요청을 위한 룸 입장 실패:', error);
                throw error;
            }
        }

        try {
            console.log('[DEBUG] 참가 요청 메시지 전송:', { roomId, type: 'join-request' });
            await this.client.sendRoomMessage(
                roomId,
                'join-request' as any,
                JSON.stringify({
                    from: status.socketId,
                    category,
                })
            );
            console.log('[DEBUG] 참가 요청 메시지 전송 완료');
            // 참가 요청 후 룸에 머물러 있음 (승인 대기)
        } catch (error) {
            console.error('[ERROR] 참가 요청 메시지 전송 실패:', error);
            // 실패 시 룸에서 나가기
            if (!wasInRoom) {
                try {
                    await this.client.leaveRoom(roomId);
                    this.currentRoomRef = null;
                } catch (leaveError) {
                    console.error('[ERROR] 룸 나가기 실패:', leaveError);
                }
            }
            throw error;
        }
    }

    public async approveRequest(roomId: string, requesterSocketId: string): Promise<void> {
        const status = this.connectionService.getConnectionStatus();
        if (!status.isConnected) {
            throw new Error('서버에 연결되어 있지 않습니다.');
        }

        // 참가자 목록에 추가
        const requesterName = this.mockUsers.get(requesterSocketId)?.name || `사용자${requesterSocketId.substring(0, 6)}`;
        const participant: Participant = {
            socketId: requesterSocketId,
            name: requesterName,
            role: 'supplier',
        };
        this.participants.set(requesterSocketId, participant);

        // 승인 메시지 전송
        await this.client.sendRoomMessage(
            roomId,
            'join-approved' as any,
            JSON.stringify({
                to: requesterSocketId,
                approved: true,
            })
        );

        // user-joined 메시지 전송
        const total = this.participants.size;
        await this.client.sendRoomMessage(
            roomId,
            'user-joined' as any,
            JSON.stringify({
                socketId: requesterSocketId,
                total,
            })
        );

        // 수요자 정보도 전송
        if (status.socketId) {
            await this.client.sendRoomMessage(
                roomId,
                'user-joined' as any,
                JSON.stringify({
                    socketId: status.socketId,
                    total,
                })
            );
        }

        // 대기 중인 요청에서 제거
        this.pendingRequests = this.pendingRequests.filter((r) => r.socketId !== requesterSocketId);
    }

    public async rejectRequest(roomId: string, requesterSocketId: string): Promise<void> {
        await this.client.sendRoomMessage(
            roomId,
            'join-rejected' as any,
            JSON.stringify({
                to: requesterSocketId,
                rejected: true,
            })
        );

        // 대기 중인 요청에서 제거
        this.pendingRequests = this.pendingRequests.filter((r) => r.socketId !== requesterSocketId);
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

    public async sendUserJoined(roomId: string, socketId: string, total: number): Promise<void> {
        if (!socketId) {
            throw new Error('Socket ID가 없습니다.');
        }
        return this.client.sendRoomMessage(
            roomId,
            'user-joined' as any,
            JSON.stringify({
                socketId,
                total,
            })
        );
    }

    public async sendUserLeft(roomId: string, socketId: string, total: number): Promise<void> {
        if (!socketId) {
            throw new Error('Socket ID가 없습니다.');
        }
        return this.client.sendRoomMessage(
            roomId,
            'user-left' as any,
            JSON.stringify({
                socketId,
                total,
            })
        );
    }

    public clear() {
        this.participants.clear();
        this.pendingRequests = [];
    }

    public cleanup() {
        this.unsubscribeCallbacks.forEach((unsubscribe) => unsubscribe());
        this.unsubscribeCallbacks = [];
        this.participants.clear();
        this.pendingRequests = [];
        this.currentRoomRef = null;
    }
}
