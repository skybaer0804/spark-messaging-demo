import { useChatApp } from './hooks/useChatApp';
import { formatTimestamp } from '@/core/utils/messageUtils';
import { formatFileSize, downloadFile } from '@/core/utils/fileUtils';
import { useRef, useEffect, useState, useMemo } from 'preact/hooks';
import { memo } from 'preact/compat';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Divider } from '@/ui-components/Divider/Divider';
import {
  IconX,
  IconFile,
  IconDownload,
  IconHash,
  IconLock,
  IconMessageCircle,
  IconHierarchy,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-preact';
import { Button } from '@/ui-components/Button/Button';
import { chatPendingJoinRoom, clearPendingJoinChatRoom } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { ChatDataProvider } from './context/ChatDataProvider';
import { useRouterState } from '@/routes/RouterState';
import { getDirectChatName } from './utils/chatUtils';
import { ChatSidebarHeader } from './components/ChatSidebar/ChatSidebarHeader';
import { ChatEmptyState } from './components/ChatEmptyState';
import { DirectoryView } from './components/Directory/DirectoryView';
import { ChatHeader } from './components/ChatHeader';
import { ChatMemberPanel } from './components/ChatMemberPanel';
import { ChatInput } from './components/ChatInput';
import './ChatApp.scss';

import type { ChatRoom, ChatUser, Workspace } from './types';

interface ChatRoomSidebarProps {
  isConnected: boolean;
  roomIdInput: string;
  setRoomIdInput: (next: string) => void;
  handleCreateRoom: (type: ChatRoom['type'], extraData?: any) => void;
  roomList: ChatRoom[];
  userList: ChatUser[];
  workspaceList: Workspace[];
  selectedUserIds: string[];
  selectedWorkspaceIds: string[];
  toggleUserSelection: (userId: string) => void;
  toggleWorkspaceSelection: (workspaceId: string) => void;
  currentRoom: ChatRoom | null;
  handleRoomSelect: (roomId: string) => void;
  leaveRoom: (roomId?: string) => void; // v2.4.0: roomId 선택 사항 추가
  onUserClick?: (userId: string) => void;
}

const ChatRoomSidebar = memo(
  ({
    roomIdInput,
    setRoomIdInput,
    handleCreateRoom,
    roomList,
    userList,
    selectedUserIds,
    toggleUserSelection,
    currentRoom,
    handleRoomSelect,
    leaveRoom,
    onUserClick, // 추가
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isConnected: _isConnected,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    workspaceList: _workspaceList,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedWorkspaceIds: _selectedWorkspaceIds,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    toggleWorkspaceSelection: _toggleWorkspaceSelection,
  }: ChatRoomSidebarProps) => {
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; roomId: string } | null>(null);
    const [isSearching, setIsSearching] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      direct: true,
      team: true,
      public: true,
      private: true,
      discussion: true,
    });
    const { user: currentUser } = useAuth();

    const handleContextMenu = (e: MouseEvent, roomId: string) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, roomId });
    };

    const toggleSection = (section: string) => {
      setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    useEffect(() => {
      const handleClick = () => {
        setContextMenu(null);
      };
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }, []);

    const getRoomIcon = (room: ChatRoom) => {
      switch (room.type) {
        case 'direct':
          return null;
        case 'public':
          return <IconHash size={18} />;
        case 'private':
          return <IconLock size={18} />;
        case 'team':
          return <IconHierarchy size={18} />;
        case 'discussion':
          return <IconMessageCircle size={18} />;
        default:
          return <IconHash size={18} />;
      }
    };

    // 검색 필터링된 룸 및 사용자 목록
    const { filteredRoomList, filteredUserList } = useMemo(() => {
      if (!searchQuery.trim()) return { filteredRoomList: roomList, filteredUserList: [] };
      const lowerQuery = searchQuery.toLowerCase();
      const currentUserId = currentUser?.id || (currentUser as any)?._id;

      const filteredRooms = roomList.filter((r) => {
        const roomName = r.type === 'direct' ? getDirectChatName(r, currentUserId) : r.name;
        return roomName?.toLowerCase().includes(lowerQuery);
      });

      // 이미 채팅방이 있는 유저는 제외하고 검색 (또는 포함해서 검색 결과에 노출)
      const filteredUsers = userList.filter((u) => {
        if (u._id === currentUserId) return false;
        return u.username.toLowerCase().includes(lowerQuery);
      });

      return { filteredRoomList: filteredRooms, filteredUserList: filteredUsers };
    }, [roomList, userList, searchQuery, currentUser]);

    const groupedRooms = useMemo(() => {
      const directRooms = filteredRoomList.filter((r) => r.type === 'direct');

      return {
        direct: directRooms,
        team: filteredRoomList.filter((r) => r.type === 'team'),
        public: filteredRoomList.filter((r) => r.type === 'public'),
        private: filteredRoomList.filter((r) => r.type === 'private'),
        discussion: filteredRoomList.filter((r) => r.type === 'discussion'),
      };
    }, [filteredRoomList]);

    const renderRoomItem = (room: ChatRoom) => {
      const isActive = currentRoom?._id === room._id;
      const currentUserId = currentUser?.id || (currentUser as any)?._id;
      const roomName = room.displayName || getDirectChatName(room, currentUserId);
      const displayAvatar = room.type === 'direct' ? room.displayAvatar : null;
      const displayStatus = room.type === 'direct' ? room.displayStatus : 'offline';
      const directMember =
        room.type === 'direct'
          ? room.members?.find((m: any) => (m._id?.toString() || m.toString()) !== currentUserId?.toString())
          : null;

      return (
        <div
          key={room._id}
          className={`chat-app__sidebar-item ${isActive ? 'chat-app__sidebar-item--active' : ''}`}
          onClick={() => {
            handleRoomSelect(room._id);
            setIsSearching(false);
            setSearchQuery('');
          }}
          onContextMenu={(e) => handleContextMenu(e, room._id)}
        >
          <div className="avatar">
            {room.type === 'direct' ? (
              <>
                <Avatar src={displayAvatar || directMember?.profileImage || directMember?.avatar} size="sm">
                  {roomName?.substring(0, 1)}
                </Avatar>
                <div className={`avatar-status avatar-status--${displayStatus || directMember?.status || 'offline'}`} />
              </>
            ) : (
              <Avatar
                variant="rounded"
                size="sm"
                style={{ backgroundColor: room.type === 'team' ? '#e11d48' : '#64748b' }}
              >
                {room.type === 'team' ? roomName?.substring(0, 1).toUpperCase() : getRoomIcon(room)}
              </Avatar>
            )}
          </div>
          <div className="chat-app__sidebar-item-content">
            <div className="chat-app__sidebar-item-name">
              {room.unreadCount ? <strong>{roomName}</strong> : roomName}
            </div>
            {room.type === 'direct' && (room.displayStatusText || directMember?.statusText) && (
              <div className="chat-app__sidebar-item-status-text">
                {room.displayStatusText || directMember?.statusText}
              </div>
            )}
          </div>
          {room.unreadCount ? <div className="chat-app__sidebar-item-badge">{room.unreadCount}</div> : null}
        </div>
      );
    };

    const renderUserItem = (user: ChatUser) => {
      return (
        <div
          key={user._id}
          className="chat-app__sidebar-item"
          onClick={() => {
            onUserClick?.(user._id);
            setIsSearching(false);
            setSearchQuery('');
          }}
        >
          <div className="avatar">
            <Avatar src={user.profileImage || user.avatar} size="sm">
              {user.username.substring(0, 1)}
            </Avatar>
            <div className={`avatar-status avatar-status--${user.status || 'offline'}`} />
          </div>
          <div className="chat-app__sidebar-item-content">
            <div className="chat-app__sidebar-item-name">{user.username}</div>
            <div className="chat-app__sidebar-item-sub">
              {user.status || 'offline'} • {user.role || 'Member'}
            </div>
          </div>
        </div>
      );
    };

    const renderSection = (type: keyof typeof groupedRooms, label: string) => {
      const rooms = groupedRooms[type];
      // 검색 중일 때는 결과가 있는 섹션만 표시, 평상시에는 1:1 대화방 섹션은 항상 표시
      if (rooms.length === 0 && (isSearching || type !== 'direct')) return null;

      const isExpanded = expandedSections[type] !== false;

      return (
        <div key={type}>
          <div className="chat-app__sidebar-section-header" onClick={() => toggleSection(type)}>
            <span className="icon">{isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}</span>
            {label}
          </div>
          {isExpanded && <div className="chat-app__sidebar-section-content">{rooms.map(renderRoomItem)}</div>}
        </div>
      );
    };

    return (
      <div
        className="chat-app__sidebar"
        style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        {/* 2.2.0: 채팅 사이드바 헤더 - 프로필 및 툴바 */}
        <div className="chat-app__sidebar-header">
          <Flex align="center" justify="space-between" style={{ padding: '12px 16px' }}>
            {isSearching ? (
              <Flex align="center" style={{ flex: 1, gap: '8px' }}>
                <Input
                  fullWidth
                  autoFocus
                  placeholder="검색어를 입력하세요..."
                  value={searchQuery}
                  onInput={(e) => setSearchQuery(e.currentTarget.value)}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', color: '#fff' }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                >
                  <IconX size={20} />
                </IconButton>
              </Flex>
            ) : (
              <ChatSidebarHeader
                setIsSearching={setIsSearching}
                userList={userList}
                selectedUserIds={selectedUserIds}
                toggleUserSelection={toggleUserSelection}
                handleCreateRoom={handleCreateRoom}
                roomIdInput={roomIdInput}
                setRoomIdInput={setRoomIdInput}
              />
            )}
          </Flex>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isSearching && filteredUserList.length > 0 && (
            <div>
              <div className="chat-app__sidebar-section-header">사용자</div>
              <div className="chat-app__sidebar-section-content">{filteredUserList.map(renderUserItem)}</div>
            </div>
          )}
          {renderSection('direct', '개인 대화방')}
          {renderSection('team', 'Teams')}
          {renderSection('public', 'Channels')}
          {renderSection('private', 'Private Groups')}
          {renderSection('discussion', 'Discussion')}
        </div>

        {contextMenu && (
          <Paper
            elevation={4}
            style={{
              position: 'fixed',
              top: contextMenu.y,
              left: contextMenu.x,
              zIndex: 1000,
              padding: '4px 0',
              minWidth: '160px',
              backgroundColor: 'var(--color-bg-elevated, #fff)', // v2.4.0: 투명도 해결을 위해 고정 배경색 적용
              border: '1px solid var(--color-border-default)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            <List style={{ padding: 0 }}>
              <ListItem
                onClick={(e) => {
                  e.stopPropagation();
                  // v2.4.0: 선택한 방에서 즉시 나가기 가능하도록 개선
                  leaveRoom(contextMenu.roomId);
                  setContextMenu(null);
                }}
                style={{ cursor: 'pointer', padding: '8px 16px' }}
              >
                <Typography variant="body-medium" style={{ color: 'var(--color-text-error, #ff4d4f)' }}>
                  방 나가기
                </Typography>
              </ListItem>
            </List>
          </Paper>
        )}
      </div>
    );
  },
);

