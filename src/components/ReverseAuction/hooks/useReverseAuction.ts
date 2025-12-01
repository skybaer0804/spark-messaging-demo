import { useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { ChatService } from '../../../services/ChatService';
import { RoomService } from '../services/RoomService';
import { ParticipantService } from '../services/ParticipantService';
import { WebRTCService } from '../services/WebRTCService';
import type { Room, ChatMessage, Participant, UserRole, Category } from '../types';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import type { RoomMessageData } from '@skybaer0804/spark-messaging-client';

export function useReverseAuction() {
    const [isConnected, setIsConnected] = useState(false);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [roomList, setRoomList] = useState<Room[]>([]);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category>('인테리어');
    const [roomTitle, setRoomTitle] = useState('');
    const [pendingRequests, setPendingRequests] = useState<Array<{ socketId: string; name: string }>>([]);
    const [joinRequestStatus, setJoinRequestStatus] = useState<'idle' | 'pending' | 'approved' | 'rejected'>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);

    const connectionServiceRef = useRef<ConnectionService | null>(null);
    const chatServiceRef = useRef<ChatService | null>(null);
    const roomServiceRef = useRef<RoomService | null>(null);
    const participantServiceRef = useRef<ParticipantService | null>(null);
    const webRTCServiceRef = useRef<WebRTCService | null>(null);

    useEffect(() => {
        const connectionService = new ConnectionService(sparkMessagingClient);
        const chatService = new ChatService(sparkMessagingClient, connectionService);
        const roomService = new RoomService(sparkMessagingClient, connectionService);
        const participantService = new ParticipantService(sparkMessagingClient, connectionService);
        const webRTCService = new WebRTCService(sparkMessagingClient, connectionService);

        connectionServiceRef.current = connectionService;
        chatServiceRef.current = chatService;
        roomServiceRef.current = roomService;
        participantServiceRef.current = participantService;
        webRTCServiceRef.current = webRTCService;

        // 연결 상태 관리
        connectionService.onConnected((data) => {
            setIsConnected(true);
            participantService.initializeUser(data.socketId);
        });

        connectionService.onConnectionStateChange((connected) => {
            setIsConnected(connected);
        });

        connectionService.onError((error) => {
            console.error('❌ Error:', error);
            setIsConnected(false);
        });

        // Room 관리
        roomService.onMessage(() => {
            setRoomList([...roomService.getRoomList()]);
        });

        roomService.onRoomJoined(async (roomId) => {
            const room = roomService.getRoomList().find((r) => r.roomId === roomId);
            if (room) {
                setCurrentRoom(room);
                roomService.setCurrentRoomRef(roomId);
                chatService.setCurrentRoom(roomId);
                participantService.setCurrentRoomRef(roomId);
                webRTCService.setCurrentRoomRef(roomId);
                setChatMessages([]);

                const status = connectionService.getConnectionStatus();
                const currentUserRole = participantService.getUserRole();
                if (status.socketId) {
                    const myInfo =
                        currentUserRole === 'demander' ? { name: '수요자', role: 'demander' as UserRole } : { name: '공급자', role: 'supplier' as UserRole };
                    participantService.addParticipant({ socketId: status.socketId, ...myInfo });
                    setParticipants([...participantService.getParticipants()]);

                    // user-joined 메시지 전송
                    if (currentUserRole === 'demander' || roomService.getMyRooms().has(roomId)) {
                        await participantService.sendUserJoined(roomId, status.socketId, 1);
                    }
                }
            }
        });

        roomService.onRoomLeft((roomId) => {
            if (currentRoom?.roomId === roomId) {
                setCurrentRoom(null);
                setChatMessages([]);
                setParticipants([]);
                setPendingRequests([]);
                participantService.clear();
                webRTCService.stopLocalStream();
            }
        });

        // Participant 관리
        participantService.onRoomMessage({
            onJoinRequest: (requester) => {
                setPendingRequests(participantService.getPendingRequests());
            },
            onJoinApproved: async (socketId) => {
                const status = connectionService.getConnectionStatus();
                if (socketId === status.socketId) {
                    setJoinRequestStatus('approved');
                    const roomId = roomService.getCurrentRoomRef();
                    if (roomId) {
                        await roomService.joinRoom(roomId);
                    }
                }
            },
            onJoinRejected: (socketId) => {
                const status = connectionService.getConnectionStatus();
                if (socketId === status.socketId) {
                    setJoinRequestStatus('rejected');
                    alert('참가 요청이 거부되었습니다.');
                    if (currentRoom) {
                        roomService.leaveRoom(currentRoom.roomId);
                    }
                }
            },
            onUserJoined: (participant) => {
                setParticipants([...participantService.getParticipants()]);
                if (isVideoEnabled && webRTCService.getLocalStream()) {
                    setTimeout(() => {
                        webRTCService.createPeerConnection(participant.socketId, true).catch(console.error);
                    }, 500);
                }
            },
            onUserLeft: (socketId) => {
                setParticipants([...participantService.getParticipants()]);
            },
        });

        // Chat 메시지 - Room 메시지에서 chat 타입만 필터링
        // 실제로는 client.onRoomMessage를 직접 사용하여 타입 필터링
        const chatUnsubscribe = sparkMessagingClient.onRoomMessage((msg: RoomMessageData) => {
            // 현재 Room의 메시지만 처리
            if (msg.room !== roomService.getCurrentRoomRef()) {
                return;
            }

            // chat 타입만 처리
            const msgType = msg.type || (msg as any).type;
            if (msgType !== 'chat') {
                return;
            }

            const status = connectionService.getConnectionStatus();
            const isOwnMessage = msg.senderId === status.socketId || (msg as any).from === status.socketId;
            const chatMessage: ChatMessage = {
                id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                content: msg.content,
                timestamp: new Date(msg.timestamp || Date.now()),
                type: isOwnMessage ? 'sent' : 'received',
                senderId: (msg as any).from || msg.senderId,
            };
            setChatMessages((prev) => [...prev, chatMessage]);
        });

        // WebRTC 메시지
        webRTCService.onRoomMessage({
            onStreamReceived: (socketId, stream) => {
                participantService.updateParticipantStream(socketId, stream);
                setParticipants(participantService.getParticipants());
            },
        });

        // 초기 연결 상태 확인
        const status = connectionService.getConnectionStatus();
        if (status.isConnected) {
            setIsConnected(true);
            if (status.socketId) {
                participantService.initializeUser(status.socketId);
            }
        }

        return () => {
            chatUnsubscribe();
            connectionService.cleanup();
            chatService.cleanup();
            roomService.cleanup();
            participantService.cleanup();
            webRTCService.cleanup();
        };
    }, []);

    // 룸 생성
    const handleCreateRoom = async () => {
        if (!roomTitle.trim() || !isConnected || !roomServiceRef.current || !connectionServiceRef.current) return;

        const status = connectionServiceRef.current.getConnectionStatus();
        if (!status.socketId) return;

        try {
            const room = await roomServiceRef.current.createRoom(selectedCategory, roomTitle, status.socketId);
            setUserRole('demander');
            setShowCreateForm(false);
            setRoomTitle('');
            setCurrentRoom(room);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('룸 생성에 실패했습니다.');
        }
    };

    // 룸 참가
    const handleJoinRoom = async (room: Room) => {
        if (!isConnected || !roomServiceRef.current || !participantServiceRef.current) return;

        const isMyRoom = roomServiceRef.current.getMyRooms().has(room.roomId);

        if (roomServiceRef.current.getCurrentRoomRef() === room.roomId) {
            return;
        }

        if (joinRequestStatus === 'approved' && !isMyRoom) {
            try {
                await roomServiceRef.current.joinRoom(room.roomId);
                setCurrentRoom(room);
                setChatMessages([]);
                setParticipants([]);
                setUserRole('supplier');
                return;
            } catch (error) {
                console.error('[ERROR] 승인된 룸 입장 실패:', error);
            }
        }

        try {
            await roomServiceRef.current.joinRoom(room.roomId);

            if (isMyRoom) {
                setUserRole('demander');
                setCurrentRoom(room);
                setChatMessages([]);
                setParticipants([]);
                setPendingRequests([]);
                setJoinRequestStatus('idle');
            } else {
                if (joinRequestStatus === 'idle' || joinRequestStatus === 'rejected') {
                    setJoinRequestStatus('pending');
                    await participantServiceRef.current.sendJoinRequest(room.roomId, room.category);
                }
                setUserRole('supplier');
            }
        } catch (error) {
            console.error('[ERROR] 룸 참가 실패:', error);
            alert('룸 참가에 실패했습니다.');
            setJoinRequestStatus('idle');
        }
    };

    // 참가 요청 승인
    const handleApproveRequest = async (requesterSocketId: string) => {
        if (!currentRoom || !isConnected || !participantServiceRef.current) return;

        try {
            await participantServiceRef.current.approveRequest(currentRoom.roomId, requesterSocketId);
            setParticipants([...participantServiceRef.current.getParticipants()]);
            setPendingRequests([...participantServiceRef.current.getPendingRequests()]);

            if (isVideoEnabled && webRTCServiceRef.current?.getLocalStream()) {
                setTimeout(() => {
                    webRTCServiceRef.current?.createPeerConnection(requesterSocketId, true);
                }, 500);
            }
        } catch (error) {
            console.error('[ERROR] 승인 실패:', error);
        }
    };

    // 참가 요청 거부
    const handleRejectRequest = async (requesterSocketId: string) => {
        if (!currentRoom || !isConnected || !participantServiceRef.current) return;

        try {
            await participantServiceRef.current.rejectRequest(currentRoom.roomId, requesterSocketId);
            setPendingRequests([...participantServiceRef.current.getPendingRequests()]);
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    };

    // 룸 나가기
    const handleLeaveRoom = async () => {
        if (!currentRoom || !isConnected || !roomServiceRef.current || !participantServiceRef.current) return;

        try {
            const currentParticipants = participants.length;
            const status = connectionServiceRef.current?.getConnectionStatus();
            if (status?.socketId) {
                await participantServiceRef.current.sendUserLeft(currentRoom.roomId, status.socketId, Math.max(0, currentParticipants - 1));
            }

            await roomServiceRef.current.leaveRoom(currentRoom.roomId);
            webRTCServiceRef.current?.stopLocalStream();
            setCurrentRoom(null);
            setUserRole(null);
            setChatMessages([]);
            setParticipants([]);
            setPendingRequests([]);
        } catch (error) {
            console.error('[ERROR] 룸 나가기 실패:', error);
        }
    };

    // 채팅 메시지 전송
    const handleSendChat = async () => {
        if (!chatInput.trim() || !currentRoom || !isConnected || !chatServiceRef.current) return;

        try {
            await chatServiceRef.current.sendRoomMessage(currentRoom.roomId, 'chat', chatInput.trim());
            setChatInput('');
        } catch (error) {
            console.error('Failed to send chat:', error);
        }
    };

    // WebRTC: 로컬 스트림 시작
    const startLocalStream = async () => {
        if (!webRTCServiceRef.current) return;

        try {
            const stream = await webRTCServiceRef.current.startLocalStream();
            setLocalStream(stream);
            setIsVideoEnabled(true);

            const roomId = currentRoom?.roomId || roomServiceRef.current?.getCurrentRoomRef();
            if (roomId && participants.length > 0) {
                participants.forEach((participant) => {
                    const status = connectionServiceRef.current?.getConnectionStatus();
                    if (participant.socketId !== status?.socketId) {
                        webRTCServiceRef.current?.createPeerConnection(participant.socketId, true).catch(console.error);
                    }
                });
            }
        } catch (error) {
            console.error('[ERROR] 로컬 스트림 획득 실패:', error);
            alert('웹캠 접근에 실패했습니다.');
        }
    };

    // WebRTC: 로컬 스트림 중지
    const stopLocalStream = () => {
        webRTCServiceRef.current?.stopLocalStream();
        setLocalStream(null);
        setIsVideoEnabled(false);
    };

    return {
        isConnected,
        userRole,
        currentRoom,
        roomList,
        participants,
        chatMessages,
        chatInput,
        setChatInput,
        showCreateForm,
        setShowCreateForm,
        selectedCategory,
        setSelectedCategory,
        roomTitle,
        setRoomTitle,
        pendingRequests,
        joinRequestStatus,
        localStream,
        isVideoEnabled,
        myRooms: roomServiceRef.current?.getMyRooms() || new Set(),
        handleCreateRoom,
        handleJoinRoom,
        handleApproveRequest,
        handleRejectRequest,
        handleLeaveRoom,
        handleSendChat,
        startLocalStream,
        stopLocalStream,
        setVideoRef: (socketId: string, element: HTMLVideoElement | null) => {
            webRTCServiceRef.current?.setVideoRef(socketId, element);
        },
        getSocketId: () => connectionServiceRef.current?.getConnectionStatus().socketId || null,
    };
}
