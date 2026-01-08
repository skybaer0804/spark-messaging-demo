import { useState, useEffect, useRef } from 'preact/hooks';
import { toast } from 'react-toastify';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { ChatService } from '../../../services/ChatService';
import { FileTransferService } from '../../../services/FileTransferService';
import { RoomService } from '../services/RoomService';
import type { Message, ChatRoom } from '../types';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import { setChatCurrentRoom, setChatRoomList } from '@/stores/chatRoomsStore';
import { useAuth } from '@/hooks/useAuth';

export function useChatApp() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [roomList, setRoomList] = useState<ChatRoom[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [socketId, setSocketId] = useState<string | null>(null);

  const connectionServiceRef = useRef<ConnectionService | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const roomServiceRef = useRef<RoomService | null>(null);
  const fileTransferServiceRef = useRef<FileTransferService | null>(null);

  const refreshRoomList = async () => {
    if (chatServiceRef.current) {
      try {
        const rooms = await chatServiceRef.current.getRooms();
        setRoomList(rooms);
      } catch (error) {
        console.error('Failed to load rooms:', error);
      }
    }
  };

  useEffect(() => {
    // 서비스 초기화
    const connectionService = new ConnectionService(sparkMessagingClient);
    const chatService = new ChatService(sparkMessagingClient, connectionService);
    if (user.value) {
      chatService.setUserId(user.value.id);
    }
    const roomService = new RoomService(sparkMessagingClient, connectionService);
    const fileTransferService = new FileTransferService(sparkMessagingClient, connectionService, chatService);

    connectionServiceRef.current = connectionService;
    chatServiceRef.current = chatService;
    roomServiceRef.current = roomService;
    fileTransferServiceRef.current = fileTransferService;

    // 연결 상태 관리
    connectionService.onConnected(() => {
      setIsConnected(true);
      const status = connectionService.getConnectionStatus();
      if (status.socketId) {
        setSocketId(status.socketId);
      }
    });

    connectionService.onConnectionStateChange((connected) => {
      setIsConnected(connected);
      if (connected) {
        const status = connectionService.getConnectionStatus();
        if (status.socketId) {
          setSocketId(status.socketId);
        }
      } else {
        setSocketId(null);
      }
    });

    connectionService.onError((error) => {
      console.error('❌ Error:', error);
      setIsConnected(false);
    });

    // Room 리스트 업데이트 (룸 생성 메시지 수신 시 리스트 갱신)
    roomService.onMessage(() => {
      refreshRoomList();
    });

    // Room 관리
    roomService.onRoomJoined((roomId) => {
      // roomId는 소켓의 roomId (여기서는 name일 수도 있고 ID일 수도 있음)
      // 하지만 우리는 DB 기반으로 동작하므로 refreshRoomList를 통해 상태 동기화
      refreshRoomList();
      chatService.setCurrentRoom(roomId);
    });

    roomService.onRoomLeft((roomId) => {
      if (currentRoom && (currentRoom._id === roomId || currentRoom.name === roomId)) {
        setCurrentRoom(null);
        setMessages([]);
        chatService.setCurrentRoom(null);
      }
      refreshRoomList();
    });

    // 메시지 수신
    chatService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    }, true); // Room에 있으면 일반 메시지는 onRoomMessage에서 처리

    chatService.onRoomMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // 초기 연결 상태 확인 및 데이터 로드
    const initData = async () => {
      if (chatServiceRef.current) {
        await refreshRoomList();
      }
    };

    const status = connectionService.getConnectionStatus();
    if (status.isConnected) {
      setIsConnected(true);
      if (status.socketId) {
        setSocketId(status.socketId);
      }
      initData();
    }

    return () => {
      connectionService.cleanup();
      chatService.cleanup();
      roomService.cleanup();
    };
  }, []);

  // 전역 사이드바 호환성을 위해 이름을 문자열 배열로 변환하여 동기화
  useEffect(() => {
    setChatRoomList(roomList.map((r) => r.name));
  }, [roomList]);

  useEffect(() => {
    setChatCurrentRoom(currentRoom?.name || null);
  }, [currentRoom]);

  const sendFile = async (file: File) => {
    if (!isConnected || !fileTransferServiceRef.current || !roomServiceRef.current) {
      return;
    }

    const room = currentRoom;
    if (!room) {
      toast.warning('채팅방에 참여해주세요.');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      // 소켓 통신을 위해서는 room.name 또는 room._id 중 소켓이 사용하는 값을 사용해야 함
      // 현재 RoomService는 roomId를 그대로 사용함.
      await fileTransferServiceRef.current.sendFile(room._id, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadingFile(null);
      setUploadProgress(0);
      toast.success('파일 전송 완료');
    } catch (error) {
      console.error('Failed to send file:', error);
      setUploadingFile(null);
      setUploadProgress(0);
      toast.error(error instanceof Error ? `파일 전송 실패: ${error.message}` : '파일 전송 실패');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isConnected || !chatServiceRef.current) return;

    const messageContent = input.trim();
    const room = currentRoom;

    try {
      if (room) {
        // 백엔드 API 호출 시 _id 사용, type은 백엔드 enum 규격에 맞춰 'text'로 전송
        await chatServiceRef.current.sendRoomMessage(room._id, 'text', messageContent);
      } else {
        await chatServiceRef.current.sendMessage('text', messageContent);
      }
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error instanceof SparkMessagingError ? `메시지 전송 실패: ${error.message}` : '메시지 전송 실패');
    }
  };

  const handleRoomSelect = async (roomIdOrRoom: string | ChatRoom) => {
    if (!roomServiceRef.current || !chatServiceRef.current) return;

    let targetRoom: ChatRoom | undefined;
    if (typeof roomIdOrRoom === 'string') {
      targetRoom = roomList.find((r) => r._id === roomIdOrRoom || r.name === roomIdOrRoom);
    } else {
      targetRoom = roomIdOrRoom;
    }

    if (!targetRoom) return;

    try {
      // 1. 소켓 방 참여 (실시간 수신을 위해 _id 사용)
      await roomServiceRef.current.joinRoom(targetRoom._id);

      // 2. 백엔드에서 이전 메시지 이력 가져오기 (_id 사용)
      const history = await chatServiceRef.current.getMessages(targetRoom._id);
      const formattedMessages = history.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        type: msg.senderId?._id === user.value?.id ? 'sent' : 'received',
        senderId: msg.senderId?.username || 'Unknown',
        fileData: msg.fileUrl
          ? {
              fileName: msg.fileName,
              fileType: msg.type === 'image' ? 'image' : 'document',
              mimeType: msg.mimeType,
              size: msg.fileSize,
              data: msg.fileUrl,
              thumbnail: msg.thumbnailUrl,
            }
          : undefined,
      }));

      setMessages(formattedMessages);
      setCurrentRoom(targetRoom);
      chatServiceRef.current.setCurrentRoom(targetRoom._id);
    } catch (error) {
      console.error('Failed to join room or fetch history:', error);
      toast.error('Room 입장 실패');
    }
  };

  const handleCreateRoom = async () => {
    if (!roomIdInput.trim() || !isConnected || !chatServiceRef.current) return;

    const roomName = roomIdInput.trim();
    try {
      // 1. 백엔드에 방 생성 요청
      const newRoom = await chatServiceRef.current.createRoom(roomName);

      // 2. 목록 갱신
      await refreshRoomList();

      // 3. 생성된 방으로 입장 (newRoom에는 _id가 있음)
      await handleRoomSelect(newRoom);

      setRoomIdInput('');
      toast.success('채팅방이 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create room:', error);
      toast.error('Room 생성 실패');
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !isConnected || !roomServiceRef.current) return;

    const roomId = currentRoom._id;
    try {
      await roomServiceRef.current.leaveRoom(roomId);
      setCurrentRoom(null);
      setMessages([]);
      if (chatServiceRef.current) {
        chatServiceRef.current.setCurrentRoom(null);
      }
      toast.info('채팅방을 나갔습니다.');
    } catch (error) {
      console.error('Failed to leave room:', error);
      toast.error('Room 나가기 실패');
    }
  };

  return {
    isConnected,
    messages,
    input,
    setInput,
    roomIdInput,
    setRoomIdInput,
    currentRoom,
    roomList,
    sendMessage,
    handleRoomSelect,
    handleCreateRoom,
    leaveRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    socketId,
  };
}
