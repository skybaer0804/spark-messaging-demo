import { useChatApp } from './hooks/useChatApp';
import { formatTimestamp } from '@/utils/messageUtils';
import { formatFileSize, downloadFile } from '@/utils/fileUtils';
import { useRef, useEffect, useState } from 'preact/hooks';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Input } from '@/ui-component/Input/Input';
import { Box } from '@/ui-component/Layout/Box';
import { Flex } from '@/ui-component/Layout/Flex';
import { Stack } from '@/ui-component/Layout/Stack';
import { Typography } from '@/ui-component/Typography/Typography';
import { Paper } from '@/ui-component/Paper/Paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-component/List/List';
import { Avatar } from '@/ui-component/Avatar/Avatar';
import {
  IconArrowLeft,
  IconSend,
  IconPaperclip,
  IconX,
  IconFile,
  IconDownload,
  IconBug,
  IconBugOff,
  IconUsers,
  IconSettings,
} from '@tabler/icons-react';
import { Button } from '@/ui-component/Button/Button';
import { chatPendingJoinRoom, clearPendingJoinChatRoom } from '@/stores/chatRoomsStore';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/services/authService';
import { useToast } from '@/context/ToastContext';
import './ChatApp.scss';

import type { Message, ChatRoom, ChatUser } from './types';
import type { Organization } from './hooks/useChatApp';

interface ChatRoomSidebarProps {
  isConnected: boolean;
  roomIdInput: string;
  setRoomIdInput: (next: string) => void;
  handleCreateRoom: () => void;
  roomList: ChatRoom[];
  userList: ChatUser[];
  orgList: Organization[];
  selectedUserIds: string[];
  selectedOrgIds: string[];
  toggleUserSelection: (userId: string) => void;
  toggleOrgSelection: (orgId: string) => void;
  currentRoom: ChatRoom | null;
  handleRoomSelect: (roomId: string) => void;
  leaveRoom: () => void;
}

