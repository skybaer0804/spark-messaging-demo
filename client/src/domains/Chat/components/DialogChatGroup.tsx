import { useState, useEffect } from 'preact/hooks';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Flex } from '@/ui-components/Layout/Flex';
import { Button } from '@/ui-components/Button/Button';
import { Typography } from '@/ui-components/Typography/Typography';
import { Input } from '@/ui-components/Input/Input';
import { Stack } from '@/ui-components/Layout/Stack';
import { Box } from '@/ui-components/Layout/Box';
import { Switch } from '@/ui-components/Switch/Switch';
import { AutocompleteMember } from './AutocompleteMember';
import { useChat } from '../context/ChatContext';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';

interface Group {
  _id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: ChatUser[];
  createdBy: ChatUser;
}

interface DialogChatGroupProps {
  open: boolean;
  onClose: () => void;
  onGroupCreated?: () => void;
  group?: Group; // 수정 모드일 때 전달
}

export const DialogChatGroup = ({ open, onClose, onGroupCreated, group }: DialogChatGroupProps) => {
  const { userList, refreshRoomList } = useChat();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isEditMode = !!group;
  const [groupData, setGroupData] = useState({
    name: '',
    description: '',
    isPrivate: false,
    members: [] as ChatUser[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (group && open) {
      setGroupData({
        name: group.name,
        description: group.description || '',
        isPrivate: group.isPrivate,
        members: group.members || [],
      });
    } else if (!group && open) {
      // 생성 모드일 때 초기화
      setGroupData({
        name: '',
        description: '',
        isPrivate: false,
        members: [],
      });
    }
  }, [group, open]);

  const handleSubmit = async () => {
    if (!groupData.name.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && group) {
        // 수정 모드
        const memberIds = groupData.members.map((m) => m._id);
        await chatApi.updateRoom(group._id, {
          name: groupData.name.trim(),
          description: groupData.description.trim() || undefined,
          isPrivate: groupData.isPrivate,
          type: groupData.isPrivate ? 'private' : 'public',
          members: memberIds.length > 0 ? memberIds : undefined,
        });
        
        await refreshRoomList();
        showSuccess('채널이 수정되었습니다.');
      } else {
        // 생성 모드
        const memberIds = groupData.members.map((m) => m._id);
        await chatApi.createRoom({
          name: groupData.name.trim(),
          description: groupData.description.trim() || undefined,
          isPrivate: groupData.isPrivate,
          type: groupData.isPrivate ? 'private' : 'public',
          members: memberIds.length > 0 ? memberIds : undefined,
          workspaceId: currentWorkspaceId.value || undefined,
        });
        
        await refreshRoomList();
        showSuccess('채널이 생성되었습니다.');
      }

      // 성공 시 초기화 및 닫기
      setGroupData({
        name: '',
        description: '',
        isPrivate: false,
        members: [],
      });
      onGroupCreated?.();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} channel:`, error);
      showError(error.response?.data?.message || `${isEditMode ? '채널 수정' : '채널 생성'}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupData({
      name: '',
      description: '',
      isPrivate: false,
      members: [],
    });
    onClose();
  };

  // 채널 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidGroupName = (name: string) => {
    if (!name.trim()) return false;
    // 공백이나 특수문자 체크 (영문, 한글, 숫자, 언더스코어, 하이픈만 허용)
    return /^[a-zA-Z0-9가-힣_-]+$/.test(name.trim());
  };

  const isFormValid = isValidGroupName(groupData.name) && !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? '채널 수정' : '채널 생성'}
      maxWidth={false}
      style={{ maxWidth: '800px' }}
      fullWidth
      actions={
        <Flex gap="sm">
          <Button onClick={handleClose}>취소</Button>
          <Button variant="primary" disabled={!isFormValid} onClick={handleSubmit}>
            {isEditMode ? '저장' : '개설'}
          </Button>
        </Flex>
      }
    >
      <Stack spacing="md">
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            이름 *
          </Typography>
          <Input
            fullWidth
            placeholder="예: 프로젝트-공지"
            value={groupData.name}
            onInput={(e) => setGroupData((prev) => ({ ...prev, name: e.currentTarget.value }))}
            error={groupData.name.length > 0 && !isValidGroupName(groupData.name)}
          />
          {groupData.name.length > 0 && !isValidGroupName(groupData.name) && (
            <Typography variant="caption" style={{ color: 'var(--color-error)', marginTop: '4px' }}>
              공백이나 특수문자는 사용할 수 없습니다.
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            설명
          </Typography>
          <Input
            fullWidth
            placeholder="채널의 목적을 설명해주세요."
            value={groupData.description}
            onInput={(e) => setGroupData((prev) => ({ ...prev, description: e.currentTarget.value }))}
          />
        </Box>
        <Box>
          <AutocompleteMember
            userList={userList}
            selectedUsers={groupData.members}
            onUsersChange={(users) => setGroupData((prev) => ({ ...prev, members: users }))}
            currentUserId={user?.id}
            placeholder="멤버 초대"
            label="멤버 추가"
          />
        </Box>
        <Box>
          <Flex justify="space-between" align="center">
            <Flex direction="column" style={{ flex: 1 }}>
              <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                비공개
              </Typography>
              <Typography variant="caption" style={{ color: 'var(--color-text-secondary)' }}>
                초대된 사람만 채널에 참여할 수 있습니다.
              </Typography>
            </Flex>
            <Switch checked={groupData.isPrivate} onChange={(checked) => setGroupData((prev) => ({ ...prev, isPrivate: checked }))} />
          </Flex>
        </Box>
      </Stack>
    </Dialog>
  );
};
