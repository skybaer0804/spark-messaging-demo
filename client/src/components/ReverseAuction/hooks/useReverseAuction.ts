import { useState, useEffect, useRef } from 'preact/hooks';
import { toast } from 'react-toastify';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { ChatService } from '../../../services/ChatService';
import { FileTransferService } from '../../../services/FileTransferService';
import { RoomService } from '../services/RoomService';
import { ParticipantService } from '../services/ParticipantService';
import { WebRTCService } from '../services/WebRTCService';
import type { Room, ChatMessage, Participant, UserRole, Category } from '../types';
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
  const [requestedRoomId, setRequestedRoomId] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const connectionServiceRef = useRef<ConnectionService | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const fileTransferServiceRef = useRef<FileTransferService | null>(null);
  const roomServiceRef = useRef<RoomService | null>(null);
  const participantServiceRef = useRef<ParticipantService | null>(null);
  const webRTCServiceRef = useRef<WebRTCService | null>(null);

  useEffect(() => {
    const connectionService = new ConnectionService(sparkMessagingClient);
    const chatService = new ChatService(sparkMessagingClient, connectionService);
    const fileTransferService = new FileTransferService(sparkMessagingClient, connectionService, chatService);
    const roomService = new RoomService(sparkMessagingClient, connectionService);
    const participantService = new ParticipantService(sparkMessagingClient, connectionService);
    const webRTCService = new WebRTCService(sparkMessagingClient, connectionService);

    connectionServiceRef.current = connectionService;
    chatServiceRef.current = chatService;
    fileTransferServiceRef.current = fileTransferService;
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
        const isMyRoom = roomService.getMyRooms().has(roomId);

        // 룸 소유자(수요자)인 경우 userRole 설정
        if (isMyRoom) {
          participantService.setUserRole('demander');
          setUserRole('demander');
        }

        const currentUserRole = participantService.getUserRole();
        if (status.socketId) {
          const myInfo =
            currentUserRole === 'demander'
              ? { name: '수요자', role: 'demander' as UserRole }
              : { name: '공급자', role: 'supplier' as UserRole };

          // 공급자가 참가 요청 후 룸에 입장한 경우는 참가자 목록에 추가하지 않음 (승인 전까지)
          // 수요자이거나 승인된 공급자만 참가자 목록에 추가
          if (currentUserRole === 'demander' || isMyRoom) {
            participantService.addParticipant({ socketId: status.socketId, ...myInfo });
            setParticipants([...participantService.getParticipants()]);
            // user-joined 메시지 전송 (수요자만)
            await participantService.sendUserJoined(roomId, status.socketId, 1);
          } else {
            // 공급자가 승인되어 룸에 입장한 경우
            // 이미 룸에 있는 참가자들(수요자 포함)과 WebRTC 연결 시작
            // 수요자가 이미 영상을 시작했을 수 있으므로, 공급자가 수요자에게 offer를 보내야 함
            const existingParticipants = participantService.getParticipants();
            if (existingParticipants.length > 0 && isVideoEnabled && webRTCService.getLocalStream()) {
              existingParticipants.forEach((participant) => {
                if (participant.socketId !== status.socketId) {
                  setTimeout(() => {
                    webRTCService.createPeerConnection(participant.socketId, true).catch(console.error);
                  }, 500);
                }
              });
            }
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
      onJoinRequest: () => {
        setPendingRequests([...participantService.getPendingRequests()]);
      },
      onJoinApproved: async (socketId, roomId) => {
        const status = connectionService.getConnectionStatus();
        if (socketId === status.socketId) {
          console.log('[DEBUG] 참가 승인됨 - 룸 입장 시작:', roomId);
          setJoinRequestStatus('approved');
          toast.success('참가 요청이 승인되었습니다!');

          const targetRoomId = roomId || requestedRoomId;
          if (targetRoomId) {
            try {
              await roomService.joinRoom(targetRoomId);
              const approvedRoom = roomService.getRoomList().find((r) => r.roomId === targetRoomId);
              if (approvedRoom) {
                setCurrentRoom(approvedRoom);
                setChatMessages([]);
                setParticipants([]);
                setUserRole('supplier');
                setJoinRequestStatus('idle');
                setRequestedRoomId(null);

                // 룸에 입장한 후, 이미 룸에 있는 참가자들과 WebRTC 연결 시작
                // (수요자가 이미 영상을 시작했을 수 있음)
                const existingParticipants = participantService.getParticipants();
                if (existingParticipants.length > 0 && isVideoEnabled && webRTCService.getLocalStream()) {
                  existingParticipants.forEach((participant) => {
                    const mySocketId = connectionService.getConnectionStatus().socketId;
                    if (participant.socketId !== mySocketId) {
                      setTimeout(() => {
                        webRTCService.createPeerConnection(participant.socketId, true).catch(console.error);
                      }, 500);
                    }
                  });
                }
              }
            } catch (error) {
              console.error('[ERROR] 승인된 룸 입장 실패:', error);
            }
          }
        }
      },
      onJoinRejected: (socketId) => {
        const status = connectionService.getConnectionStatus();
        if (socketId === status.socketId) {
          setJoinRequestStatus('rejected');
          setRequestedRoomId(null);
          toast.error('참가 요청이 거부되었습니다.');
          if (currentRoom) {
            roomService.leaveRoom(currentRoom.roomId);
          }
        }
      },
      onUserJoined: (participant) => {
        // 공급자가 참가 요청 후 룸에 입장한 경우는 참가자 목록에 추가하지 않음
        // 승인된 경우에만 참가자 목록에 추가됨 (approveRequest에서 처리)
        // user-joined 메시지는 승인 후에만 보내지므로 여기서 추가해도 됨
        // 하지만 공급자가 참가 요청 후 룸에 입장하면 user-joined가 발생할 수 있으므로
        // 승인된 공급자인지 확인 필요
        const isApprovedSupplier =
          participantService.getPendingRequests().find((r) => r.socketId === participant.socketId) === undefined;
        if (isApprovedSupplier || userRole === 'demander') {
          setParticipants([...participantService.getParticipants()]);

          // 양방향 WebRTC 연결 시작
          // 1. 내가 영상을 시작했고, 새로 참가한 사람이 있으면 내가 offer를 보냄
          if (isVideoEnabled && webRTCService.getLocalStream()) {
            setTimeout(() => {
              webRTCService.createPeerConnection(participant.socketId, true).catch(console.error);
            }, 500);
          }

          // 2. 새로 참가한 사람이 이미 영상을 시작했을 수 있으므로,
          // 나도 영상을 시작했다면 연결을 시작해야 함 (이미 위에서 처리됨)
          // 하지만 새로 참가한 사람이 영상을 시작하지 않았더라도,
          // 나중에 영상을 시작하면 연결이 시작될 수 있도록 해야 함
        }
      },
      onUserLeft: () => {
        setParticipants([...participantService.getParticipants()]);
      },
    });

    // Chat 메시지 - Room 메시지에서 chat 및 file-transfer 타입 처리
    // 실제로는 client.onRoomMessage를 직접 사용하여 타입 필터링
    const chatUnsubscribe = sparkMessagingClient.onRoomMessage((msg: RoomMessageData) => {
      // 현재 Room의 메시지만 처리
      if (msg.room !== roomService.getCurrentRoomRef()) {
        return;
      }

      // chat 및 file-transfer 타입 처리
      const msgType = (msg as any).type || msg.type;
      if (msgType !== 'chat' && msgType !== 'file-transfer') {
        return;
      }

      const status = connectionService.getConnectionStatus();
      const isOwnMessage = msg.senderId === status.socketId || (msg as any).from === status.socketId;

      // 파일 전송 메시지 처리
      if ((msg as any).type === 'file-transfer') {
        try {
          const fileData = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
          if (fileData.fileData) {
            const chatMessage: ChatMessage = {
              id: `${msg.timestamp || Date.now()}-${Math.random()}`,
              content: fileData.fileData.fileName,
              timestamp: new Date(msg.timestamp || Date.now()),
              type: isOwnMessage ? 'sent' : 'received',
              senderId: (msg as any).from || msg.senderId,
              fileData: fileData.fileData,
            };
            setChatMessages((prev) => [...prev, chatMessage]);
          }
        } catch (error) {
          console.error('Failed to parse file message:', error);
        }
      } else {
        // 일반 채팅 메시지
        const chatMessage: ChatMessage = {
          id: `${msg.timestamp || Date.now()}-${Math.random()}`,
          content: msg.content,
          timestamp: new Date(msg.timestamp || Date.now()),
          type: isOwnMessage ? 'sent' : 'received',
          senderId: (msg as any).from || msg.senderId,
        };
        setChatMessages((prev) => [...prev, chatMessage]);
      }
    });

    // WebRTC 메시지
    webRTCService.onRoomMessage({
      onStreamReceived: (socketId, stream) => {
        participantService.updateParticipantStream(socketId, stream);
        setParticipants([...participantService.getParticipants()]);
      },
      onVideoStopped: (socketId) => {
        participantService.updateParticipantVideoStatus(socketId, false);
        setParticipants([...participantService.getParticipants()]);
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
  }, []); // isVideoEnabled를 의존성에서 제거 - 서비스 재생성 방지

  // 룸 생성
  const handleCreateRoom = async () => {
    if (!roomTitle.trim() || !isConnected || !roomServiceRef.current || !connectionServiceRef.current) return;

    const status = connectionServiceRef.current.getConnectionStatus();
    if (!status.socketId) return;

    try {
      const room = await roomServiceRef.current.createRoom(selectedCategory, roomTitle, status.socketId);
      // 수요자 역할 설정
      participantServiceRef.current?.setUserRole('demander');
      setUserRole('demander');
      setShowCreateForm(false);
      setRoomTitle('');
      setCurrentRoom(room);
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('룸 생성에 실패했습니다.');
    }
  };

  // 룸 참가
  const handleJoinRoom = async (room: Room) => {
    if (!isConnected || !roomServiceRef.current || !participantServiceRef.current) return;

    const isMyRoom = roomServiceRef.current.getMyRooms().has(room.roomId);

    if (roomServiceRef.current.getCurrentRoomRef() === room.roomId) {
      return;
    }

    // 승인된 상태면 바로 입장
    if (joinRequestStatus === 'approved' && !isMyRoom) {
      try {
        await roomServiceRef.current.joinRoom(room.roomId);
        setCurrentRoom(room);
        setChatMessages([]);
        setParticipants([]);
        setUserRole('supplier');
        setJoinRequestStatus('idle');
        return;
      } catch (error) {
        console.error('[ERROR] 승인된 룸 입장 실패:', error);
      }
    }

    // 내 룸이면 바로 입장
    if (isMyRoom) {
      try {
        await roomServiceRef.current.joinRoom(room.roomId);
        // 수요자 역할 설정
        participantServiceRef.current.setUserRole('demander');
        setUserRole('demander');
        setCurrentRoom(room);
        setChatMessages([]);
        setParticipants([]);
        setPendingRequests([]);
        setJoinRequestStatus('idle');
      } catch (error) {
        console.error('[ERROR] 룸 참가 실패:', error);
        toast.error('룸 참가에 실패했습니다.');
      }
    } else {
      // 공급자는 참가 요청만 보내고 룸에 입장하지 않음
      if (joinRequestStatus === 'idle' || joinRequestStatus === 'rejected') {
        try {
          setJoinRequestStatus('pending');
          setRequestedRoomId(room.roomId);
          await participantServiceRef.current.sendJoinRequest(room.roomId, room.category);
          setUserRole('supplier');
          // 참가 요청만 보내고 룸에 입장하지 않음 (승인 대기)
        } catch (error) {
          console.error('[ERROR] 참가 요청 실패:', error);
          toast.error('참가 요청에 실패했습니다.');
          setJoinRequestStatus('idle');
          setRequestedRoomId(null);
        }
      }
    }
  };

  // 참가 요청 승인
  const handleApproveRequest = async (requesterSocketId: string) => {
    if (!currentRoom || !isConnected || !participantServiceRef.current) return;

    try {
      await participantServiceRef.current.approveRequest(currentRoom.roomId, requesterSocketId);
      setParticipants([...participantServiceRef.current.getParticipants()]);
      setPendingRequests([...participantServiceRef.current.getPendingRequests()]);

      // 수요자가 영상을 시작했다면, 승인된 공급자와 WebRTC 연결 시작
      if (isVideoEnabled && webRTCServiceRef.current?.getLocalStream()) {
        setTimeout(() => {
          webRTCServiceRef.current?.createPeerConnection(requesterSocketId, true).catch(console.error);
        }, 500);
      }
      // 공급자가 나중에 영상을 시작하면, onUserJoined에서 연결이 시작될 수 있음
      // 하지만 공급자가 이미 영상을 시작했다면, 공급자가 수요자에게 offer를 보내야 함
      // 이는 공급자 측에서 처리됨 (startLocalStream에서)
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
        await participantServiceRef.current.sendUserLeft(
          currentRoom.roomId,
          status.socketId,
          Math.max(0, currentParticipants - 1),
        );
      }

      await roomServiceRef.current.leaveRoom(currentRoom.roomId);
      webRTCServiceRef.current?.stopLocalStream();
      setCurrentRoom(null);
      setUserRole(null);
      setChatMessages([]);
      setParticipants([]);
      setPendingRequests([]);
      // 참가 요청 상태 초기화
      setJoinRequestStatus('idle');
      setRequestedRoomId(null);
    } catch (error) {
      console.error('[ERROR] 룸 나가기 실패:', error);
    }
  };

  // 채팅 메시지 전송
  const handleSendChat = async () => {
    if (!chatInput.trim() || !currentRoom || !isConnected || !chatServiceRef.current) return;

    try {
      await chatServiceRef.current.sendRoomMessage(currentRoom.roomId, 'text', chatInput.trim());
      setChatInput('');
    } catch (error) {
      console.error('Failed to send chat:', error);
    }
  };

  // 파일 전송
  const sendFile = async (file: File) => {
    if (!isConnected || !fileTransferServiceRef.current || !currentRoom) {
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      await fileTransferServiceRef.current.sendFile(currentRoom.roomId, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadingFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to send file:', error);
      setUploadingFile(null);
      setUploadProgress(0);
      if (error instanceof Error) {
        toast.error(`파일 전송 실패: ${error.message}`);
      } else {
        toast.error('파일 전송 실패');
      }
    }
  };

  // WebRTC: 로컬 스트림 시작
  const startLocalStream = async () => {
    console.log('[DEBUG] startLocalStream 호출');
    if (!webRTCServiceRef.current) {
      console.error('[ERROR] webRTCServiceRef가 없음');
      return;
    }

    try {
      console.log('[DEBUG] 로컬 스트림 획득 시작');
      const stream = await webRTCServiceRef.current.startLocalStream();
      console.log('[DEBUG] 로컬 스트림 획득 완료, 상태 업데이트:', {
        streamId: stream.id,
        streamActive: stream.active,
      });
      setLocalStream(stream);
      setIsVideoEnabled(true);

      const roomId = currentRoom?.roomId || roomServiceRef.current?.getCurrentRoomRef();
      console.log('[DEBUG] PeerConnection 생성 준비:', {
        roomId,
        currentRoomId: currentRoom?.roomId,
        roomServiceRoomId: roomServiceRef.current?.getCurrentRoomRef(),
      });

      if (roomId) {
        // WebRTCService에 현재 룸 ID 설정
        webRTCServiceRef.current?.setCurrentRoomRef(roomId);
        console.log('[DEBUG] WebRTCService currentRoomRef 설정:', roomId);

        // 현재 참가자 목록 가져오기 (최신 상태)
        const currentParticipants = participantServiceRef.current?.getParticipants() || participants;
        console.log('[DEBUG] 현재 참가자 목록:', {
          count: currentParticipants.length,
          participants: currentParticipants.map((p) => ({ socketId: p.socketId, name: p.name })),
        });

        if (currentParticipants.length > 0) {
          currentParticipants.forEach((participant) => {
            const status = connectionServiceRef.current?.getConnectionStatus();
            if (participant.socketId !== status?.socketId) {
              console.log('[DEBUG] PeerConnection 생성 예정:', {
                targetSocketId: participant.socketId,
                mySocketId: status?.socketId,
              });
              // 각 참가자와 WebRTC 연결 시작
              setTimeout(() => {
                const service = webRTCServiceRef.current;
                const currentRoomId = currentRoom?.roomId || roomServiceRef.current?.getCurrentRoomRef();

                console.log('[DEBUG] setTimeout 내부 상태 확인:', {
                  hasService: !!service,
                  currentRoomId,
                  serviceCurrentRoomRef: service?.getLocalStream() ? '있음' : '없음',
                  hasLocalStream: !!service?.getLocalStream(),
                });

                // roomId가 있으면 다시 설정 (안전장치)
                if (currentRoomId && service) {
                  service.setCurrentRoomRef(currentRoomId);
                }

                if (service && currentRoomId) {
                  service.createPeerConnection(participant.socketId, true).catch((error) => {
                    console.error('[ERROR] PeerConnection 생성 실패:', error);
                  });
                } else {
                  console.error('[ERROR] PeerConnection 생성 불가: service 또는 roomId 없음');
                }
              }, 100);
            }
          });
        } else {
          console.log('[DEBUG] 참가자가 없어서 PeerConnection 생성하지 않음');
        }
      } else {
        console.warn('[WARN] roomId가 없어서 PeerConnection 생성하지 않음');
      }
    } catch (error) {
      console.error('[ERROR] 로컬 스트림 획득 실패:', error);
      toast.error('웹캠 접근에 실패했습니다.');
    }
  };

  // WebRTC: 로컬 스트림 중지
  const stopLocalStream = async () => {
    const roomId = currentRoom?.roomId || roomServiceRef.current?.getCurrentRoomRef();
    if (roomId && webRTCServiceRef.current) {
      await webRTCServiceRef.current.sendVideoStopped(roomId);
    }
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
    uploadingFile,
    uploadProgress,
    myRooms: roomServiceRef.current?.getMyRooms() || new Set(),
    handleCreateRoom,
    handleJoinRoom,
    handleApproveRequest,
    handleRejectRequest,
    handleLeaveRoom,
    handleSendChat,
    sendFile,
    startLocalStream,
    stopLocalStream,
    setVideoRef: (socketId: string, element: HTMLVideoElement | null) => {
      webRTCServiceRef.current?.setVideoRef(socketId, element);
    },
    getSocketId: () => connectionServiceRef.current?.getConnectionStatus().socketId || null,
  };
}
