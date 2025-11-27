import { useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../config/sparkMessaging';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import type { MessageData, RoomMessageData, ConnectedData } from '@skybaer0804/spark-messaging-client';
import './ReverseAuction.scss';

type UserRole = 'demander' | 'supplier';
type Category = '인테리어' | '웹개발' | '피규어';

interface Room {
    roomId: string;
    category: Category;
    title: string;
    participants: number;
    creatorId: string;
    createdAt: number;
}

interface ChatMessage {
    id: string;
    content: string;
    timestamp: Date;
    type: 'sent' | 'received';
    senderId?: string;
}

interface Participant {
    socketId: string;
    name: string;
    role: UserRole;
    stream?: MediaStream;
    peerConnection?: RTCPeerConnection;
}

interface WebRTCConnection {
    socketId: string;
    peerConnection: RTCPeerConnection;
    stream?: MediaStream;
}

export function ReverseAuction() {
    const [isConnected, setIsConnected] = useState(false);
    const [socketId, setSocketId] = useState<string | null>(null);
    const [userRole, setUserRole] = useState<UserRole | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [roomList, setRoomList] = useState<Room[]>([]);
    const [myRooms, setMyRooms] = useState<Set<string>>(new Set());
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    // 룸 생성 폼 상태
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category>('인테리어');
    const [roomTitle, setRoomTitle] = useState('');
    
    // 참가 요청 관련
    const [pendingRequests, setPendingRequests] = useState<Array<{ socketId: string; name: string }>>([]);
    
    // WebRTC 관련
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(false);
    
    const socketIdRef = useRef<string | null>(null);
    const currentRoomRef = useRef<string | null>(null);
    const mockUsers = useRef<Record<string, { name: string; role: UserRole }>>({});
    const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

    useEffect(() => {
        console.log('Setting up ReverseAuction client...');

        // 연결 상태 핸들러
        const handleConnected = (data: ConnectedData) => {
            console.log('✅ Connected event received:', data);
            setIsConnected(true);
            setSocketId(data.socketId);
            socketIdRef.current = data.socketId;
            
            // 기본 사용자 정보 설정
            if (!mockUsers.current[data.socketId]) {
                mockUsers.current[data.socketId] = {
                    name: `사용자${data.socketId.substring(0, 6)}`,
                    role: 'supplier', // 기본값은 공급자
                };
            }
        };

        // 연결 상태 변경 핸들러
        const handleConnectionStateChange = (connected: boolean) => {
            console.log('🔄 Connection state changed:', connected);
            setIsConnected(connected);
            if (connected) {
                const status = sparkMessagingClient.getConnectionStatus();
                setSocketId(status.socketId);
                socketIdRef.current = status.socketId;
            } else {
                setSocketId(null);
                socketIdRef.current = null;
            }
        };

        // 일반 메시지 수신 핸들러 (룸 리스트 업데이트)
        const handleMessage = (msg: MessageData) => {
            console.log('📨 Message received (broadcast):', msg);
            
            const currentSocketId = socketIdRef.current;
            const isOwnMessage = msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
            
            // room-created 타입 메시지 처리
            if (msg.type === 'room-created' || msg.type === 'room-list-update') {
                try {
                    const roomData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
                    if (roomData.roomId) {
                        setRoomList((prev) => {
                            const existingIndex = prev.findIndex((r) => r.roomId === roomData.roomId);
                            const newRoom: Room = {
                                roomId: roomData.roomId,
                                category: roomData.category || '인테리어',
                                title: roomData.title || '',
                                participants: roomData.participants || 1,
                                creatorId: roomData.creatorId || (msg as any).from,
                                createdAt: roomData.createdAt || Date.now(),
                            };
                            
                            if (existingIndex >= 0) {
                                const updated = [...prev];
                                updated[existingIndex] = newRoom;
                                return updated;
                            } else {
                                return [...prev, newRoom];
                            }
                        });
                    }
                } catch (error) {
                    console.error('Failed to parse room data:', error);
                }
            }
        };

        // Room 메시지 수신 핸들러
        const handleRoomMessage = async (msg: RoomMessageData) => {
            console.log('📨 Room message received:', msg);
            
            if (msg.room !== currentRoomRef.current) {
                return;
            }

            const currentSocketId = socketIdRef.current;
            const isOwnMessage = msg.senderId === currentSocketId || (msg as any).from === currentSocketId;
            
            // room-message type 필드에 따른 처리
            const msgType = (msg as any).type || msg.type;
            
            // 메시지 내용 파싱 (JSON 문자열인 경우)
            let parsedContent: any = null;
            try {
                parsedContent = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
            } catch {
                parsedContent = msg.content;
            }
            
            switch (msgType) {
                case 'join-request':
                    if (userRole === 'demander' && currentRoomRef.current) {
                        const requesterId = parsedContent?.from || (msg as any).from || msg.senderId;
                        const requesterName = mockUsers.current[requesterId]?.name || `사용자${requesterId.substring(0, 6)}`;
                        setPendingRequests((prev) => {
                            if (prev.find((r) => r.socketId === requesterId)) {
                                return prev;
                            }
                            return [...prev, { socketId: requesterId, name: requesterName }];
                        });
                    }
                    break;
                    
                case 'join-approved':
                    if (!isOwnMessage && (parsedContent?.approved || (msg as any).approved)) {
                        // 참가 승인됨 - 공급자가 자동으로 룸에 입장
                        const approvedTo = parsedContent?.to;
                        if (approvedTo === socketIdRef.current) {
                            console.log('[DEBUG] ✅ 참가 승인됨 - 룸 입장 시작');
                            const roomId = msg.room;
                            console.log('[DEBUG] 승인된 룸 ID:', roomId, '현재 룸:', currentRoomRef.current);
                            
                            if (roomId) {
                                // roomList에서 룸 찾기
                                setRoomList((prevList) => {
                                    const room = prevList.find((r) => r.roomId === roomId);
                                    if (room && roomId !== currentRoomRef.current) {
                                        console.log('[DEBUG] 룸 찾음, 입장 처리:', room);
                                        // 상태 업데이트를 즉시 실행
                                        setTimeout(() => {
                                            setCurrentRoom(room);
                                            currentRoomRef.current = roomId;
                                            setChatMessages([]);
                                            setParticipants([]);
                                            
                                            // 자신을 참가자 목록에 추가
                                            if (socketIdRef.current) {
                                                const myInfo = mockUsers.current[socketIdRef.current] || {
                                                    name: '공급자',
                                                    role: 'supplier' as UserRole,
                                                };
                                                setParticipants((prev) => {
                                                    const filtered = prev.filter((p) => p.socketId !== socketIdRef.current);
                                                    return [...filtered, { socketId: socketIdRef.current, ...myInfo }];
                                                });
                                            }
                                        }, 0);
                                    }
                                    return prevList;
                                });
                            }
                        }
                    }
                    break;
                    
                case 'join-rejected':
                    if (!isOwnMessage) {
                        const rejectedTo = parsedContent?.to;
                        if (rejectedTo === socketIdRef.current) {
                            console.log('❌ Join rejected');
                            alert('참가 요청이 거부되었습니다.');
                            // 룸에서 나가기
                            if (currentRoomRef.current) {
                                const roomIdToLeave = currentRoomRef.current;
                                try {
                                    await sparkMessagingClient.leaveRoom(roomIdToLeave);
                                    setCurrentRoom(null);
                                    currentRoomRef.current = null;
                                    setUserRole(null);
                                    setChatMessages([]);
                                    setParticipants([]);
                                } catch (error) {
                                    console.error('Failed to leave room after rejection:', error);
                                }
                            }
                        }
                    }
                    break;
                    
                case 'user-joined':
                    const joinedSocketId = parsedContent?.socketId || (msg as any).socketId || (msg as any).from;
                    console.log('[DEBUG] user-joined 메시지:', { joinedSocketId, mySocketId: socketIdRef.current });
                    
                    // 자신이 보낸 메시지가 아닌 경우에만 처리
                    if (joinedSocketId && joinedSocketId !== socketIdRef.current) {
                        setParticipants((prev) => {
                            console.log('[DEBUG] 참가자 추가 전:', prev.length, '추가할 ID:', joinedSocketId);
                            // 중복 체크 강화 - 같은 socketId가 이미 있으면 제거 후 다시 추가
                            const filtered = prev.filter((p) => p.socketId !== joinedSocketId);
                            const userInfo = mockUsers.current[joinedSocketId] || {
                                name: `사용자${joinedSocketId.substring(0, 6)}`,
                                role: 'supplier' as UserRole,
                            };
                            const updated = [...filtered, { socketId: joinedSocketId, ...userInfo }];
                            console.log('[DEBUG] 참가자 추가 후:', updated.length);
                            return updated;
                        });
                        
                        // 룸 참가자 수 업데이트 (함수형 업데이트로 최신 상태 사용)
                        setCurrentRoom((prevRoom) => {
                            if (!prevRoom) return prevRoom;
                            const newTotal = parsedContent?.total || (msg as any).total || (prevRoom.participants + 1);
                            console.log('[DEBUG] 참가자 수 업데이트:', { before: prevRoom.participants, after: newTotal });
                            return { ...prevRoom, participants: newTotal };
                        });
                        
                        // 룸 리스트도 업데이트
                        setRoomList((prev) => prev.map((room) => 
                            room.roomId === currentRoomRef.current && room.participants < (parsedContent?.total || (msg as any).total || room.participants + 1)
                                ? { ...room, participants: parsedContent?.total || (msg as any).total || room.participants + 1 }
                                : room
                        ));
                    }
                    break;
                    
                case 'user-left':
                    const leftSocketId = parsedContent?.socketId || (msg as any).socketId || (msg as any).from;
                    console.log('[DEBUG] user-left 메시지:', { leftSocketId, mySocketId: socketIdRef.current });
                    
                    setParticipants((prev) => {
                        const filtered = prev.filter((p) => p.socketId !== leftSocketId);
                        console.log('[DEBUG] 참가자 제거:', { before: prev.length, after: filtered.length });
                        return filtered;
                    });
                    
                    // 룸 참가자 수 업데이트 (함수형 업데이트)
                    setCurrentRoom((prevRoom) => {
                        if (!prevRoom) return prevRoom;
                        const newTotal = parsedContent?.total || (msg as any).total || Math.max(0, prevRoom.participants - 1);
                        console.log('[DEBUG] 참가자 수 감소:', { before: prevRoom.participants, after: newTotal });
                        return { ...prevRoom, participants: newTotal };
                    });
                    
                    // 룸 리스트도 업데이트
                    setRoomList((prev) => prev.map((room) => 
                        room.roomId === currentRoomRef.current
                            ? { ...room, participants: parsedContent?.total || (msg as any).total || Math.max(0, room.participants - 1) }
                            : room
                    ));
                    break;
                    
                case 'chat':
                    // 채팅 메시지
                    setChatMessages((prev) => [
                        ...prev,
                        {
                            id: `${msg.timestamp || Date.now()}-${Math.random()}`,
                            content: msg.content,
                            timestamp: new Date(msg.timestamp || Date.now()),
                            type: isOwnMessage ? 'sent' : 'received',
                            senderId: (msg as any).from || msg.senderId,
                        },
                    ]);
                    break;
                    
                case 'webrtc-offer':
                    console.log('[DEBUG] WebRTC offer 수신:', parsedContent);
                    if (!isOwnMessage && parsedContent?.sdp) {
                        handleWebRTCOffer(parsedContent.sdp, (msg as any).from || msg.senderId);
                    }
                    break;
                    
                case 'webrtc-answer':
                    console.log('[DEBUG] WebRTC answer 수신:', parsedContent);
                    if (!isOwnMessage && parsedContent?.sdp) {
                        handleWebRTCAnswer(parsedContent.sdp, (msg as any).from || msg.senderId);
                    }
                    break;
                    
                case 'ice-candidate':
                    console.log('[DEBUG] ICE candidate 수신:', parsedContent);
                    if (!isOwnMessage && parsedContent?.candidate) {
                        handleICECandidate(parsedContent.candidate, (msg as any).from || msg.senderId);
                    }
                    break;
            }
        };

        // Room 입장 핸들러
        const handleRoomJoined = async (roomId: string) => {
            console.log('✅ Room joined:', roomId);
            
            // 이미 같은 룸에 있으면 중복 처리 방지
            if (currentRoomRef.current === roomId && currentRoom) {
                return;
            }
            
            const room = roomList.find((r) => r.roomId === roomId);
            if (room) {
                setCurrentRoom(room);
                currentRoomRef.current = roomId;
                setChatMessages([]);
                setParticipants([]);
                
                // 자신을 참가자 목록에 추가
                if (socketIdRef.current) {
                    const myInfo = mockUsers.current[socketIdRef.current] || {
                        name: userRole === 'demander' ? '수요자' : '공급자',
                        role: userRole || 'supplier',
                    };
                    setParticipants((prev) => {
                        // 중복 체크 강화 - 같은 socketId가 이미 있으면 제거 후 다시 추가
                        const filtered = prev.filter((p) => p.socketId !== socketIdRef.current);
                        return [...filtered, { socketId: socketIdRef.current, ...myInfo }];
                    });
                    
                    // user-joined 메시지 전송 (다른 참가자들에게 알림)
                    // 수요자가 룸을 생성할 때만 전송 (공급자는 승인 후 자동 입장)
                    if (userRole === 'demander' || myRooms.has(roomId)) {
                        try {
                            await sparkMessagingClient.sendRoomMessage(roomId, 'user-joined', JSON.stringify({
                                socketId: socketIdRef.current,
                                total: 1,
                            }));
                        } catch (error) {
                            console.error('Failed to send user-joined message:', error);
                        }
                    }
                }
            } else {
                // 룸이 roomList에 없으면 생성 (룸 생성자가 먼저 입장한 경우)
                console.warn('Room not found in roomList, creating from roomId:', roomId);
            }
        };

        // Room 나가기 핸들러
        const handleRoomLeft = (roomId: string) => {
            console.log('👋 Room left:', roomId);
            if (currentRoomRef.current === roomId) {
                setCurrentRoom(null);
                currentRoomRef.current = null;
                setChatMessages([]);
                setParticipants([]);
                setPendingRequests([]);
            }
        };

        // 에러 핸들러
        const handleError = (error: Error | SparkMessagingError) => {
            console.error('❌ Error:', error);
            setIsConnected(false);
        };

        // 이벤트 리스너 등록
        const unsubscribeConnected = sparkMessagingClient.onConnected(handleConnected);
        const unsubscribeStateChange = sparkMessagingClient.onConnectionStateChange(handleConnectionStateChange);
        const unsubscribeMessage = sparkMessagingClient.onMessage(handleMessage);
        const unsubscribeRoomMessage = sparkMessagingClient.onRoomMessage(handleRoomMessage);
        const unsubscribeRoomJoined = sparkMessagingClient.onRoomJoined(handleRoomJoined);
        const unsubscribeRoomLeft = sparkMessagingClient.onRoomLeft(handleRoomLeft);
        const unsubscribeError = sparkMessagingClient.onError(handleError);

        // 연결 상태 확인
        const status = sparkMessagingClient.getConnectionStatus();
        if (status.isConnected) {
            setIsConnected(true);
            setSocketId(status.socketId);
            socketIdRef.current = status.socketId;
        }

        return () => {
            unsubscribeConnected();
            unsubscribeStateChange();
            unsubscribeMessage();
            unsubscribeRoomMessage();
            unsubscribeRoomJoined();
            unsubscribeRoomLeft();
            unsubscribeError();
        };
    }, [userRole]);

    // 룸 생성 (수요자)
    const handleCreateRoom = async () => {
        if (!roomTitle.trim() || !isConnected) return;

        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        try {
            // 룸 데이터 먼저 생성
            const roomData: Room = {
                roomId,
                category: selectedCategory,
                title: roomTitle.trim(),
                participants: 1,
                creatorId: socketIdRef.current || '',
                createdAt: Date.now(),
            };
            
            // roomList에 먼저 추가 (handleRoomJoined에서 찾을 수 있도록)
            setRoomList((prev) => [...prev, roomData]);
            
            // 룸 참가
            await sparkMessagingClient.joinRoom(roomId);
            
            // 룸 생성 메시지 브로드캐스트
            await sparkMessagingClient.sendMessage('room-created', JSON.stringify({
                type: 'room-created',
                ...roomData,
            }));
            
            // 내 룸 목록에 추가
            setMyRooms((prev) => new Set([...prev, roomId]));
            setUserRole('demander');
            setShowCreateForm(false);
            setRoomTitle('');
            
            // 룸 상세 화면으로 이동 (handleRoomJoined에서 처리되지만 확실히 하기 위해)
            setCurrentRoom(roomData);
            currentRoomRef.current = roomId;
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('룸 생성에 실패했습니다.');
            // 실패 시 roomList에서 제거
            setRoomList((prev) => prev.filter((r) => r.roomId !== roomId));
        }
    };

    // 룸 참가 (공급자 또는 수요자가 자신의 룸에 재입장)
    const handleJoinRoom = async (room: Room) => {
        if (!isConnected) return;

        const isMyRoom = myRooms.has(room.roomId);
        
        // 이미 룸에 있으면 중복 참가 방지
        if (currentRoomRef.current === room.roomId) {
            return;
        }
        
        try {
            // 룸 참가
            await sparkMessagingClient.joinRoom(room.roomId);
            
            if (isMyRoom) {
                // 내가 생성한 룸이면 수요자로 설정하고 참가 요청 없이 바로 입장
                setUserRole('demander');
                setCurrentRoom(room);
                currentRoomRef.current = room.roomId;
                setChatMessages([]);
                setParticipants([]);
                setPendingRequests([]);
            } else {
                // 공급자로 참가 요청 전송 (이미 요청한 경우 중복 방지)
                const hasPendingRequest = pendingRequests.some((r) => r.socketId === socketIdRef.current);
                if (!hasPendingRequest) {
                    await sparkMessagingClient.sendRoomMessage(room.roomId, 'join-request', JSON.stringify({
                        from: socketIdRef.current,
                        category: room.category,
                    }));
                }
                
                setUserRole('supplier');
            }
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('룸 참가에 실패했습니다.');
        }
    };

    // 참가 요청 승인 (수요자)
    const handleApproveRequest = async (requesterSocketId: string) => {
        if (!currentRoom || !isConnected) return;

        console.log('[DEBUG] 승인 요청:', { requesterSocketId, currentRoom: currentRoom.roomId });
        
        try {
            // 참가자 목록에 먼저 추가 (상태 업데이트)
            const requesterName = mockUsers.current[requesterSocketId]?.name || `사용자${requesterSocketId.substring(0, 6)}`;
            
            setParticipants((prev) => {
                console.log('[DEBUG] 참가자 목록 업데이트 전:', prev.length);
                if (prev.find((p) => p.socketId === requesterSocketId)) {
                    console.log('[DEBUG] 이미 참가자 목록에 있음');
                    return prev;
                }
                const updated = [...prev, { socketId: requesterSocketId, name: requesterName, role: 'supplier' as UserRole }];
                console.log('[DEBUG] 참가자 목록 업데이트 후:', updated.length);
                return updated;
            });
            
            // 룸 참가자 수 즉시 업데이트 (함수형 업데이트로 최신 상태 사용)
            setCurrentRoom((prevRoom) => {
                if (!prevRoom) return prevRoom;
                const newTotal = prevRoom.participants + 1;
                console.log('[DEBUG] 참가자 수 업데이트:', { before: prevRoom.participants, after: newTotal });
                return { ...prevRoom, participants: newTotal };
            });
            
            // 승인 메시지 전송
            await sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'join-approved', JSON.stringify({
                to: requesterSocketId,
                approved: true,
            }));
            
            // user-joined 메시지 전송 (최신 참가자 수 사용)
            setCurrentRoom((prevRoom) => {
                if (!prevRoom) return prevRoom;
                const total = prevRoom.participants;
                sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'user-joined', JSON.stringify({
                    socketId: requesterSocketId,
                    total: total,
                })).catch(console.error);
                return prevRoom;
            });
            
            // 대기 중인 요청에서 제거
            setPendingRequests((prev) => {
                const filtered = prev.filter((r) => r.socketId !== requesterSocketId);
                console.log('[DEBUG] 대기 요청 제거:', { before: prev.length, after: filtered.length });
                return filtered;
            });
            
            // 승인된 공급자에게 WebRTC 연결 시작 (로컬 스트림이 활성화된 경우)
            if (isVideoEnabled && localStreamRef.current) {
                setTimeout(() => {
                    createPeerConnection(requesterSocketId, true);
                }, 500);
            }
        } catch (error) {
            console.error('[ERROR] 승인 실패:', error);
        }
    };

    // 참가 요청 거부 (수요자)
    const handleRejectRequest = async (requesterSocketId: string) => {
        if (!currentRoom || !isConnected) return;

        try {
            await sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'join-rejected', JSON.stringify({
                to: requesterSocketId,
                rejected: true,
            }));
            
            // 대기 중인 요청에서 제거
            setPendingRequests((prev) => prev.filter((r) => r.socketId !== requesterSocketId));
        } catch (error) {
            console.error('Failed to reject request:', error);
        }
    };

    // 룸 나가기
    const handleLeaveRoom = async () => {
        if (!currentRoom || !isConnected) return;

        const roomId = currentRoom.roomId;
        console.log('[DEBUG] 룸 나가기:', { roomId, participants: participants.length });
        
        try {
            // user-left 메시지 먼저 전송 (나가기 전에)
            const currentParticipants = participants.length;
            await sparkMessagingClient.sendRoomMessage(roomId, 'user-left', JSON.stringify({
                socketId: socketIdRef.current,
                total: Math.max(0, currentParticipants - 1),
            }));
            
            await sparkMessagingClient.leaveRoom(roomId);
            
            // WebRTC 정리
            stopLocalStream();
            
            // 모든 상태 초기화
            console.log('[DEBUG] 상태 초기화');
            setCurrentRoom(null);
            currentRoomRef.current = null;
            setUserRole(null);
            setChatMessages([]);
            setParticipants([]);
            setPendingRequests([]);
            
            // 룸 리스트에서 참가자 수 업데이트
        } catch (error) {
            console.error('[ERROR] 룸 나가기 실패:', error);
        }
    };

    // 채팅 메시지 전송
    const handleSendChat = async () => {
        if (!chatInput.trim() || !currentRoom || !isConnected) return;

        try {
            await sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'chat', chatInput.trim());
            setChatInput('');
        } catch (error) {
            console.error('Failed to send chat:', error);
        }
    };

    // WebRTC: 로컬 스트림 시작
    const startLocalStream = async () => {
        try {
            console.log('[DEBUG] 로컬 스트림 시작');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            setLocalStream(stream);
            localStreamRef.current = stream;
            setIsVideoEnabled(true);
            console.log('[DEBUG] 로컬 스트림 획득 성공');
            
            // 기존 참가자들에게 offer 전송
            if (currentRoom && participants.length > 0) {
                participants.forEach((participant) => {
                    if (participant.socketId !== socketIdRef.current) {
                        createPeerConnection(participant.socketId, true);
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
        console.log('[DEBUG] 로컬 스트림 중지');
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
            setLocalStream(null);
            setIsVideoEnabled(false);
        }
        
        // 모든 PeerConnection 종료
        peerConnectionsRef.current.forEach((pc, socketId) => {
            pc.close();
        });
        peerConnectionsRef.current.clear();
    };

    // WebRTC: PeerConnection 생성
    const createPeerConnection = async (targetSocketId: string, isInitiator: boolean) => {
        if (!currentRoom || !socketIdRef.current) return;

        console.log('[DEBUG] PeerConnection 생성:', { targetSocketId, isInitiator });
        
        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
            ],
        });

        // 로컬 스트림 추가
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                pc.addTrack(track, localStreamRef.current!);
            });
        }

        // 원격 스트림 수신
        pc.ontrack = (event) => {
            console.log('[DEBUG] 원격 스트림 수신:', targetSocketId);
            const remoteStream = event.streams[0];
            setParticipants((prev) => {
                const updated = prev.map((p) => 
                    p.socketId === targetSocketId 
                        ? { ...p, stream: remoteStream }
                        : p
                );
                return updated;
            });
            
            // 비디오 엘리먼트에 스트림 연결
            setTimeout(() => {
                const videoElement = videoRefs.current.get(targetSocketId);
                if (videoElement && remoteStream) {
                    videoElement.srcObject = remoteStream;
                }
            }, 100);
        };

        // ICE candidate 수집
        pc.onicecandidate = (event) => {
            if (event.candidate && currentRoom) {
                console.log('[DEBUG] ICE candidate 전송:', targetSocketId);
                sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'ice-candidate', JSON.stringify({
                    candidate: event.candidate,
                    to: targetSocketId,
                })).catch(console.error);
            }
        };

        peerConnectionsRef.current.set(targetSocketId, pc);

        // Offer 생성 및 전송 (초기화자인 경우)
        if (isInitiator) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                console.log('[DEBUG] Offer 전송:', targetSocketId);
                await sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'webrtc-offer', JSON.stringify({
                    sdp: offer,
                    to: targetSocketId,
                }));
            } catch (error) {
                console.error('[ERROR] Offer 생성 실패:', error);
            }
        }
    };

    // WebRTC: Offer 처리
    const handleWebRTCOffer = async (sdp: RTCSessionDescriptionInit, fromSocketId: string) => {
        if (!currentRoom || !socketIdRef.current) return;

        console.log('[DEBUG] Offer 처리:', fromSocketId);
        
        let pc = peerConnectionsRef.current.get(fromSocketId);
        if (!pc) {
            await createPeerConnection(fromSocketId, false);
            pc = peerConnectionsRef.current.get(fromSocketId);
        }

        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
                
                // Answer 생성 및 전송
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                console.log('[DEBUG] Answer 전송:', fromSocketId);
                await sparkMessagingClient.sendRoomMessage(currentRoom.roomId, 'webrtc-answer', JSON.stringify({
                    sdp: answer,
                    to: fromSocketId,
                }));
            } catch (error) {
                console.error('[ERROR] Offer 처리 실패:', error);
            }
        }
    };

    // WebRTC: Answer 처리
    const handleWebRTCAnswer = async (sdp: RTCSessionDescriptionInit, fromSocketId: string) => {
        console.log('[DEBUG] Answer 처리:', fromSocketId);
        
        const pc = peerConnectionsRef.current.get(fromSocketId);
        if (pc) {
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            } catch (error) {
                console.error('[ERROR] Answer 처리 실패:', error);
            }
        }
    };

    // WebRTC: ICE Candidate 처리
    const handleICECandidate = async (candidate: RTCIceCandidateInit, fromSocketId: string) => {
        console.log('[DEBUG] ICE candidate 처리:', fromSocketId);
        
        const pc = peerConnectionsRef.current.get(fromSocketId);
        if (pc) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (error) {
                console.error('[ERROR] ICE candidate 처리 실패:', error);
            }
        }
    };

    // 참가자 추가 시 WebRTC 연결 시작
    useEffect(() => {
        if (currentRoom && isVideoEnabled && localStreamRef.current && participants.length > 0) {
            participants.forEach((participant) => {
                if (participant.socketId !== socketIdRef.current && !peerConnectionsRef.current.has(participant.socketId)) {
                    console.log('[DEBUG] 새 참가자 WebRTC 연결 시작:', participant.socketId);
                    createPeerConnection(participant.socketId, true);
                }
            });
        }
    }, [participants.length, isVideoEnabled]);

    // 룸 나가기 시 WebRTC 정리
    useEffect(() => {
        if (!currentRoom) {
            stopLocalStream();
        }
    }, [currentRoom]);

    // 초기 화면 (랜딩)
    if (!currentRoom) {
        return (
            <div className="reverse-auction">
                <div className="reverse-auction__header">
                    <h2 className="reverse-auction__title">역경매</h2>
                    {!showCreateForm && (
                        <button
                            className="reverse-auction__create-button"
                            onClick={() => setShowCreateForm(true)}
                            disabled={!isConnected}
                        >
                            🏠 룸 생성 (수요자)
                        </button>
                    )}
                </div>

                {showCreateForm ? (
                    <div className="reverse-auction__create-form">
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">카테고리</label>
                            <div className="reverse-auction__category-tabs">
                                {(['인테리어', '웹개발', '피규어'] as Category[]).map((cat) => (
                                    <button
                                        key={cat}
                                        className={`reverse-auction__category-tab ${selectedCategory === cat ? 'reverse-auction__category-tab--active' : ''}`}
                                        onClick={() => setSelectedCategory(cat)}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="reverse-auction__form-field">
                            <label className="reverse-auction__label">제목</label>
                            <input
                                type="text"
                                className="reverse-auction__input"
                                value={roomTitle}
                                onInput={(e) => setRoomTitle(e.currentTarget.value)}
                                placeholder="예: 3평 원룸 인테리어 견적 요청"
                                disabled={!isConnected}
                            />
                        </div>
                        <div className="reverse-auction__form-actions">
                            <button
                                className="reverse-auction__button reverse-auction__button--secondary"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setRoomTitle('');
                                }}
                            >
                                취소
                            </button>
                            <button
                                className="reverse-auction__button reverse-auction__button--primary"
                                onClick={handleCreateRoom}
                                disabled={!isConnected || !roomTitle.trim()}
                            >
                                생성
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="reverse-auction__room-list">
                        <div className="reverse-auction__room-list-header">
                            <h3 className="reverse-auction__room-list-title">룸 리스트</h3>
                        </div>
                        <div className="reverse-auction__room-list-content">
                            {roomList.length === 0 ? (
                                <div className="reverse-auction__empty">
                                    {!isConnected ? (
                                        <p>서버에 연결 중...</p>
                                    ) : (
                                        <p>생성된 룸이 없습니다.</p>
                                    )}
                                </div>
                            ) : (
                                <div className="reverse-auction__room-items">
                                    {roomList.map((room) => (
                                        <div key={room.roomId} className="reverse-auction__room-item">
                                            <div className="reverse-auction__room-item-info">
                                                <span className="reverse-auction__room-item-category">{room.category}</span>
                                                <h4 className="reverse-auction__room-item-title">{room.title}</h4>
                                                <p className="reverse-auction__room-item-meta">
                                                    참가자: {room.participants}명
                                                </p>
                                            </div>
                                            <button
                                                className="reverse-auction__room-item-button"
                                                onClick={() => handleJoinRoom(room)}
                                                disabled={!isConnected}
                                            >
                                                {myRooms.has(room.roomId) ? '내 룸' : '참가'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // 룸 상세 화면
    return (
        <div className="reverse-auction">
            <div className="reverse-auction__room-header">
                <button className="reverse-auction__back-button" onClick={handleLeaveRoom}>
                    ←
                </button>
                <div className="reverse-auction__room-header-info">
                    <h2 className="reverse-auction__room-title">{currentRoom.title}</h2>
                    <span className="reverse-auction__room-category">{currentRoom.category}</span>
                </div>
            </div>

            {/* 영상 영역 (4분할) */}
            <div className="reverse-auction__video-section">
                <div className="reverse-auction__video-controls">
                    {!isVideoEnabled ? (
                        <button 
                            className="reverse-auction__video-toggle-button"
                            onClick={startLocalStream}
                        >
                            📹 영상 시작
                        </button>
                    ) : (
                        <button 
                            className="reverse-auction__video-toggle-button reverse-auction__video-toggle-button--stop"
                            onClick={stopLocalStream}
                        >
                            🛑 영상 중지
                        </button>
                    )}
                </div>
                <div className="reverse-auction__video-grid">
                    {/* 로컬 비디오 (자신) */}
                    {isVideoEnabled && localStream && (
                        <div className="reverse-auction__video-item reverse-auction__video-item--local">
                            <video
                                ref={(el) => {
                                    if (el && socketIdRef.current) {
                                        videoRefs.current.set('local', el);
                                        el.srcObject = localStream;
                                        el.autoplay = true;
                                        el.playsInline = true;
                                        el.muted = true;
                                    }
                                }}
                                className="reverse-auction__video-element"
                            />
                            <div className="reverse-auction__video-label">나 ({socketIdRef.current?.substring(0, 6)})</div>
                        </div>
                    )}
                    
                    {/* 원격 비디오 (다른 참가자들) */}
                    {participants
                        .filter((p) => p.socketId !== socketIdRef.current)
                        .slice(0, 4 - (isVideoEnabled ? 1 : 0))
                        .map((participant) => (
                            <div key={participant.socketId} className="reverse-auction__video-item">
                                {participant.stream ? (
                                    <>
                                        <video
                                            ref={(el) => {
                                                if (el) {
                                                    videoRefs.current.set(participant.socketId, el);
                                                    el.srcObject = participant.stream;
                                                    el.autoplay = true;
                                                    el.playsInline = true;
                                                }
                                            }}
                                            className="reverse-auction__video-element"
                                        />
                                        <div className="reverse-auction__video-label">
                                            {participant.name} ({participant.role === 'demander' ? '수요자' : '공급자'})
                                        </div>
                                    </>
                                ) : (
                                    <div className="reverse-auction__video-placeholder">
                                        {participant.name}
                                        <br />
                                        <small>{participant.role === 'demander' ? '수요자' : '공급자'}</small>
                                        <br />
                                        <small className="reverse-auction__video-loading">연결 중...</small>
                                    </div>
                                )}
                            </div>
                        ))}
                    
                    {/* 빈 슬롯 */}
                    {participants.length === 0 && !isVideoEnabled && (
                        <div className="reverse-auction__video-placeholder">영상 영역 (영상 시작 버튼을 눌러주세요)</div>
                    )}
                </div>
            </div>

            {/* 참가 요청 알림 (수요자만) */}
            {userRole === 'demander' && pendingRequests.length > 0 && (
                <div className="reverse-auction__pending-requests">
                    <h4>참가 요청</h4>
                    {pendingRequests.map((request) => (
                        <div key={request.socketId} className="reverse-auction__request-item">
                            <span>{request.name}</span>
                            <div className="reverse-auction__request-actions">
                                <button
                                    className="reverse-auction__approve-button"
                                    onClick={() => handleApproveRequest(request.socketId)}
                                >
                                    승인
                                </button>
                                <button
                                    className="reverse-auction__reject-button"
                                    onClick={() => handleRejectRequest(request.socketId)}
                                >
                                    거부
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 채팅 영역 */}
            <div className="reverse-auction__chat-section">
                <div className="reverse-auction__chat-messages">
                    {chatMessages.length === 0 ? (
                        <div className="reverse-auction__chat-empty">메시지가 없습니다.</div>
                    ) : (
                        chatMessages.map((msg) => (
                            <div key={msg.id} className={`reverse-auction__chat-message reverse-auction__chat-message--${msg.type}`}>
                                <div className="reverse-auction__chat-message-content">{msg.content}</div>
                                <div className="reverse-auction__chat-message-time">
                                    {msg.timestamp.toLocaleTimeString('ko-KR', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <div className="reverse-auction__chat-input-container">
                    <input
                        type="text"
                        className="reverse-auction__chat-input"
                        value={chatInput}
                        onInput={(e) => setChatInput(e.currentTarget.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendChat();
                            }
                        }}
                        placeholder="메시지를 입력하세요..."
                        disabled={!isConnected}
                    />
                    <button
                        className="reverse-auction__chat-send-button"
                        onClick={handleSendChat}
                        disabled={!isConnected || !chatInput.trim()}
                    >
                        전송
                    </button>
                </div>
            </div>
        </div>
    );
}

