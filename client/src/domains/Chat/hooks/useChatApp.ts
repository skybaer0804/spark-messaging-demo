import { useState, useEffect } from 'preact/hooks';
import { useToast } from '@/core/context/ToastContext';
import { setChatCurrentRoom, setChatRoomList, currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useChat } from '../context/ChatContext';
import { useChatRoom } from './useChatRoom';
import { ChatRoom } from '../types';

export function useChatApp() {
  const {
    isConnected,
    socketId,
    roomList,
    userList,
    workspaceList,
    services,
    refreshRoomList,
    debugEnabled,
    toggleDebug,
  } = useChat();

  const { currentRoom, messages, sendMessage, handleRoomSelect, setCurrentRoom, setMessages } = useChatRoom();

  const [input, setInput] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { showSuccess, showError } = useToast();

  const { room: roomService, fileTransfer: fileTransferService, chat: chatService } = services;

  // 전역 사이드바 동기화
  useEffect(() => {
    setChatRoomList(roomList.map((r: ChatRoom) => r.name || ''));
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

  const handleCreateRoom = async (type: ChatRoom['type'] = 'direct', extraData: any = {}) => {
    // direct의 경우 이름이 없어도 멤버가 있으면 생성 가능
    if (type !== 'direct' && !roomIdInput.trim() && !extraData.name) return;
    if (!isConnected) return;

    try {
      const newRoom = await chatService.createRoom({
        name: extraData.name || (type === 'direct' ? undefined : roomIdInput.trim()),
        description: extraData.description,
        members: selectedUserIds.length > 0 ? selectedUserIds : extraData.members || undefined,
        workspaceId: extraData.workspaceId || currentWorkspaceId.value || '',
        type,
        teamId: extraData.teamId,
        parentId: extraData.parentId,
        isPrivate: extraData.isPrivate || false,
      });

      await refreshRoomList();
      await handleRoomSelect(newRoom);

      setRoomIdInput('');
      setSelectedUserIds([]);
      setSelectedWorkspaceIds([]);
      showSuccess(`${type} 채팅방이 생성되었습니다.`);
    } catch (error) {
      console.error('Failed to create room:', error);
      showError('Room 생성 실패');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const toggleWorkspaceSelection = (workspaceId: string) => {
    setSelectedWorkspaceIds((prev) =>
      prev.includes(workspaceId) ? prev.filter((id) => id !== workspaceId) : [...prev, workspaceId],
    );
  };

  const leaveRoom = async () => {
    if (!currentRoom || !isConnected) return;

    try {
      // 1. DB에서 제거 (UserChatRoom 삭제 및 Room 멤버에서 제거)
      await chatService.leaveRoom(currentRoom._id);

      // 2. 소켓 채널 퇴장
      await roomService.leaveRoom(currentRoom._id);

      // 3. 클라이언트 상태 초기화
      setCurrentRoom(null);
      setMessages([]);
      await chatService.setCurrentRoom(null);

      // 4. 목록 새로고침
      await refreshRoomList();

      showSuccess('채팅방을 나갔습니다.');
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
    workspaceList,
    selectedUserIds,
    selectedWorkspaceIds,
    toggleUserSelection,
    toggleWorkspaceSelection,
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
    setCurrentRoom,
  };
}
