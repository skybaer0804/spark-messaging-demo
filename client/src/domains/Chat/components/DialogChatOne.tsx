import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Checkbox } from '@/ui-components/Checkbox/Checkbox';
import type { ChatUser } from '../types';

interface DialogChatOneProps {
  open: boolean;
  onClose: () => void;
  userList: ChatUser[];
  selectedUserIds: string[];
  toggleUserSelection: (userId: string) => void;
  handleCreateRoom: (type: 'direct' | 'discussion') => void;
  roomIdInput: string;
  setRoomIdInput: (val: string) => void;
}

export const DialogChatOne = ({
  open,
  onClose,
  userList,
  selectedUserIds,
  toggleUserSelection,
  handleCreateRoom,
  roomIdInput,
  setRoomIdInput,
}: DialogChatOneProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="새 1:1 대화"
      maxWidth="sm"
      fullWidth
      actions={
        <Flex gap="sm">
          <Button onClick={onClose}>취소</Button>
          <Button
            variant="primary"
            disabled={selectedUserIds.length === 0}
            onClick={() => {
              handleCreateRoom(selectedUserIds.length > 1 ? 'discussion' : 'direct');
              onClose();
            }}
          >
            개설
          </Button>
        </Flex>
      }
    >
      <Typography variant="body-small" color="text-secondary" style={{ marginBottom: '16px' }}>
        대화하고 싶은 사용자를 선택하세요. 여러 명을 선택하면 토론방이 생성됩니다.
      </Typography>
      <Input
        fullWidth
        placeholder="사용자 검색"
        value={roomIdInput}
        onInput={(e) => setRoomIdInput(e.currentTarget.value)}
        style={{ marginBottom: '16px' }}
      />
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        <List>
          {userList
            .filter((u) => u.username.includes(roomIdInput))
            .map((user) => (
              <ListItem key={user._id} onClick={() => toggleUserSelection(user._id)} style={{ cursor: 'pointer' }}>
                <ListItemAvatar>
                  <Avatar src={user.profileImage || user.avatar} size="sm">
                    {user.username.substring(0, 1)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={user.username} secondary={`@${user.username}`} />
                <Checkbox checked={selectedUserIds.includes(user._id)} />
              </ListItem>
            ))}
        </List>
      </div>
    </Dialog>
  );
};