function ChatAppContent() {
  const { pathname, navigate } = useRouterState();

  // 경로 방어 로직: /chatapp 경로가 아닐 경우 렌더링하지 않음
  if (!pathname.startsWith('/chatapp')) {
    return null;
  }

  const {
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
    sendMessage,
    handleRoomSelect: handleRoomSelectRaw,
    handleCreateRoom,
    leaveRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    debugEnabled,
    toggleDebug,
    setCurrentRoom, // useChatRoom에서 받아오도록 확인 필요
  } = useChatApp();

  const [activeView, setActiveView] = useState<'chat' | 'directory' | 'home'>('home');
  const [directoryTab, setDirectoryTab] = useState<'channel' | 'team' | 'user'>('channel');

  useEffect(() => {
    if (pathname === '/chatapp/directory') {
      setActiveView('directory');
    } else if (pathname.startsWith('/chatapp/chat/')) {
      const roomId = pathname.split('/').pop();
      // currentRoom._id와 roomId가 다를 때만 onRoomSelect 호출 (불필요한 중복 호출 방지)
      if (roomId && currentRoom?._id !== roomId && roomList.length > 0) {
        onRoomSelect(roomId);
      }
      setActiveView('chat');
    } else if (currentRoom) {
      setActiveView('chat');
    } else {
      setActiveView('home');
    }
  }, [pathname, currentRoom?._id, roomList]);

  const onRoomSelect = (roomId: string) => {
    // roomList에서 찾기 시도
    const room = roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelectRaw(room);
      if (pathname !== `/chatapp/chat/${roomId}`) {
        navigate(`/chatapp/chat/${roomId}`);
      }
    } else {
      // 목록에 없으면(방금 생성된 경우 등) 강제 새로고침 후 재시도 가능하도록 로직 보완 필요
      // 현재는 useChatApp의 handleCreateRoom -> refreshRoomList -> handleRoomSelect 흐름이 있음
    }
  };

  const goToHome = () => {
    setCurrentRoom(null);
    navigate('/chatapp');
  };

  const startDirectChat = async (userId: string) => {
    // 서버에서 identifier 기반으로 기존 활성 방을 찾거나 새 방을 생성하도록 위임
    await handleCreateRoom('direct', { members: [userId] });
  };

  // Sidebar에서 "이 룸으로 들어가기" 요청을 보내면 여기서 실제 join을 수행
  const pendingJoinRoom = chatPendingJoinRoom.value;
  useEffect(() => {
    if (!pendingJoinRoom) return;
    if (!isConnected) return;

    onRoomSelect(pendingJoinRoom);
    clearPendingJoinChatRoom();
  }, [handleRoomSelectRaw, isConnected, pendingJoinRoom, roomList]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // v2.2.0: 하단 앵커용
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);
  const [showUserList, setShowUserList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user: currentUser } = useAuth();
  const { showSuccess } = useToast();

  const toggleGlobalNotifications = async (enabled: boolean) => {
    try {
      await authApi.updateNotificationSettings({ globalEnabled: enabled });
      showSuccess(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  // Auto-scroll to bottom (Anchor-based)
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        // scrollIntoView는 브라우저가 제공하는 더 안전하고 부드러운 스크롤 방식입니다.
        messagesEndRef.current.scrollIntoView({
          behavior: 'auto', // 즉시 이동
          block: 'end',
        });
      }
    };

    // 렌더링 주기를 고려하여 즉시 및 지연 실행
    scrollToBottom();
    const timer1 = setTimeout(scrollToBottom, 30);
    const timer2 = setTimeout(scrollToBottom, 100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [messages.length, currentRoom?._id]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileSend = async () => {
    if (selectedFiles.length > 0) {
      for (const file of selectedFiles) {
        await sendFile(file);
      }
      setSelectedFiles([]);
    }
  };

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageClick = (imageUrl: string, fileName: string) => {
    setImageModal({ url: imageUrl, fileName });
  };

  const handleCloseImageModal = () => {
    setImageModal(null);
  };

  // 모바일에서는 깊이 구조로 뷰 전환
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (activeView === 'home' || !currentRoom) {
    return (
      <Box style={{ display: 'flex', height: '100%', minHeight: 0 }} className="chat-app__container">
        <Box
          style={{
            width: isMobile ? '100%' : '300px',
            flexShrink: 0,
          }}
          className="chat-app__sidebar-wrapper"
        >
          <ChatRoomSidebar
            isConnected={isConnected}
            roomIdInput={roomIdInput}
            setRoomIdInput={setRoomIdInput}
            handleCreateRoom={handleCreateRoom}
            roomList={roomList}
            userList={userList}
            workspaceList={workspaceList}
            selectedUserIds={selectedUserIds}
            selectedWorkspaceIds={selectedWorkspaceIds}
            toggleUserSelection={toggleUserSelection}
            toggleWorkspaceSelection={toggleWorkspaceSelection}
            currentRoom={currentRoom}
            handleRoomSelect={onRoomSelect}
            leaveRoom={leaveRoom}
            onUserClick={startDirectChat}
          />
        </Box>
        {!isMobile && (
          <Box style={{ flex: 1, backgroundColor: 'var(--color-background-default)', height: '100%', minHeight: 0 }}>
            {activeView === 'directory' ? (
              <DirectoryView
                directoryTab={directoryTab}
                setDirectoryTab={setDirectoryTab}
                roomList={roomList}
                onRoomSelect={onRoomSelect}
                userList={userList}
                startDirectChat={startDirectChat}
              />
            ) : (
              <ChatEmptyState />
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (activeView === 'directory' && isMobile) {
    return (
      <DirectoryView
        directoryTab={directoryTab}
        setDirectoryTab={setDirectoryTab}
        roomList={roomList}
        onRoomSelect={onRoomSelect}
        userList={userList}
        startDirectChat={startDirectChat}
      />
    );
  }

  // Active Chat Room - 모바일에서는 채팅창만 표시
  return (
    <Box style={{ display: 'flex', height: '100%', minHeight: 0 }} className="chat-app__container">
      {!isMobile && (
        <Box style={{ width: '300px', flexShrink: 0 }} className="chat-app__sidebar-wrapper">
          <ChatRoomSidebar
            isConnected={isConnected}
            roomIdInput={roomIdInput}
            setRoomIdInput={setRoomIdInput}
            handleCreateRoom={handleCreateRoom}
            roomList={roomList}
            userList={userList}
            workspaceList={workspaceList}
            selectedUserIds={selectedUserIds}
            selectedWorkspaceIds={selectedWorkspaceIds}
            toggleUserSelection={toggleUserSelection}
            toggleWorkspaceSelection={toggleWorkspaceSelection}
            currentRoom={currentRoom}
            handleRoomSelect={onRoomSelect}
            leaveRoom={leaveRoom}
            onUserClick={startDirectChat}
          />
        </Box>
      )}
      <Flex
        direction="column"
        style={{
          flex: 1,
          backgroundColor: 'var(--color-background-default)',
          height: '100%',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Chat Header */}
        <ChatHeader
          isMobile={isMobile}
          goToHome={goToHome}
          currentRoom={currentRoom}
          showUserList={showUserList}
          setShowUserList={setShowUserList}
          setShowSettings={setShowSettings}
          toggleDebug={toggleDebug}
          debugEnabled={debugEnabled}
        />

        <Box style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Messages Area - Slack 스타일 배경 적용 */}
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff', // 메시지 영역은 다시 밝게
            }}
            ref={messagesRef}
          >
            <Stack spacing="md" style={{ flex: 1, minHeight: 0 }}>
              {messages.map((msg) => {
                const senderIdStr =
                  typeof msg.senderId === 'object' ? (msg.senderId as any)?._id?.toString() : msg.senderId?.toString();
                const currentUserIdStr = currentUser?.id?.toString() || (currentUser as any)?._id?.toString();

                const isOwnMessage =
                  (senderIdStr && currentUserIdStr && senderIdStr === currentUserIdStr) || msg.status === 'sending';
                return (
                  <Flex
                    key={msg._id}
                    direction="column"
                    align={isOwnMessage ? 'flex-end' : 'flex-start'}
                    style={{ width: '100%' }}
                  >
                    <Flex
                      direction="column"
                      align={isOwnMessage ? 'flex-end' : 'flex-start'}
                      style={{ maxWidth: '70%' }}
                    >
                      <Flex align="center" gap="sm" style={{ marginBottom: '4px' }}>
                        {!isOwnMessage && (
                          <Typography variant="caption" color="text-secondary">
                            {msg.senderName ||
                              (typeof msg.senderId === 'string' ? msg.senderId.substring(0, 6) : 'Unknown')}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text-tertiary">
                          {formatTimestamp(msg.timestamp)}
                        </Typography>
                      </Flex>
                      <Paper
                        elevation={1}
                        padding="sm"
                        style={{
                          borderRadius: isOwnMessage ? '12px 0 12px 12px' : '0 12px 12px 12px',
                          backgroundColor: isOwnMessage
                            ? 'var(--color-interactive-primary)'
                            : 'var(--color-surface-level-1)',
                          color: isOwnMessage ? 'var(--primitive-gray-0)' : 'inherit',
                          alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                          position: 'relative',
                        }}
                      >
                        {/* v2.4.0: 안읽음 카운트 표시 (Slack/Kakao 스타일) */}
                        {(() => {
                          const totalMembers = currentRoom.members?.length || 0;
                          const readCount = msg.readBy?.length || 0;
                          const unreadCount = totalMembers - readCount;

                          if (unreadCount > 0) {
                            return (
                              <Typography
                                variant="caption"
                                style={{
                                  position: 'absolute',
                                  [isOwnMessage ? 'left' : 'right']: '-24px',
                                  bottom: '2px',
                                  color: 'var(--primitive-yellow-600)',
                                  fontWeight: 'bold',
                                }}
                              >
                                {unreadCount}
                              </Typography>
                            );
                          }
                          return null;
                        })()}
                        {msg.fileData ? (
                          <Box>
                            {msg.fileData.fileType === 'image' && msg.fileData.data ? (
                              <Box>
                                <img
                                  src={msg.fileData.data}
                                  alt={msg.fileData.fileName}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                  }}
                                  onClick={() => handleImageClick(msg.fileData!.data!, msg.fileData!.fileName)}
                                />
                              </Box>
                            ) : (
                              <Flex align="center" gap="sm">
                                <IconFile size={24} />
                                <Box>
                                  <Typography variant="body-small" style={{ fontWeight: 'bold' }}>
                                    {msg.fileData.fileName}
                                  </Typography>
                                  <Typography variant="caption">{formatFileSize(msg.fileData.size)}</Typography>
                                </Box>
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    downloadFile(
                                      msg.fileData!.fileName,
                                      msg.fileData!.data || '',
                                      msg.fileData!.mimeType,
                                    )
                                  }
                                >
                                  <IconDownload size={16} />
                                </IconButton>
                              </Flex>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body-medium">{msg.content}</Typography>
                        )}
                      </Paper>
                    </Flex>
                  </Flex>
                );
              })}
              {/* v2.2.0: 하단 앵커 요소 */}
              <div ref={messagesEndRef} style={{ height: '1px', width: '100%' }} />
            </Stack>
          </Box>

          {/* User List Sidebar */}
          {showUserList && <ChatMemberPanel members={currentRoom.members} />}
        </Box>

        {/* Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          selectedFiles={selectedFiles}
          uploadingFile={uploadingFile}
          uploadProgress={uploadProgress}
          isConnected={isConnected}
          placeholder={
            !isConnected
              ? 'Connecting...'
              : `Message #${
                  currentRoom.displayName ||
                  getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)
                }`
          }
          showFileUpload={true}
          onSendMessage={sendMessage}
          onSendFile={handleFileSend}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
          onKeyPress={handleKeyPress}
          classNamePrefix="chat-app"
        />

        {/* Image Modal */}
        {imageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.8)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={handleCloseImageModal}
          >
            <img src={imageModal.url} alt={imageModal.fileName} style={{ maxWidth: '90%', maxHeight: '90%' }} />
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 3000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onClick={() => setShowSettings(false)}
          >
            <Paper
              padding="lg"
              style={{ width: '400px', backgroundColor: 'var(--color-bg-default)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="h3" style={{ marginBottom: '16px' }}>
                Notification Settings
              </Typography>
              <Stack spacing="md">
                <Flex justify="space-between" align="center">
                  <Typography variant="body-medium">Global Notifications</Typography>
                  {/* Switch component usage depends on implementation, assuming common props */}
                  <input
                    type="checkbox"
                    checked={(currentUser as any)?.notificationSettings?.globalEnabled !== false}
                    onChange={(e) => toggleGlobalNotifications(e.currentTarget.checked)}
                  />
                </Flex>
                <Divider />
                <Typography variant="caption" color="text-secondary">
                  More detailed per-room settings coming soon...
                </Typography>
                <Button fullWidth onClick={() => setShowSettings(false)}>
                  Close
                </Button>
              </Stack>
            </Paper>
          </div>
        )}
      </Flex>
    </Box>
  );
}

export function ChatApp() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <ChatDataProvider>
      <ChatAppContent />
    </ChatDataProvider>
  );
}
