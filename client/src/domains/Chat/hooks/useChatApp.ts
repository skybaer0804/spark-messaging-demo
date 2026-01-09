import { useState, useEffect } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import { setChatCurrentRoom, setChatRoomList } from '@/stores/chatRoomsStore';
import { useChat } from '../context/ChatContext';
import { useChatRoom } from './useChatRoom';
import { ChatRoom } from '../types';

export interface Organization {
  _id: string;
  name: string;
  dept1: string;
  dept2?: string;
}

export function useChatApp() {
  const { isConnected, socketId, roomList, userList, orgList, services, refreshRoomList, debugEnabled, toggleDebug } =
    useChat();

  const { currentRoom, messages, sendMessage, handleRoomSelect, setCurrentRoom, setMessages } = useChatRoom();

  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { showSuccess, showError } = useToast();

  const { room: roomService, fileTransfer: fileTransferService, chat: chatService } = services;

  // 전역 사이드바 동기화
  useEffect(() => {
    setChatRoomList(roomList.map((r: ChatRoom) => r.name));
  }, [roomList]);

  useEffect(() => {
    setChatCurrentRoom(currentRoom?.name || null);
  }, [currentRoom]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput('');
  };

  const handleFileSend = async (file: File) => {
    if (!isConnected || !currentRoom) return;

    setUploadingFile(file);
    setUploadProgress(0);

    try {
      await fileTransferService.sendFile(currentRoom._id, file, (progress: number) => {
        setUploadProgress(progress);
      });
      setUploadingFile(null);
      setUploadProgress(0);
      showSuccess('파일 전송 완료');
    } catch (error) {
      console.error('Failed to send file:', error);
      setUploadingFile(null);
      setUploadProgress(0);
      showError('파일 전송 실패');
    }
  };

  const handleCreateRoom = async () => {
    if (!roomIdInput.trim() || !isConnected) return;

    try {
      const newRoom = await chatService.createRoom({
        name: roomIdInput.trim(),
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

    try {
      await roomService.leaveRoom(currentRoom._id);
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
    sendMessage: handleSendMessage,
    handleRoomSelect,
    handleCreateRoom,
    leaveRoom,
    sendFile: handleFileSend,
    uploadingFile,
    uploadProgress,
    socketId,
    debugEnabled,
    toggleDebug,
  };
}
