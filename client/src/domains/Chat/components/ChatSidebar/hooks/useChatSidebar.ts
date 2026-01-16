import { useState, useMemo, useEffect } from 'preact/hooks';
import { useChat } from '../../../context/ChatContext';
import { useChatRoom } from '../../../hooks/useChatRoom';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';
import { authApi } from '@/core/api/ApiService';
import { getDirectChatName } from '../../../utils/chatUtils';
import { currentWorkspaceId, chatRoomList } from '@/stores/chatRoomsStore';

export const useChatSidebar = () => {
  const { roomList, userList, services, refreshRoomList, isConnected, currentRoom, setCurrentRoom } = useChat();

  const { handleRoomSelect: handleRoomSelectRaw } = useChatRoom();
  const { chat: chatService, room: roomService } = services;

  const { user: currentUser, signOut } = useAuth();
  const { navigate, pathname } = useRouterState();
  const { showSuccess, showInfo, showError } = useToast();

  const [roomIdInput, setRoomIdInput] = useState('chat');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedWorkspaceIds, setSelectedWorkspaceIds] = useState<string[]>([]);

  const [showInviteList, setShowInviteList] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showCreateChannelDialog, setShowCreateChannelDialog] = useState(false);
  const [showCreateTeamDialog, setShowCreateTeamDialog] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ name: '', topic: '', isPrivate: false });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; roomId: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocusIndex, setSearchFocusIndex] = useState(-1);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    direct: true,
    team: true,
    public: true,
    private: true,
    discussion: true,
  });

  const handleContextMenu = (e: MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, roomId });
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleUpdateStatus = async (status: string) => {
    try {
      await authApi.updateProfile({ status });
      setShowProfileMenu(false);
      showSuccess(`상태가 ${status}로 변경되었습니다.`);
      if (currentUser) {
        currentUser.status = status as any;
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setContextMenu(null);
      setShowCreateMenu(false);
      setShowProfileMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const { filteredRoomList, filteredUserList } = useMemo(() => {
    if (!searchQuery.trim()) return { filteredRoomList: roomList, filteredUserList: [] };
    const lowerQuery = searchQuery.toLowerCase();
    const currentUserId = currentUser?.id || (currentUser as any)?._id;

    const filteredRooms = roomList.filter((r) => {
      const roomName = r.type === 'direct' ? getDirectChatName(r, currentUserId) : r.name;
      return roomName?.toLowerCase().includes(lowerQuery);
    });

    const filteredUsers = userList.filter((u) => {
      if (u._id === currentUserId) return false;
      return u.username.toLowerCase().includes(lowerQuery);
    });

    return { filteredRoomList: filteredRooms, filteredUserList: filteredUsers };
  }, [roomList, userList, searchQuery, currentUser]);

  const groupedRooms = useMemo(() => {
    const currentUserId = currentUser?.id || (currentUser as any)?._id;

    const sortRooms = (rooms: any[]) => {
      return [...rooms].sort((a, b) => {
        const nameA = (a.displayName || getDirectChatName(a, currentUserId) || '').toLowerCase();
        const nameB = (b.displayName || getDirectChatName(b, currentUserId) || '').toLowerCase();
        if (nameA !== nameB) return nameA.localeCompare(nameB);
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    };

    return {
      direct: sortRooms(filteredRoomList.filter((r) => r.type === 'direct')),
      team: sortRooms(filteredRoomList.filter((r) => r.type === 'team')),
      public: sortRooms(filteredRoomList.filter((r) => r.type === 'public')),
      private: sortRooms(filteredRoomList.filter((r) => r.type === 'private')),
      discussion: sortRooms(filteredRoomList.filter((r) => r.type === 'discussion')),
    };
  }, [filteredRoomList, currentUser]);

  const allSearchResults = useMemo(() => {
    if (!isSearching || !searchQuery.trim()) return [];
    const results: { type: 'user' | 'room'; data: any }[] = [];

    // 1. Users
    filteredUserList.forEach((u) => results.push({ type: 'user', data: u }));

    // 2. Rooms by section
    const sections: (keyof typeof groupedRooms)[] = ['direct', 'team', 'public', 'private', 'discussion'];
    sections.forEach((section) => {
      const rooms = groupedRooms[section];
      rooms.forEach((r) => results.push({ type: 'room', data: r }));
    });

    return results;
  }, [isSearching, searchQuery, filteredUserList, groupedRooms]);

  useEffect(() => {
    setSearchFocusIndex(-1);
  }, [searchQuery, isSearching]);

  const handleSearchKeyDown = async (e: KeyboardEvent) => {
    if (!isSearching || allSearchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSearchFocusIndex((prev) => (prev < allSearchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSearchFocusIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const index = searchFocusIndex >= 0 ? searchFocusIndex : 0;
      const target = allSearchResults[index];
      if (target) {
        if (target.type === 'user') {
          await startDirectChat(target.data._id);
        } else {
          handleRoomSelect(target.data._id, target.data);
        }
        setIsSearching(false);
        setSearchQuery('');
      }
    }
  };

  const handleRoomSelect = (roomId: string, roomObj?: any) => {
    const room = roomObj || roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelectRaw(room);
      if (pathname !== `/chatapp/chat/${roomId}`) {
        navigate(`/chatapp/chat/${roomId}`);
      }
    }
  };

  const handleCreateRoom = async (type: string = 'direct', extraData: any = {}) => {
    if (type !== 'direct' && !roomIdInput.trim() && !extraData.name) return;
    if (!isConnected) return;

    try {
      const newRoom = await chatService.createRoom({
        name: extraData.name || (type === 'direct' ? undefined : roomIdInput.trim()),
        description: extraData.description,
        members: selectedUserIds.length > 0 ? selectedUserIds : extraData.members || undefined,
        workspaceId: extraData.workspaceId || currentWorkspaceId.value || '',
        type: type as any,
        teamId: extraData.teamId,
        parentId: extraData.parentId,
        isPrivate: extraData.isPrivate || false,
      });

      await refreshRoomList();

      if (newRoom && newRoom._id) {
        handleRoomSelect(newRoom._id, newRoom);
      }

      setRoomIdInput('');
      setSelectedUserIds([]);
      setSelectedWorkspaceIds([]);

      const typeMap: Record<string, string> = {
        direct: '1:1 대화방',
        public: '채널',
        private: '비공개 채널',
        team: '팀',
        discussion: '토론',
      };

      showSuccess(`${typeMap[type] || type}이 생성되었습니다.`);
    } catch (error) {
      console.error('Failed to create room:', error);
      showError('Room 생성 실패');
    }
  };

  const leaveRoom = async (roomId?: string) => {
    const targetRoomId = roomId || currentRoom?._id;
    if (!targetRoomId || !isConnected) return;

    try {
      if (currentRoom?._id === targetRoomId) {
        setCurrentRoom(null);
        navigate('/chatapp');
      }

      await chatService.leaveRoom(targetRoomId);
      await roomService.leaveRoom(targetRoomId);

      // v2.4.0: 낙관적 업데이트 - 목록에서 즉시 제거하여 반응성 향상
      chatRoomList.value = chatRoomList.value.filter((r: any) => r._id !== targetRoomId);

      // 서버 DB 반영 시간을 고려하여 약간의 지연 후 새로고침 (Race Condition 방지)
      setTimeout(() => {
        refreshRoomList();
      }, 500);

      showSuccess('채팅방을 나갔습니다.');
    } catch (error) {
      console.error('Failed to leave room:', error);
      showError('Room 나가기 실패');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const startDirectChat = async (userId: string) => {
    await handleCreateRoom('direct', { members: [userId] });
  };

  const handleCreateChannelSubmit = () => {
    handleCreateRoom(newRoomData.isPrivate ? 'private' : 'public', {
      name: newRoomData.name,
      description: newRoomData.topic,
      isPrivate: newRoomData.isPrivate,
    });
    setShowCreateChannelDialog(false);
    setNewRoomData({ name: '', topic: '', isPrivate: false });
  };

  const handleCreateTeamSubmit = () => {
    handleCreateRoom('team', {
      name: newRoomData.name,
      description: newRoomData.topic,
      isPrivate: newRoomData.isPrivate,
    });
    setShowCreateTeamDialog(false);
    setNewRoomData({ name: '', topic: '', isPrivate: false });
  };

  return {
    currentUser,
    isConnected,
    roomList,
    userList,
    currentRoom,
    roomIdInput,
    setRoomIdInput,
    selectedUserIds,
    toggleUserSelection,
    showInviteList,
    setShowInviteList,
    showCreateMenu,
    setShowCreateMenu,
    showProfileMenu,
    setShowProfileMenu,
    showCreateChannelDialog,
    setShowCreateChannelDialog,
    showCreateTeamDialog,
    setShowCreateTeamDialog,
    newRoomData,
    setNewRoomData,
    contextMenu,
    setContextMenu,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    searchFocusIndex,
    setSearchFocusIndex,
    allSearchResults,
    handleSearchKeyDown,
    expandedSections,
    handleContextMenu,
    toggleSection,
    handleUpdateStatus,
    handleLogout,
    groupedRooms,
    filteredUserList,
    handleRoomSelect,
    handleCreateChannelSubmit,
    handleCreateTeamSubmit,
    leaveRoom,
    startDirectChat,
    showInfo,
    navigate,
    handleCreateRoom,
  };
};
