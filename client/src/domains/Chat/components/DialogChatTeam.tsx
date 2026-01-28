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
import { teamApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import type { ChatUser } from '../types';

interface Team {
  _id: string;
  teamName: string;
  teamDesc?: string;
  private: boolean;
  members: ChatUser[];
  createdBy: ChatUser;
}

interface DialogChatTeamProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated?: () => void;
  team?: Team; // 수정 모드일 때 전달
}

export const DialogChatTeam = ({ open, onClose, onTeamCreated, team }: DialogChatTeamProps) => {
  const { userList } = useChat();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isEditMode = !!team;
  const [teamData, setTeamData] = useState({
    teamName: '',
    teamDesc: '',
    private: false,
    members: [] as ChatUser[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (team && open) {
      setTeamData({
        teamName: team.teamName,
        teamDesc: team.teamDesc || '',
        private: team.private,
        members: team.members || [],
      });
    } else if (!team && open) {
      // 생성 모드일 때 초기화
      setTeamData({
        teamName: '',
        teamDesc: '',
        private: false,
        members: [],
      });
    }
  }, [team, open]);

  const handleSubmit = async () => {
    if (!teamData.teamName.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (isEditMode && team) {
        // 수정 모드
        const existingMemberIds = team.members.map((m) => m._id);
        const newMemberIds = teamData.members.map((m) => m._id);
        const addedMemberIds = newMemberIds.filter((id) => !existingMemberIds.includes(id));

        // 팀 정보 수정
        await teamApi.updateTeam(team._id, {
          teamName: teamData.teamName.trim(),
          teamDesc: teamData.teamDesc.trim() || undefined,
          private: teamData.private,
        });

        // 새로 추가된 멤버가 있으면 초대
        if (addedMemberIds.length > 0) {
          await teamApi.inviteMembers(team._id, addedMemberIds);
        }
      } else {
        // 생성 모드
        const memberIds = teamData.members.map((m) => m._id);
        await teamApi.createTeam({
          teamName: teamData.teamName.trim(),
          teamDesc: teamData.teamDesc.trim() || undefined,
          private: teamData.private,
          members: memberIds.length > 0 ? memberIds : undefined,
          workspaceId: currentWorkspaceId.value || undefined,
        });
      }

      // 성공 시 초기화 및 닫기
      setTeamData({
        teamName: '',
        teamDesc: '',
        private: false,
        members: [],
      });
      showSuccess(isEditMode ? '팀이 수정되었습니다.' : '팀이 생성되었습니다.');
      onTeamCreated?.();
      onClose();
    } catch (error: any) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} team:`, error);
      showError(error.response?.data?.message || `${isEditMode ? '팀 수정' : '팀 생성'}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTeamData({
      teamName: '',
      teamDesc: '',
      private: false,
      members: [],
    });
    onClose();
  };

  // 팀 이름 유효성 검사 (공백 및 특수문자 제한)
  const isValidTeamName = (name: string) => {
    if (!name.trim()) return false;
    // 공백이나 특수문자 체크 (영문, 한글, 숫자, 언더스코어, 하이픈만 허용)
    return /^[a-zA-Z0-9가-힣_-]+$/.test(name.trim());
  };

  const isFormValid = isValidTeamName(teamData.teamName) && !isSubmitting;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={isEditMode ? '팀 수정' : '팀 개설'}
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
            placeholder="예: 마케팅팀"
            value={teamData.teamName}
            onInput={(e) => setTeamData((prev) => ({ ...prev, teamName: e.currentTarget.value }))}
            error={teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName)}
          />
          {teamData.teamName.length > 0 && !isValidTeamName(teamData.teamName) && (
            <Typography variant="caption" style={{ color: 'var(--color-error)', marginTop: '4px' }}>
              No spaces or special characters
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="body-small" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            주제
          </Typography>
          <Input
            fullWidth
            placeholder="Displayed next to name"
            value={teamData.teamDesc}
            onInput={(e) => setTeamData((prev) => ({ ...prev, teamDesc: e.currentTarget.value }))}
          />
        </Box>
        <Box>
          <AutocompleteMember
            userList={userList}
            selectedUsers={teamData.members}
            onUsersChange={(users) => setTeamData((prev) => ({ ...prev, members: users }))}
            currentUserId={user?.id}
            placeholder="Add people"
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
                People can only join by being invited
              </Typography>
            </Flex>
            <Switch
              checked={teamData.private}
              onChange={(checked) => setTeamData((prev) => ({ ...prev, private: checked }))}
            />
          </Flex>
        </Box>
      </Stack>
    </Dialog>
  );
};
