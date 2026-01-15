import { useState, useEffect } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import { IconHash } from '@tabler/icons-preact';
import { teamApi, chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { DialogChatTeam } from '../DialogChatTeam';
import type { ChatRoom, ChatUser } from '../../types';

interface Team {
  _id: string;
  teamName: string;
  teamDesc?: string;
  private: boolean;
  members: (ChatUser & { role?: string })[];
  createdBy: ChatUser;
  createdAt: string;
}

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
}: DirectoryViewProps) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);

  // 팀 목록 조회
  useEffect(() => {
    if (directoryTab === 'team' && currentWorkspaceId.value) {
      setIsLoadingTeams(true);
      teamApi
        .getTeams(currentWorkspaceId.value)
        .then((response) => {
          setTeamList(response.data);
        })
        .catch((error) => {
          console.error('Failed to load teams:', error);
        })
        .finally(() => {
          setIsLoadingTeams(false);
        });
    }
  }, [directoryTab, currentWorkspaceId.value]);

  // 팀 클릭 시 해당 팀의 채팅방으로 이동
  const handleTeamSelect = async (team: Team) => {
    // roomList에서 해당 teamId를 가진 채팅방 찾기
    const teamRoom = roomList.find((room) => room.teamId === team._id && room.type === 'team');

    if (teamRoom) {
      onRoomSelect(teamRoom._id);
    } else {
      // 채팅방을 나갔거나 목록에 없는 경우 서버에 요청하여 재입장/조회
      try {
        const response = await chatApi.createRoom({
          teamId: team._id,
          type: 'team',
          workspaceId: currentWorkspaceId.value || undefined,
          name: team.teamName,
          description: team.teamDesc,
          isPrivate: team.private,
        });

        if (response.data && response.data._id) {
          onRoomSelect(response.data._id);
        }
      } catch (error) {
        console.error('Failed to enter team chat:', error);
        showError('팀 채팅방에 진입할 수 없습니다.');
      }
    }
  };

  // 현재 사용자가 팀의 Owner인지 확인
  const isTeamOwner = (team: Team) => {
    if (!user) {
      console.log('[isTeamOwner] No user');
      return false;
    }
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) {
      console.log('[isTeamOwner] No currentUserId');
      return false;
    }

    // createdBy가 객체인 경우 (populate된 경우)
    if (team.createdBy && typeof team.createdBy === 'object' && team.createdBy !== null) {
      const createdById = (team.createdBy as any)?._id || (team.createdBy as any)?.id;
      const isOwner = createdById && createdById.toString() === currentUserId.toString();
      console.log('[isTeamOwner] Object check:', {
        createdById,
        currentUserId,
        isOwner,
        createdBy: team.createdBy,
      });
      return isOwner;
    }

    // createdBy가 문자열인 경우
    if (typeof team.createdBy === 'string') {
      const isOwner = team.createdBy === currentUserId.toString();
      console.log('[isTeamOwner] String check:', { createdBy: team.createdBy, currentUserId, isOwner });
      return isOwner;
    }

    console.log('[isTeamOwner] No match:', {
      createdBy: team.createdBy,
      createdByType: typeof team.createdBy,
      currentUserId,
      team: team,
    });
    return false;
  };

  // 팀 수정
  const handleEditTeam = (team: Team) => {
    console.log('[handleEditTeam] Editing team:', team);
    setEditTeam(team);
  };

  // 팀 삭제
  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`정말로 "${team.teamName}" 팀을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      console.log('[handleDeleteTeam] Deleting team:', team._id);
      const response = await teamApi.deleteTeam(team._id);
      console.log('[handleDeleteTeam] Delete response:', response);
      showSuccess('팀이 삭제되었습니다.');
      // 팀 목록 새로고침
      if (directoryTab === 'team' && currentWorkspaceId.value) {
        const response = await teamApi.getTeams(currentWorkspaceId.value);
        setTeamList(response.data);
      }
    } catch (error: any) {
      console.error('[handleDeleteTeam] Failed to delete team:', error);
      showError(error.response?.data?.message || '팀 삭제에 실패했습니다.');
    }
  };

  // 팀 수정 완료 후 콜백
  const handleTeamUpdated = async () => {
    setEditTeam(null);
    // 팀 목록 새로고침
    if (directoryTab === 'team' && currentWorkspaceId.value) {
      setIsLoadingTeams(true);
      try {
        const response = await teamApi.getTeams(currentWorkspaceId.value);
        setTeamList(response.data);
      } catch (error) {
        console.error('Failed to load teams:', error);
      } finally {
        setIsLoadingTeams(false);
      }
    }
  };

  return (
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
          <>
            {isLoadingTeams ? (
              <Typography variant="body-medium" style={{ textAlign: 'center', padding: '32px' }}>
                로딩 중...
              </Typography>
            ) : teamList.length === 0 ? (
              <Typography
                variant="body-medium"
                style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-secondary)' }}
              >
                팀이 없습니다.
              </Typography>
            ) : (
              <List>
                {teamList.map((team) => {
                  const isOwner = isTeamOwner(team);
                  return (
                    <ListItem
                      key={team._id}
                      style={{
                        padding: 0,
                        backgroundColor: 'transparent',
                        borderBottom: '1px solid var(--color-border-subtle, rgba(0,0,0,0.05))',
                      }}
                    >
                      <Flex align="center" style={{ width: '100%' }}>
                        {/* 채팅방 이동 클릭 영역 */}
                        <Flex
                          align="center"
                          gap="md"
                          onClick={() => handleTeamSelect(team)}
                          style={{
                            flex: 1,
                            padding: '12px 16px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = 'var(--color-action-hover, rgba(0,0,0,0.04))')
                          }
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <Avatar variant="rounded" style={{ backgroundColor: '#e11d48', width: 40, height: 40 }}>
                            {team.teamName.substring(0, 1).toUpperCase()}
                          </Avatar>
                          <ListItemText
                            primary={team.teamName}
                            secondary={team.teamDesc || `${team.members?.length || 0}명의 멤버`}
                          />
                        </Flex>

                        {/* 수정/삭제 버튼 (항상 우측 노출) */}
                        {isOwner && (
                          <Flex gap="xs" style={{ paddingRight: '16px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditTeam(team);
                              }}
                              style={{
                                minWidth: 'auto',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                              }}
                            >
                              수정
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTeam(team);
                              }}
                              style={{
                                minWidth: 'auto',
                                padding: '4px 8px',
                                fontSize: '0.75rem',
                                color: 'var(--color-error, #ef4444)',
                              }}
                            >
                              삭제
                            </Button>
                          </Flex>
                        )}
                      </Flex>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </>
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

      {/* 팀 수정 다이얼로그 */}
      {editTeam && (
        <DialogChatTeam
          open={!!editTeam}
          onClose={() => setEditTeam(null)}
          onTeamCreated={handleTeamUpdated}
          team={editTeam}
        />
      )}
    </Flex>
  );
};
