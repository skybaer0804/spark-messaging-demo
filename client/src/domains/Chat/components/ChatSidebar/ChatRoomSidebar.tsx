import { memo } from 'preact/compat';
import { useEffect, useState, useMemo } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import {
  IconX,
  IconHash,
  IconLock,
  IconMessageCircle,
  IconHierarchy,
  IconChevronDown,
  IconChevronRight,
} from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { getDirectChatName } from '../../utils/chatUtils';
import { ChatSidebarHeader } from './ChatSidebarHeader';
import type { ChatRoom, ChatUser, Workspace } from '../../types';

export interface ChatRoomSidebarProps {
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
  setActiveView: (view: 'chat' | 'directory' | 'home') => void;
}

export const ChatRoomSidebar = memo(
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
    onUserClick,
    setActiveView,
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
                setActiveView={setActiveView}
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
