import { IconButton } from '@/ui-components/Button/IconButton';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { IconArrowLeft, IconHash, IconLock, IconVideo, IconUsers, IconSettings, IconBug, IconBugOff } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { getDirectChatName } from '../utils/chatUtils';
import type { ChatRoom } from '../types';

interface ChatHeaderProps {
  isMobile: boolean;
  goToHome: () => void;
  currentRoom: ChatRoom;
  showUserList: boolean;
  showSettings: boolean;
  setShowUserList: (val: boolean) => void;
  setShowSettings: (val: boolean) => void;
  toggleDebug: () => void;
  debugEnabled: boolean;
}

export const ChatHeader = ({
  isMobile,
  goToHome,
  currentRoom,
  showUserList,
  setShowUserList,
  setShowSettings,
  toggleDebug,
  debugEnabled,
}: ChatHeaderProps) => {
  const { user: currentUser } = useAuth();
  const { showSuccess } = useToast();

  return (
    <Paper
      square
      elevation={1}
      padding="sm"
      style={{ zIndex: 10, flexShrink: 0, borderBottom: '1px solid var(--color-border-default)' }}
    >
      <Stack direction="row" align="center" spacing="md">
        {isMobile && (
          <IconButton onClick={goToHome}>
            <IconArrowLeft />
          </IconButton>
        )}
        <Box style={{ flex: 1 }}>
          <Flex align="center" gap="sm">
            {currentRoom.type === 'private' || currentRoom.isPrivate ? (
              <IconLock size={20} />
            ) : (
              <IconHash size={20} />
            )}
            <Typography variant="h3" style={{ fontWeight: 800 }}>
              {currentRoom.displayName ||
                getDirectChatName(currentRoom, currentUser?.id || (currentUser as any)?._id)}
            </Typography>
          </Flex>
          {currentRoom.description && (
            <Typography variant="caption" color="text-secondary" style={{ marginLeft: '24px' }}>
              {currentRoom.description}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={() => {
            showSuccess('화상회의를 시작합니다.');
          }}
          title="화상회의"
        >
          <IconVideo size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            if (showUserList) {
              setShowUserList(false);
            } else {
              setShowSettings(false);
              setShowUserList(true);
            }
          }}
          color={showUserList ? 'primary' : 'secondary'}
          title="참여자 목록"
        >
          <IconUsers size={20} />
        </IconButton>
        <IconButton
          onClick={() => {
            const isSettingsOpen = !showUserList && (window as any).__chatSettingsOpen;
            if (isSettingsOpen) {
              setShowSettings(false);
            } else {
              setShowUserList(false);
              setShowSettings(true);
            }
          }}
          color="secondary"
          title="설정"
        >
          <IconSettings size={20} />
        </IconButton>
        <IconButton onClick={toggleDebug} color={debugEnabled ? 'primary' : 'secondary'} title="디버그 모드 토글">
          {debugEnabled ? <IconBug size={20} /> : <IconBugOff size={20} />}
        </IconButton>
      </Stack>
    </Paper>
  );
};
