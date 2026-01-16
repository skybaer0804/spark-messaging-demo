import { useChatApp } from './hooks/useChatApp';
import { useRef, useEffect, useState, useMemo } from 'preact/hooks';
import { useChat } from './context/ChatContext';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { Divider } from '@/ui-components/Divider/Divider';
import { Button } from '@/ui-components/Button/Button';
import { chatPendingJoinRoom, clearPendingJoinChatRoom } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi, chatApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { ChatDataProvider } from './context/ChatDataProvider';
import { useRouterState } from '@/routes/RouterState';
import { getDirectChatName } from './utils/chatUtils';
import { ChatSidebar } from './components/ChatSidebar/ChatSidebar';
import { ChatEmptyState } from './components/ChatEmptyState';
import { DirectoryView } from './components/Directory/DirectoryView';
import { ChatHeader } from './components/ChatHeader';
import { ChatMemberPanel } from './components/ChatMemberPanel';
import { ChatInput } from './components/ChatInput';
import { ChatMessages } from './components/ChatMessages';
import './ChatApp.scss';

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
    currentRoom,
    roomList,
    userList,
    sendMessage,
    handleRoomSelect: handleRoomSelectRaw,
    handleCreateRoom,
    sendFile,
    uploadingFile,
    uploadProgress,
    debugEnabled,
    toggleDebug,
  } = useChatApp();

  const { setCurrentRoom } = useChat();

  const view = useMemo(() => {
    if (pathname === '/chatapp/directory') return 'directory';
    if (pathname.startsWith('/chatapp/invite/')) return 'invite';
    if (pathname.startsWith('/chatapp/chat/')) return 'chat';
    return 'home';
  }, [pathname]);

  const [directoryTab, setDirectoryTab] = useState<'channel' | 'team' | 'user'>('channel');
  const { showSuccess, showError } = useToast();

  // 초대 링크로 입장 처리
  useEffect(() => {
    if (view === 'invite') {
      const slug = pathname.split('/').pop();
      if (slug) {
        chatApi
          .joinRoomByInvite(slug)
          .then((response) => {
            const room = response.data;
            if (room && room._id) {
              showSuccess('채널에 입장했습니다.');
              handleRoomSelectRaw(room);
              navigate(`/chatapp/chat/${room._id}`);
            }
          })
          .catch((error) => {
            console.error('Failed to join room by invite:', error);
            showError(error.response?.data?.message || '채널 입장에 실패했습니다.');
            navigate('/chatapp');
          });
      }
    }
  }, [view, pathname]);

  useEffect(() => {
    if (view === 'chat') {
      const roomId = pathname.split('/').pop();
      if (roomId && currentRoom?._id !== roomId && roomList.length > 0) {
        onRoomSelect(roomId);
      }
    }
  }, [pathname, currentRoom?._id, roomList, view]);

  const onRoomSelect = (roomId: string) => {
    const room = roomList.find((r) => r._id === roomId);
    if (room) {
      handleRoomSelectRaw(room);
      if (pathname !== `/chatapp/chat/${roomId}`) {
        navigate(`/chatapp/chat/${roomId}`);
      }
    }
  };

  const goToHome = () => {
    setCurrentRoom(null);
    navigate('/chatapp');
  };

  const startDirectChat = async (userId: string) => {
    // 서버에서 identifier 기반으로 기존 활성 방을 찾거나 새 방을 생성하도록 위임
    const newRoom = await handleCreateRoom('direct', { members: [userId] });
    if (newRoom && newRoom._id) {
      navigate(`/chatapp/chat/${newRoom._id}`);
    }
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

  const toggleGlobalNotifications = async (enabled: boolean) => {
    try {
      await authApi.updateNotificationSettings({ globalEnabled: enabled });
      showSuccess(`알림이 ${enabled ? '활성화' : '비활성화'}되었습니다.`);
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

  const showSidebar = !isMobile || view === 'home' || view === 'directory';
  const showMainContent = !isMobile || view === 'chat';

  return (
    <Box style={{ display: 'flex', height: '100%', minHeight: 0 }} className="chat-app__container">
      {/* Sidebar Area */}
      {showSidebar && (
        <Box
          style={{
            width: isMobile ? '100%' : '300px',
            flexShrink: 0,
          }}
          className="chat-app__sidebar-wrapper"
        >
          <ChatSidebar />
        </Box>
      )}

      {/* Main Content Area */}
      {showMainContent && (
        <Box
          style={{
            flex: 1,
            backgroundColor: 'var(--color-background-default)',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: view === 'home' || view === 'directory' ? 'block' : 'flex',
            flexDirection: view === 'chat' ? 'column' : 'initial',
          }}
          className="chat-app__main-content"
        >
          {view === 'directory' ? (
            <DirectoryView
              directoryTab={directoryTab}
              setDirectoryTab={setDirectoryTab}
              roomList={roomList}
              onRoomSelect={onRoomSelect}
              userList={userList}
              startDirectChat={startDirectChat}
            />
          ) : view === 'chat' && currentRoom ? (
            <>
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
                {/* Messages Area */}
                <ChatMessages
                  messages={messages}
                  currentUser={currentUser as any}
                  currentRoom={currentRoom}
                  messagesRef={messagesRef}
                  messagesEndRef={messagesEndRef}
                  onImageClick={handleImageClick}
                />

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
            </>
          ) : (
            <ChatEmptyState />
          )}
        </Box>
      )}

      {/* Modals */}
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
