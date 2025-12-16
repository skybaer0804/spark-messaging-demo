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
  IconCirclePlus,
} from '@tabler/icons-react';
import './ChatApp.scss';

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
    sendMessage,
    handleRoomSelect,
    handleCreateRoom,
    leaveRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    socketId,
  } = useChatApp();

  const messagesRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imageModal, setImageModal] = useState<{ url: string; fileName: string } | null>(null);

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

  // Room List Sidebar
  const Sidebar = () => (
    <Paper
      elevation={0}
      square
      style={{
        height: '100%',
        borderRight: '1px solid var(--color-border-default)',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="chat-app__sidebar"
    >
      <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <Stack direction="row" spacing="sm">
          <Input
            value={roomIdInput}
            onInput={(e) => setRoomIdInput(e.currentTarget.value)}
            placeholder="New Room Name"
            disabled={!isConnected}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            fullWidth
          />
          <IconButton
            onClick={handleCreateRoom}
            disabled={!isConnected || !roomIdInput.trim()}
            size="small"
            color="primary"
            title="새 채팅방 생성"
          >
            <IconCirclePlus size={20} />
          </IconButton>
        </Stack>
      </Box>
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {roomList.length === 0 ? (
            <Box padding="md">
              <Typography variant="body-medium" color="text-secondary" align="center">
                {!isConnected ? 'Connecting...' : 'No rooms yet.'}
              </Typography>
            </Box>
          ) : (
            roomList.map((room) => (
              <ListItem
                key={room}
                onClick={() => handleRoomSelect(room)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: currentRoom === room ? 'var(--color-bg-tertiary)' : 'transparent',
                }}
              >
                <ListItemAvatar>
                  <Avatar variant="rounded" style={{ backgroundColor: 'var(--primitive-primary-500)' }}>
                    {room.substring(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={room} secondary={currentRoom === room ? 'Active' : ''} />
              </ListItem>
            ))
          )}
        </List>
      </Box>
    </Paper>
  );

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
      <Box style={{ display: 'flex', minHeight: '100%' }} className="chat-app__container">
        <Box
          style={{
            width: isMobile ? '100%' : '300px',
            flexShrink: 0,
          }}
          className="chat-app__sidebar-wrapper"
        >
          <Sidebar />
        </Box>
        {!isMobile && (
          <Box style={{ flex: 1, backgroundColor: 'var(--color-background-default)' }}>
            <EmptyState />
          </Box>
        )}
      </Box>
    );
  }

  // Active Chat Room - 모바일에서는 채팅창만 표시
  return (
    <Box style={{ display: 'flex', minHeight: '100%' }} className="chat-app__container">
      {!isMobile && (
        <Box style={{ width: '300px', flexShrink: 0 }} className="chat-app__sidebar-wrapper">
          <Sidebar />
        </Box>
      )}
      <Flex
        direction="column"
        style={{ flex: 1, backgroundColor: 'var(--color-background-default)', minHeight: '100%' }}
      >
        {/* Chat Header */}
        <Paper square elevation={1} padding="md" style={{ zIndex: 10, flexShrink: 0 }}>
          <Stack direction="row" align="center" spacing="md">
            <IconButton onClick={leaveRoom}>
              <IconArrowLeft />
            </IconButton>
            <Avatar variant="rounded">{currentRoom.substring(0, 2)}</Avatar>
            <Typography variant="h3">{currentRoom}</Typography>
          </Stack>
        </Paper>

        {/* Messages Area */}
        <Box
          style={{
            flex: 1,
            overflow: 'hidden',
            padding: 'var(--space-gap-lg)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
          ref={messagesRef}
        >
          {messages.length === 0 ? (
            <Box style={{ textAlign: 'center', marginTop: '40px' }}>
              <Typography variant="body-medium" color="text-secondary">
                No messages yet. Say hello!
              </Typography>
            </Box>
          ) : (
            <Stack spacing="md" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                          {msg.senderId || 'Unknown'}
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
              <Box style={{ flex: 1 }}>
                <Input
                  value={input}
                  onInput={(e) => setInput(e.currentTarget.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!isConnected ? 'Connecting...' : `Message #${currentRoom}`}
                  disabled={!isConnected}
                  fullWidth
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
      </Flex>
    </Box>
  );
}
