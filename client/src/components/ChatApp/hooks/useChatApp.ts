import { useState, useEffect } from 'preact/hooks';
import { useToast } from '@/context/ToastContext';
import type { Message, ChatRoom } from '../types';
import { SparkMessagingError } from '@skybaer0804/spark-messaging-client';
import { setChatCurrentRoom, setChatRoomList } from '@/stores/chatRoomsStore';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '../context/ChatContext';

export interface Organization {
  _id: string;
  name: string;
  dept1: string;
  dept2?: string;
}

export function useChatApp() {
  const { user } = useAuth();
  const { isConnected, socketId, roomList, userList, orgList, services, refreshRoomList, debugEnabled, toggleDebug } =
    useChat();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { showWarning, showSuccess, showError } = useToast();

  const { chat: chatService, room: roomService, fileTransfer: fileTransferService } = services;

  useEffect(() => {
    // Room 관리
    const unsubRoomJoined = roomService.onRoomJoined(async (roomId) => {
      refreshRoomList();
      await chatService.setCurrentRoom(roomId);
    });

    const unsubRoomLeft = roomService.onRoomLeft(async (roomId) => {
      if (currentRoom && (currentRoom._id === roomId || currentRoom.name === roomId)) {
        setCurrentRoom(null);
        setMessages([]);
        await chatService.setCurrentRoom(null);
      }
      refreshRoomList();
    });

    // 메시지 수신
    const unsubMessage = chatService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
    }, true);

    const unsubRoomMessage = chatService.onRoomMessage((message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      unsubRoomJoined();
      unsubRoomLeft();
      unsubMessage();
      unsubRoomMessage();
    };
  }, [currentRoom]);

  // 전역 사이드바 호환성을 위해 이름을 문자열 배열로 변환하여 동기화
  useEffect(() => {
    setChatRoomList(roomList.map((r) => r.name));
  }, [roomList]);

  useEffect(() => {
    setChatCurrentRoom(currentRoom?.name || null);
  }, [currentRoom]);

  const sendFile = async (file: File) => {
    if (!isConnected) return;

    const room = currentRoom;
    if (!room) {
      showWarning('채팅방에 참여해주세요.');
      return;
    }

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      await fileTransferService.sendFile(room._id, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadingFile(null);
      setUploadProgress(0);
      showSuccess('파일 전송 완료');
    } catch (error) {
      console.error('Failed to send file:', error);
      setUploadingFile(null);
      setUploadProgress(0);
      showError(error instanceof Error ? `파일 전송 실패: ${error.message}` : '파일 전송 실패');
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isConnected) return;

    const messageContent = input.trim();
    const room = currentRoom;

    try {
      if (room) {
        await chatService.sendRoomMessage(room._id, 'text', messageContent);
      } else {
        await chatService.sendMessage('text', messageContent);
      }
      setInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
      showError(error instanceof SparkMessagingError ? `메시지 전송 실패: ${error.message}` : '메시지 전송 실패');
    }
  };

  const handleRoomSelect = async (roomIdOrRoom: string | ChatRoom) => {
    let targetRoom: ChatRoom | undefined;
    if (typeof roomIdOrRoom === 'string') {
      targetRoom = roomList.find((r) => r._id === roomIdOrRoom || r.name === roomIdOrRoom);
    } else {
      targetRoom = roomIdOrRoom;
    }

    if (!targetRoom) return;

    try {
      await roomService.joinRoom(targetRoom._id);
      const history = await chatService.getMessages(targetRoom._id);
      const formattedMessages = history.map((msg: any) => ({
        id: msg._id,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        type: msg.senderId?._id === user?.id ? 'sent' : 'received',
        senderId: msg.senderId?._id || 'Unknown',
        senderName: msg.senderId?.username || 'Unknown',
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
      await chatService.setCurrentRoom(targetRoom._id);
    } catch (error) {
      console.error('Failed to join room or fetch history:', error);
      showError('Room 입장 실패');
    }
  };

  const handleCreateRoom = async () => {
    if (!roomIdInput.trim() || !isConnected) return;

    const roomName = roomIdInput.trim();
    try {
      const newRoom = await chatService.createRoom({
        name: roomName,
        members: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        invitedOrgs: selectedOrgIds.length > 0 ? selectedOrgIds : undefined,
        isGroup: true,
      });

      await refreshRoomList();
      await handleRoomSelect(newRoom);

      setRoomIdInput('');
      setSelectedUserIds([]);
      setSelectedOrgIds([]);
      showSuccess('채팅방이 생성되었습니다.');
    } catch (error) {
      console.error('Failed to create room:', error);
      showError('Room 생성 실패');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleOrgSelection = (orgId: string) => {
    setSelectedOrgIds((prev) => (prev.includes(orgId) ? prev.filter((id) => id !== orgId) : [...prev, orgId]));
  };

  const leaveRoom = async () => {
    if (!currentRoom || !isConnected) return;

    const roomId = currentRoom._id;
    try {
      await roomService.leaveRoom(roomId);
      setCurrentRoom(null);
      setMessages([]);
      await chatService.setCurrentRoom(null);
    } catch (error) {
      console.error('Failed to leave room:', error);
      showError('Room 나가기 실패');
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
    userList,
    orgList,
    selectedUserIds,
    selectedOrgIds,
    toggleUserSelection,
    toggleOrgSelection,
    sendMessage,
    handleRoomSelect,
    handleCreateRoom,
    leaveRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    socketId,
    debugEnabled,
    toggleDebug,
  };
}