function ChatRoomSidebar({
  isConnected,
  roomIdInput,
  setRoomIdInput,
  handleCreateRoom,
  roomList,
  userList,
  orgList,
  selectedUserIds,
  selectedOrgIds,
  toggleUserSelection,
  toggleOrgSelection,
  currentRoom,
  handleRoomSelect,
  leaveRoom,
}: ChatRoomSidebarProps) {
  const [showInviteList, setShowInviteList] = useState(false);
  const [inviteTab, setInviteTab] = useState<'user' | 'org'>('user');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; roomId: string } | null>(null);

  const handleContextMenu = (e: MouseEvent, roomId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, roomId });
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <Paper
      elevation={0}
      square
      style={{
        height: '100%',
        borderRight: '1px solid var(--color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      className="chat-app__sidebar"
    >
      <Box padding="md">
        <Stack spacing="sm">
          <Flex gap="sm">
            <Input
              value={roomIdInput}
              onInput={(e) => {
                setRoomIdInput(e.currentTarget.value);
                if (e.currentTarget.value && !showInviteList) setShowInviteList(true);
              }}
              placeholder="New Room Name"
              disabled={!isConnected}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
              fullWidth
            />
            <IconButton
              onClick={() => setShowInviteList(!showInviteList)}
              color={showInviteList ? 'primary' : 'secondary'}
              title="초대할 유저 목록"
            >
              <IconUsers size={20} />
            </IconButton>
          </Flex>

          {showInviteList && (
            <Paper
              variant="outlined"
              style={{ maxHeight: '300px', overflowY: 'auto', backgroundColor: 'var(--color-bg-tertiary)' }}
            >
              <Flex style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setInviteTab('user')}
                  style={{
                    borderRadius: 0,
                    borderBottom: inviteTab === 'user' ? '2px solid var(--color-interactive-primary)' : 'none',
                  }}
                >
                  Users
                </Button>
                <Button
                  variant="ghost"
                  fullWidth
                  size="sm"
                  onClick={() => setInviteTab('org')}
                  style={{
                    borderRadius: 0,
                    borderBottom: inviteTab === 'org' ? '2px solid var(--color-interactive-primary)' : 'none',
                  }}
                >
                  Orgs
                </Button>
              </Flex>

              {inviteTab === 'user' ? (
                <List size="small">
                  {userList.map((user) => (
                    <ListItem
                      key={user._id}
                      onClick={() => toggleUserSelection(user._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <ListItemAvatar>
                        <Avatar src={user.avatar} size="small">
                          {user.username.substring(0, 1)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={user.username} primaryTypographyProps={{ variant: 'body-small' }} />
                      <input
                        type="checkbox"
                        checked={selectedUserIds.includes(user._id)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <List size="small">
                  {orgList.map((org) => (
                    <ListItem key={org._id} onClick={() => toggleOrgSelection(org._id)} style={{ cursor: 'pointer' }}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" size="small">
                          {org.name.substring(0, 1)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={org.name}
                        secondary={`${org.dept1}${org.dept2 ? ' > ' + org.dept2 : ''}`}
                        primaryTypographyProps={{ variant: 'body-small', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.includes(org._id)}
                        readOnly
                        style={{ cursor: 'pointer' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          )}

          <Button
            onClick={handleCreateRoom}
            disabled={!isConnected || !roomIdInput.trim()}
            size="sm"
            variant="primary"
            fullWidth
          >
            Create Room{' '}
            {(selectedUserIds.length > 0 || selectedOrgIds.length > 0) &&
              `(${selectedUserIds.length}U, ${selectedOrgIds.length}O)`}
          </Button>
        </Stack>
      </Box>
      <Box style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--color-border-default)' }}>
        <List>
          {roomList.length === 0
            ? !isConnected && (
                <Box padding="md">
                  <Typography variant="body-medium" color="text-secondary" align="center">
                    Connecting...
                  </Typography>
                </Box>
              )
            : roomList.map((room) => (
                <ListItem
                  key={room._id}
                  onClick={() => handleRoomSelect(room._id)}
                  onContextMenu={(e) => handleContextMenu(e, room._id)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: currentRoom?._id === room._id ? 'var(--color-bg-tertiary)' : 'transparent',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar variant="rounded" style={{ backgroundColor: 'var(--primitive-primary-500)' }}>
                      {room.name.substring(0, 2).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={room.name} secondary={currentRoom?._id === room._id ? 'Active' : ''} />
                </ListItem>
              ))}
        </List>
      </Box>

      {contextMenu && (
        <Paper
          elevation={4}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 1000,
            padding: '4px 0',
            minWidth: '120px',
            backgroundColor: 'var(--color-bg-default)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <List size="small" style={{ padding: 0 }}>
            <ListItem
              onClick={() => {
                if (currentRoom?._id === contextMenu.roomId) {
                  leaveRoom();
                } else {
                  toast.info('해당 방에 먼저 들어가주세요.');
                }
                setContextMenu(null);
              }}
              style={{ cursor: 'pointer', '&:hover': { backgroundColor: 'var(--color-bg-tertiary)' } }}
            >
              <ListItemText primary="방 나가기" primaryTypographyProps={{ variant: 'body-small', color: 'error' }} />
            </ListItem>
          </List>
        </Paper>
      )}
    </Paper>
  );
}

export function ChatApp() {
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
  } = useChatApp();

  // Sidebar에서 "이 룸으로 들어가기" 요청을 보내면 여기서 실제 join을 수행
  const pendingJoinRoom = chatPendingJoinRoom.value;
  useEffect(() => {
    if (!pendingJoinRoom) return;
    if (!isConnected) return;

    handleRoomSelect(pendingJoinRoom);
    clearPendingJoinChatRoom();
  }, [handleRoomSelect, isConnected, pendingJoinRoom]);

  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  const toggleGlobalNotifications = async (enabled: boolean) => {
    try {
      await authApi.updateNotificationSettings({ globalEnabled: enabled });
      toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages.length, currentRoom]);

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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // --- Components Renderers ---

  // Empty State for Chat Area
  const EmptyState = () => (
    <Flex
      direction="column"
      align="center"
      justify="center"
      style={{ height: '100%', color: 'var(--color-text-tertiary)' }}
    >
      <Typography variant="h2" style={{ marginBottom: '8px' }}>
        Start Messaging
      </Typography>
      <Typography variant="body-medium">Select a room from the sidebar to join the conversation.</Typography>
    </Flex>
  );

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

  if (!currentRoom) {
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
            orgList={orgList}
            selectedUserIds={selectedUserIds}
            selectedOrgIds={selectedOrgIds}
            toggleUserSelection={toggleUserSelection}
            toggleOrgSelection={toggleOrgSelection}
            currentRoom={currentRoom}
            handleRoomSelect={handleRoomSelect}
            leaveRoom={leaveRoom}
          />
        </Box>
        {!isMobile && (
          <Box style={{ flex: 1, backgroundColor: 'var(--color-background-default)', height: '100%', minHeight: 0 }}>
            <EmptyState />
          </Box>
        )}
      </Box>
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
            orgList={orgList}
            selectedUserIds={selectedUserIds}
            selectedOrgIds={selectedOrgIds}
            toggleUserSelection={toggleUserSelection}
            toggleOrgSelection={toggleOrgSelection}
            currentRoom={currentRoom}
            handleRoomSelect={handleRoomSelect}
            leaveRoom={leaveRoom}
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
        <Paper square elevation={1} padding="md" style={{ zIndex: 10, flexShrink: 0 }}>
          <Stack direction="row" align="center" spacing="md">
            <IconButton onClick={leaveRoom}>
              <IconArrowLeft />
            </IconButton>
            <Avatar variant="rounded">{currentRoom.name.substring(0, 2)}</Avatar>
            <Box style={{ flex: 1 }}>
              <Typography variant="h3">{currentRoom.name}</Typography>
            </Box>
            <IconButton
              onClick={() => setShowUserList(!showUserList)}
              color={showUserList ? 'primary' : 'secondary'}
              title="참여자 목록"
            >
              <IconUsers size={20} />
            </IconButton>
            <IconButton onClick={() => setShowSettings(true)} color="secondary" title="설정">
              <IconSettings size={20} />
            </IconButton>
            <IconButton onClick={toggleDebug} color={debugEnabled ? 'primary' : 'secondary'} title="디버그 모드 토글">
              {debugEnabled ? <IconBug size={20} /> : <IconBugOff size={20} />}
            </IconButton>
          </Stack>
        </Paper>

        <Box style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* Messages Area */}
          <Box
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              padding: 'var(--space-gap-lg)',
              display: 'flex',
              flexDirection: 'column',
            }}
            ref={messagesRef}
          >
            <Stack spacing="md" style={{ flex: 1, minHeight: 0 }}>
              {messages.map((msg) => {
                const isOwnMessage = msg.senderId === socketId || msg.type === 'sent';
                return (
                  <Flex
                    key={msg.id}
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
                        <Typography variant="caption" color="text-secondary">
                          {msg.senderName || (msg.senderId ? msg.senderId.substring(0, 6) : 'Unknown')}
                        </Typography>
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
                        }}
                      >
                        {msg.fileData ? (
                          <Box>
                            {msg.fileData.fileType === 'image' ? (
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
                                  onClick={() => handleImageClick(msg.fileData!.data, msg.fileData!.fileName)}
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
                                    downloadFile(msg.fileData!.fileName, msg.fileData!.data, msg.fileData!.mimeType)
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
            </Stack>
          </Box>

          {/* User List Sidebar */}
          {showUserList && (
            <Paper
              elevation={0}
              square
              style={{
                width: '240px',
                borderLeft: '1px solid var(--color-border-default)',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--color-bg-secondary)',
              }}
            >
              <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
                <Typography variant="h4">참여자 ({currentRoom.members?.length || 0})</Typography>
              </Box>
              <Box style={{ flex: 1, overflowY: 'auto' }}>
                <List>
                  {currentRoom.members?.map((member) => (
                    <ListItem key={member._id}>
                      <ListItemAvatar>
                        <Avatar
                          src={member.avatar}
                          variant="circular"
                          size="small"
                          style={{
                            border: `2px solid ${
                              member.status === 'online' ? 'var(--color-success-main)' : 'var(--color-text-tertiary)'
                            }`,
                          }}
                        >
                          {member.username.substring(0, 1).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={member.username}
                        secondary={member.status === 'online' ? 'Online' : 'Offline'}
                        primaryTypographyProps={{ variant: 'body-small', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Input Area */}
        <Paper square elevation={4} padding="md" style={{ flexShrink: 0 }}>
          <Stack spacing="sm">
            {/* File Previews */}
            {selectedFiles.length > 0 && (
              <Flex gap="sm" wrap="wrap">
                {selectedFiles.map((file, index) => (
                  <Paper
                    key={index}
                    variant="outlined"
                    padding="sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <IconFile size={16} />
                    <Typography variant="caption">{file.name}</Typography>
                    <IconButton size="small" onClick={() => handleFileRemove(index)}>
                      <IconX size={14} />
                    </IconButton>
                  </Paper>
                ))}
              </Flex>
            )}
            {uploadingFile && (
              <Box>
                <Typography variant="caption">
                  Uploading {uploadingFile.name}... {Math.round(uploadProgress)}%
                </Typography>
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--primitive-gray-200)',
                    borderRadius: '2px',
                    marginTop: '4px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${uploadProgress}%`,
                      backgroundColor: 'var(--primitive-primary-500)',
                      borderRadius: '2px',
                    }}
                  ></div>
                </div>
              </Box>
            )}

            <Flex gap="sm" align="center">
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} style={{ display: 'none' }} multiple />
              <IconButton onClick={() => fileInputRef.current?.click()} color="secondary">
                <IconPaperclip />
              </IconButton>
              <Box style={{ flex: 1 }} ref={inputWrapperRef}>
                <Input
                  value={input}
                  onCompositionStart={() => setIsComposing(true)}
                  onCompositionEnd={() => setIsComposing(false)}
                  onInput={(e) => {
                    const target = e.currentTarget as HTMLInputElement;
                    setInput(target.value);
                    // 한글 입력 시 포커스 유지
                    if (isComposing) {
                      requestAnimationFrame(() => {
                        const inputElement = inputWrapperRef.current?.querySelector('input') as HTMLInputElement;
                        if (inputElement && document.activeElement !== inputElement) {
                          inputElement.focus();
                        }
                      });
                    }
                  }}
                  onKeyPress={(e) => {
                    if (!isComposing) {
                      handleKeyPress(e);
                    }
                  }}
                  placeholder={!isConnected ? 'Connecting...' : `Message #${currentRoom.name}`}
                  disabled={!isConnected}
                  fullWidth
                  className="chat-app__input"
                />
              </Box>
              <IconButton
                onClick={selectedFiles.length > 0 ? handleFileSend : sendMessage}
                color="primary"
                disabled={!isConnected || (!input.trim() && selectedFiles.length === 0)}
              >
                <IconSend />
              </IconButton>
            </Flex>
          </Stack>
        </Paper>

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
              justify: 'center',
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
                    checked={(user as any)?.notificationSettings?.globalEnabled !== false}
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
