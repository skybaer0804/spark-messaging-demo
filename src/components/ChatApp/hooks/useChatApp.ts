import { useState, useEffect, useRef } from 'preact/hooks';
import sparkMessagingClient from '../../../config/sparkMessaging';
import { ConnectionService } from '../../../services/ConnectionService';
import { ChatService } from '../../../services/ChatService';
import { FileTransferService } from '../../../services/FileTransferService';
import { RoomService } from '../services/RoomService';
import type { Message } from '../types';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';

export function useChatApp() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState<string | null>(null);
  const [roomList, setRoomList] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [socketId, setSocketId] = useState<string | null>(null);

  const connectionServiceRef = useRef<ConnectionService | null>(null);
  const chatServiceRef = useRef<ChatService | null>(null);
  const roomServiceRef = useRef<RoomService | null>(null);
  const fileTransferServiceRef = useRef<FileTransferService | null>(null);

  useEffect(() => {
    // 서비스 초기화
    const connectionService = new ConnectionService(sparkMessagingClient);
    const chatService = new ChatService(sparkMessagingClient, connectionService);
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

    // Room 리스트 업데이트 (룸 생성 메시지 수신)
    roomService.onMessage((_roomId) => {
      setRoomList(roomService.getRoomList());
    });

    // Room 관리
    roomService.onRoomJoined((roomId) => {
      setCurrentRoom(roomId);
      setRoomList(roomService.getRoomList());
      setMessages([]);
      chatService.setCurrentRoom(roomId);
    });

    roomService.onRoomLeft((roomId) => {
      if (currentRoom === roomId) {
        setCurrentRoom(null);
        setMessages([]);
        chatService.setCurrentRoom(null);
      }
      setRoomList(roomService.getRoomList());
    });

    // 메시지 수신
    chatService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    }, true); // Room에 있으면 일반 메시지 무시

    chatService.onRoomMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    // 초기 연결 상태 확인
    const status = connectionService.getConnectionStatus();
    if (status.isConnected) {
      setIsConnected(true);
      if (status.socketId) {
        setSocketId(status.socketId);
      }
      // 룸 목록 가져오기
      const roomListData = roomService.getRoomList();
      if (roomListData.length > 0) {
        setRoomList(roomListData);
      }
      // 현재 룸이 있으면 설정
      const currentRoomId = roomService.getCurrentRoom();
      if (currentRoomId) {
        setCurrentRoom(currentRoomId);
        chatService.setCurrentRoom(currentRoomId);
      }
    }

    return () => {
      connectionService.cleanup();
      chatService.cleanup();
      roomService.cleanup();
    };
  }, []);

  const sendFile = async (file: File) => {
    if (!isConnected || !fileTransferServiceRef.current || !roomServiceRef.current) {
      return;
    }

    const room = roomServiceRef.current.getCurrentRoom();
    if (!room) {
      alert('채팅방에 참여해주세요.');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      await fileTransferServiceRef.current.sendFile(room, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadingFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Failed to send file:', error);
      setUploadingFile(null);
      setUploadProgress(0);
      if (error instanceof Error) {
        alert(`파일 전송 실패: ${error.message}`);
      } else {
        alert('파일 전송 실패');
      }
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isConnected || !chatServiceRef.current) return;

    const messageContent = input.trim();
    const room = roomServiceRef.current?.getCurrentRoom();

    try {
      if (room) {
        await chatServiceRef.current.sendRoomMessage(room, 'chat', messageContent);
      } else {
        await chatServiceRef.current.sendMessage('chat', messageContent);
      }
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error instanceof SparkMessagingError) {
        alert(`메시지 전송 실패: ${error.message} (코드: ${error.code})`);
      } else {
        alert('메시지 전송 실패');
      }
    }
  };

  const handleRoomSelect = async (roomId: string) => {
    if (!roomServiceRef.current) return;

    try {
      await roomServiceRef.current.joinRoom(roomId);
    } catch (error) {
      console.error('Failed to join room:', error);
      if (error instanceof SparkMessagingError) {
        alert(`Room 입장 실패: ${error.message} (코드: ${error.code})`);
      } else {
        alert('Room 입장 실패');
      }
    }
  };

  const handleCreateRoom = async () => {
    if (!roomIdInput.trim() || !isConnected || !roomServiceRef.current) return;

    const roomId = roomIdInput.trim();
    try {
      await roomServiceRef.current.createRoom(roomId);
      setRoomIdInput('');
    } catch (error) {
      console.error('Failed to create room:', error);
      if (error instanceof SparkMessagingError) {
        alert(`Room 생성 실패: ${error.message} (코드: ${error.code})`);
      } else {
        alert('Room 생성 실패');
      }
    }
  };

  const leaveRoom = async () => {
    if (!currentRoom || !isConnected || !roomServiceRef.current) return;

    const roomToLeave = currentRoom;
    try {
      await roomServiceRef.current.leaveRoom(roomToLeave);
      // 명시적으로 currentRoom을 null로 설정하여 목록 화면으로 이동
      setCurrentRoom(null);
      setMessages([]);
      if (chatServiceRef.current) {
        chatServiceRef.current.setCurrentRoom(null);
      }
    } catch (error) {
      console.error('Failed to leave room:', error);
      if (error instanceof SparkMessagingError) {
        alert(`Room 나가기 실패: ${error.message} (코드: ${error.code})`);
      } else {
        alert('Room 나가기 실패');
      }
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
