import { memo } from 'preact/compat';
import { useEffect } from 'preact/hooks';
import { useChatSidebar } from './hooks/useChatSidebar';
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
  IconDotsVertical,
} from '@tabler/icons-preact';
import { ChatSidebarHeader } from './ChatSidebarHeader';

export const ChatSidebar = memo(() => {
  const {
    userList,
    selectedUserIds,
    toggleUserSelection,
    currentRoom,
    handleRoomSelect,
    leaveRoom,
    startDirectChat,
    handleCreateRoom,
    roomIdInput,
    setRoomIdInput,
    contextMenu,
    setContextMenu,
    isSearching,
    setIsSearching,
    searchQuery,
    setSearchQuery,
    searchFocusIndex,
    allSearchResults,
    handleSearchKeyDown,
    expandedSections,
    handleContextMenu,
    toggleSection,
    groupedRooms,
    filteredUserList,
  } = useChatSidebar();

  // 검색창이 열릴 때 자동 포커스
  useEffect(() => {
    if (isSearching) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 포커스
      setTimeout(() => {
        const inputElement = document.querySelector('#chat-sidebar-search-input') as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
        }
      }, 0);
    }
  }, [isSearching]);

  const getRoomIcon = (room: any) => {
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

  const renderRoomItem = (room: any) => {
    const isActive = currentRoom?._id === room._id;
    const isFocused = searchFocusIndex >= 0 && allSearchResults[searchFocusIndex]?.data?._id === room._id;
    const roomName = room.displayName;
    const displayAvatar = room.displayAvatar;
    const displayStatus = room.displayStatus;
    const statusText = room.displayStatusText;

    return (
      <div
        key={room._id}
        className={`chat-app__sidebar-item ${isActive ? 'chat-app__sidebar-item--active' : ''} ${
          isFocused ? 'chat-app__sidebar-item--focused' : ''
        }`}
        onClick={() => {
          handleRoomSelect(room._id, room);
          setIsSearching(false);
          setSearchQuery('');
        }}
        onContextMenu={(e) => handleContextMenu(e, room._id)}
      >
        <div className="avatar">
          {room.type === 'direct' ? (
            <>
              <Avatar src={displayAvatar} variant="rounded" size="sm" style={{ backgroundColor: '#23D5AB' }}>
                {roomName?.substring(0, 1).toUpperCase()}
              </Avatar>
              <div className={`avatar-status avatar-status--${displayStatus || 'offline'}`} />
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
          <div className="chat-app__sidebar-item-name">{room.unreadCount ? <strong>{roomName}</strong> : roomName}</div>
          {room.type === 'direct' && statusText && (
            <div className="chat-app__sidebar-item-status-text">{statusText}</div>
          )}
        </div>
        <Flex align="center" gap="xs" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {room.unreadCount ? <div className="chat-app__sidebar-item-badge">{room.unreadCount}</div> : null}
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e as any, room._id);
            }}
            className="chat-app__sidebar-item-more"
          >
            <IconDotsVertical size={18} />
          </IconButton>
        </Flex>
      </div>
    );
  };

  const renderUserItem = (user: any) => {
    const isFocused = searchFocusIndex >= 0 && allSearchResults[searchFocusIndex]?.data?._id === user._id;
    return (
      <div
        key={user._id}
        className={`chat-app__sidebar-item ${isFocused ? 'chat-app__sidebar-item--focused' : ''}`}
        onClick={() => {
          startDirectChat(user._id);
          setIsSearching(false);
          setSearchQuery('');
        }}
      >
        <div className="avatar">
          <Avatar
            src={user.profileImage || user.avatar}
            variant="rounded"
            size="sm"
            style={{ backgroundColor: '#23D5AB' }}
          >
            {user.username.substring(0, 1).toUpperCase()}
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
    const rooms = (groupedRooms as any)[type];
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
      <div className="chat-app__sidebar-header">
        <Flex align="center" justify="space-between" style={{ padding: '12px 16px' }}>
          {isSearching ? (
            <Flex align="center" style={{ flex: 1, gap: '8px' }}>
              <Input
                id="chat-sidebar-search-input"
                fullWidth
                placeholder="검색어를 입력하세요..."
                value={searchQuery}
                onInput={(e) => setSearchQuery(e.currentTarget.value)}
                onKeyDown={(e) => {
                  // ESC 키로 검색창 닫기
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setIsSearching(false);
                    setSearchQuery('');
                    return;
                  }
                  handleSearchKeyDown(e as any);
                }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                }}
                className="chat-sidebar-search-input"
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
            backgroundColor: 'var(--color-bg-elevated, #fff)',
            border: '1px solid var(--color-border-default)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          <List style={{ padding: 0 }}>
            <ListItem
              onClick={(e) => {
                e.stopPropagation();
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
});
