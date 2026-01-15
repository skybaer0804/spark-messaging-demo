import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { IconHash } from '@tabler/icons-preact';
import type { ChatRoom, ChatUser } from '../../types';

interface DirectoryViewProps {
  directoryTab: 'channel' | 'team' | 'user';
  setDirectoryTab: (tab: 'channel' | 'team' | 'user') => void;
  roomList: ChatRoom[];
  onRoomSelect: (roomId: string) => void;
  userList: ChatUser[];
  startDirectChat: (userId: string) => void;
}

export const DirectoryView = ({
  directoryTab,
  setDirectoryTab,
  roomList,
  onRoomSelect,
  userList,
  startDirectChat,
}: DirectoryViewProps) => (
  <Flex direction="column" style={{ height: '100%', backgroundColor: 'var(--color-bg-default)' }}>
    <Paper square padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
      <Typography variant="h2" style={{ marginBottom: '16px' }}>
        디렉토리
      </Typography>
      <Flex gap="md">
        <Button
          variant={directoryTab === 'channel' ? 'primary' : 'secondary'}
          onClick={() => setDirectoryTab('channel')}
        >
          채널
        </Button>
        <Button variant={directoryTab === 'team' ? 'primary' : 'secondary'} onClick={() => setDirectoryTab('team')}>
          팀
        </Button>
        <Button variant={directoryTab === 'user' ? 'primary' : 'secondary'} onClick={() => setDirectoryTab('user')}>
          사용자
        </Button>
      </Flex>
    </Paper>

    <Box style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
      {directoryTab === 'channel' && (
        <List>
          {roomList
            .filter((r) => r.type === 'public')
            .map((room) => (
              <ListItem key={room._id} onClick={() => onRoomSelect(room._id)} style={{ cursor: 'pointer' }}>
                <ListItemAvatar>
                  <Avatar variant="rounded">
                    <IconHash />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={room.name} secondary={room.description} />
              </ListItem>
            ))}
        </List>
      )}
      {directoryTab === 'team' && (
        <List>
          {roomList
            .filter((r) => r.type === 'team')
            .map((room) => (
              <ListItem key={room._id} onClick={() => onRoomSelect(room._id)} style={{ cursor: 'pointer' }}>
                <ListItemAvatar>
                  <Avatar variant="rounded" style={{ backgroundColor: '#e11d48' }}>
                    {room.name?.substring(0, 1).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={room.name} secondary={`${room.members.length}명의 멤버`} />
              </ListItem>
            ))}
        </List>
      )}
      {directoryTab === 'user' && (
        <List>
          {userList.map((user) => (
            <ListItem key={user._id} onClick={() => startDirectChat(user._id)} style={{ cursor: 'pointer' }}>
              <ListItemAvatar>
                <Box style={{ position: 'relative' }}>
                  <Avatar src={user.avatar || user.profileImage} />
                  <div
                    className={`avatar-status avatar-status--${user.status || 'offline'}`}
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      border: '2px solid #fff',
                      borderRadius: '50%',
                    }}
                  />
                </Box>
              </ListItemAvatar>
              <ListItemText primary={user.username} secondary={user.status === 'online' ? 'Online' : 'Offline'} />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  </Flex>
);
