import { useState, useEffect } from 'preact/hooks';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import { AutocompleteMember } from './AutocompleteMember';
import { AutocompleteChannelAndTeam } from './AutocompleteChannelAndTeam';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser, ChatRoom } from '../types';

interface DialogChatDiscussionProps {
  open: boolean;
  onClose: () => void;
  onDiscussionCreated?: () => void;
  handleCreateRoom: (type: string, extraData: any) => Promise<void>;
}

export const DialogChatDiscussion = ({
  open,
  onClose,
  onDiscussionCreated,
  handleCreateRoom,
}: DialogChatDiscussionProps) => {
  const { roomList, userList } = useChat();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [discussionData, setDiscussionData] = useState({
    parentRoom: null as ChatRoom | null,
    name: '',
    description: '',
    members: [] as ChatUser[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (open) {
      setDiscussionData({
        parentRoom: null,
        name: '',
        description: '',
        members: [],
      });
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!discussionData.parentRoom || !discussionData.name.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 상위 채널/그룹의 멤버와 추가 선택된 멤버를 합침
      const parentMemberIds = (discussionData.parentRoom.members || []).map((m: any) =>
        typeof m === 'string' ? m : m._id
      );
      const additionalMemberIds = discussionData.members.map((m) => m._id);

      // 중복 제거 후 최종 멤버 리스트 생성
      const allMemberIds = Array.from(new Set([...parentMemberIds, ...additionalMemberIds]));

      await handleCreateRoom('discussion', {
        name: discussionData.name.trim(),
        description: discussionData.description.trim() || undefined,
        parentId: discussionData.parentRoom._id,
        members: allMemberIds,
        workspaceId: currentWorkspaceId.value || undefined,
      });

      showSuccess('토론이 생성되었습니다.');
      onDiscussionCreated?.();
      handleClose();
    } catch (error: any) {
      console.error('Failed to create discussion:', error);
      showError(error.message || '토론 생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDiscussionData({
      parentRoom: null,
      name: '',
      description: '',
      members: [],
    });
    onClose();
  };

  const isFormValid = discussionData.parentRoom && discussionData.name.trim() && !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="새 토론 만들기"
      maxWidth={false}
      style={{ maxWidth: '600px' }}
      fullWidth
      actions={
        <Flex gap="sm">
          <Button onClick={handleClose}>취소</Button>
          <Button variant="primary" disabled={!isFormValid} onClick={handleSubmit}>
            개설
          </Button>
        </Flex>
      }
    >
      <Stack spacing="lg">
        <Typography variant="body-small" color="text-secondary">
          진행 상황에 대한 개요를 유지하십시오! 토론을 생성하면 선택한 채널의 하위 채널이 만들어지고 둘 다 연결됩니다.
        </Typography>

        <Box>
          <AutocompleteChannelAndTeam
            roomList={roomList}
            selectedRoom={discussionData.parentRoom}
            onRoomChange={(room) => setDiscussionData((prev) => ({ ...prev, parentRoom: room }))}
            error={open && !discussionData.parentRoom}
            helperText={!discussionData.parentRoom ? '상위 채널 또는 그룹을 선택해주세요.' : ''}
          />
        </Box>

        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            이름 *
          </Typography>
          <Input
            fullWidth
            placeholder="예: 프로젝트-마일스톤-논의"
            value={discussionData.name}
            onInput={(e) => setDiscussionData((prev) => ({ ...prev, name: e.currentTarget.value }))}
          />
        </Box>

        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            설명
          </Typography>
          <Input
            fullWidth
            placeholder="Displayed next to name"
            value={discussionData.description}
            onInput={(e) => setDiscussionData((prev) => ({ ...prev, description: e.currentTarget.value }))}
          />
          <Typography variant="caption" color="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
            이름 옆에 표시됩니다.
          </Typography>
        </Box>

        <Box>
          <AutocompleteMember
            userList={userList}
            selectedUsers={discussionData.members}
            onUsersChange={(users) => setDiscussionData((prev) => ({ ...prev, members: users }))}
            currentUserId={user?.id}
            placeholder="Add people"
            label="참여자"
          />
        </Box>
      </Stack>
    </Dialog>
  );
};
