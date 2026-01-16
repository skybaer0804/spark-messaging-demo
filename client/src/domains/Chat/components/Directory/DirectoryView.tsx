import { useState, useEffect, useMemo } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Grid } from '@/ui-components/Layout/Grid';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Button } from '@/ui-components/Button/Button';
import {
  IconHash,
  IconUsers,
  IconEdit,
  IconTrash,
  IconMessageCircle,
  IconSearch,
  IconCopy,
} from '@tabler/icons-preact';
import { teamApi, chatApi } from '@/core/api/ApiService';
import { currentWorkspaceId } from '@/stores/chatRoomsStore';
import { useAuth } from '@/core/hooks/useAuth';
import { useToast } from '@/core/context/ToastContext';
import { useChat } from '../../context/ChatContext';
import { Dialog } from '@/ui-components/Dialog/Dialog';
import { Input } from '@/ui-components/Input/Input';
import { DialogChatTeam } from '../DialogChatTeam';
import { DialogChatGroup } from '../DialogChatGroup';
import type { ChatRoom, ChatUser } from '../../types';
import './DirectoryView.scss';

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

const DirectoryItemCard = ({
  title,
  description,
  icon,
  color,
  onClick,
  actions,
  badge,
  isUser = false,
  userImage,
  userStatus,
  initials,
}: {
  title: string;
  description?: string;
  icon?: any;
  color?: string;
  onClick?: () => void;
  actions?: any;
  badge?: string;
  isUser?: boolean;
  userImage?: string;
  userStatus?: string;
  initials?: string;
}) => (
  <Paper
    className="directory-card"
    elevation={0}
    onClick={onClick}
    style={
      {
        cursor: onClick ? 'pointer' : 'default',
        '--app-color': color || '#509EE3',
      } as any
    }
  >
    <Flex align="center" gap="sm" style={{ width: '100%' }}>
      {isUser ? (
        <div className="directory-card__icon-box directory-card__icon-box--user" style={{ position: 'relative' }}>
          <Avatar src={userImage} variant="rounded" size="md" style={{ width: '40px', height: '40px' }}>
            {initials}
          </Avatar>
          <div
            className={`directory-card__status-indicator directory-card__status-indicator--${userStatus || 'offline'}`}
          />
        </div>
      ) : (
        <div
          className="directory-card__icon-box"
          style={{ backgroundColor: `${color || '#509EE3'}15`, color: color || '#509EE3' }}
        >
          {icon}
        </div>
      )}

      <Stack spacing="none" className="directory-card__body" style={{ flex: 1, minWidth: 0 }}>
        <Typography variant="h4" className="directory-card__title-text">
          {title}
        </Typography>
        <Typography variant="body-small" color="text-secondary" className="directory-card__desc">
          {description || (isUser ? (userStatus === 'online' ? '온라인' : '오프라인') : '설명이 없습니다.')}
        </Typography>
      </Stack>

      {(actions || badge) && (
        <Flex direction="column" align="flex-end" gap="xs" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {badge && <span className="directory-card__badge">{badge}</span>}
          {actions && (
            <div className="directory-card__actions" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </Flex>
      )}
    </Flex>
  </Paper>
);

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
  const { refreshRoomList } = useChat();
  const [teamList, setTeamList] = useState<Team[]>([]);
  const [isLoadingTeams, setIsLoadingTeams] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [editChannel, setEditChannel] = useState<ChatRoom | null>(null);
  const [inviteChannel, setInviteChannel] = useState<ChatRoom | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 검색어에 따른 필터링된 목록 (public과 private 모두 표시)
  const filteredChannels = useMemo(() => {
    return roomList
      .filter((r) => r.type === 'public' || r.type === 'private')
      .filter(
        (r) =>
          (r.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())),
      );
  }, [roomList, searchTerm]);

  const filteredTeams = useMemo(() => {
    return teamList.filter(
      (t) =>
        t.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.teamDesc && t.teamDesc.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [teamList, searchTerm]);

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [userList, searchTerm]);

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
      return false;
    }
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) {
      return false;
    }

    // createdBy가 객체인 경우 (populate된 경우)
    if (team.createdBy && typeof team.createdBy === 'object' && team.createdBy !== null) {
      const createdById = (team.createdBy as any)?._id || (team.createdBy as any)?.id;
      return createdById && createdById.toString() === currentUserId.toString();
    }

    // createdBy가 문자열인 경우
    if (typeof team.createdBy === 'string') {
      return team.createdBy === currentUserId.toString();
    }

    return false;
  };

  // 현재 사용자가 채널의 멤버인지 확인
  const isChannelMember = (room: ChatRoom) => {
    if (!user) {
      return false;
    }
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) {
      return false;
    }

    // members 배열에서 현재 사용자가 포함되어 있는지 확인
    if (room.members && room.members.length > 0) {
      return room.members.some((member) => {
        if (member && typeof member === 'object') {
          const memberId = (member as any)?._id || (member as any)?.id;
          return memberId && memberId.toString() === currentUserId.toString();
        }
        return false;
      });
    }

    return false;
  };

  // 현재 사용자가 채널의 Owner인지 확인
  const isChannelOwner = (room: ChatRoom) => {
    if (!user) {
      return false;
    }
    const currentUserId = (user as any).id || (user as any)._id;
    if (!currentUserId) {
      return false;
    }

    // 1. createdBy 필드가 있는 경우 (우선 순위)
    if (room.createdBy) {
      if (typeof room.createdBy === 'string') {
        return room.createdBy === currentUserId.toString();
      }
      if (typeof room.createdBy === 'object') {
        const creatorId = (room.createdBy as any)?._id || (room.createdBy as any)?.id;
        return creatorId && creatorId.toString() === currentUserId.toString();
      }
    }

    // 2. createdBy가 없는 경우 기존 로직 유지 (하위 호환성)
    if (room.members && room.members.length > 0) {
      const firstMember = room.members[0];
      if (firstMember) {
        const firstMemberId =
          typeof firstMember === 'string' ? firstMember : (firstMember as any)?._id || (firstMember as any)?.id;
        if (firstMemberId && firstMemberId.toString() === currentUserId.toString()) {
          return true;
        }
      }

      const isMember = room.members.some((member) => {
        const memberId = typeof member === 'string' ? member : (member as any)?._id || (member as any)?.id;
        return memberId && memberId.toString() === currentUserId.toString();
      });

      if (isMember && room.members.length === 1) {
        return true;
      }
    }

    return false;
  };

  // 팀 수정
  const handleEditTeam = (team: Team) => {
    setEditTeam(team);
  };

  // 팀 삭제
  const handleDeleteTeam = async (team: Team) => {
    if (!confirm(`정말로 "${team.teamName}" 팀을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await teamApi.deleteTeam(team._id);
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

  // 채널 클릭 처리 (멤버 여부 확인)
  const handleChannelClick = async (room: ChatRoom) => {
    // 이미 멤버인 경우 바로 입장
    if (isChannelMember(room)) {
      onRoomSelect(room._id);
      return;
    }

    // Private 채널이고 멤버가 아닌 경우 초대 링크 표시
    if (room.type === 'private') {
      setInviteChannel(room);
      return;
    }

    // Public 채널은 바로 입장
    onRoomSelect(room._id);
  };

  // 채널 수정
  const handleEditChannel = (room: ChatRoom) => {
    setEditChannel(room);
  };

  // 채널 삭제
  const handleDeleteChannel = async (room: ChatRoom) => {
    if (!confirm(`정말로 "${room.name || '채널'}" 채널을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await chatApi.deleteRoom(room._id);
      showSuccess('채널이 삭제되었습니다.');
      // TODO: 채널 목록 새로고침
    } catch (error: any) {
      console.error('[handleDeleteChannel] Failed to delete channel:', error);
      showError(error.response?.data?.message || '채널 삭제에 실패했습니다.');
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

  const getPlaceholderText = () => {
    switch (directoryTab) {
      case 'channel':
        return '채널 이름 또는 설명으로 검색...';
      case 'team':
        return '팀 이름 또는 설명으로 검색...';
      case 'user':
        return '사용자 이름으로 검색...';
      default:
        return '검색...';
    }
  };

  return (
    <Box className="directory-view">
      <header className="directory-view__header">
        <Stack spacing="sm">
          <Typography variant="h1" className="directory-view__title">
            디렉토리
          </Typography>
          <Typography variant="body-large" className="directory-view__subtitle">
            워크스페이스의 채널, 팀, 그리고 동료들을 한눈에 확인하고 빠르게 소통을 시작하세요.
          </Typography>

          <div className="directory-view__controls">
            <div className="directory-view__tabs">
              <Button
                className={`directory-view__tab ${directoryTab === 'channel' ? 'directory-view__tab--active' : ''}`}
                onClick={() => setDirectoryTab('channel')}
              >
                채널
              </Button>
              <Button
                className={`directory-view__tab ${directoryTab === 'team' ? 'directory-view__tab--active' : ''}`}
                onClick={() => setDirectoryTab('team')}
              >
                팀
              </Button>
              <Button
                className={`directory-view__tab ${directoryTab === 'user' ? 'directory-view__tab--active' : ''}`}
                onClick={() => setDirectoryTab('user')}
              >
                사용자
              </Button>
            </div>

            <div className="directory-view__search-wrapper">
              <IconSearch className="directory-view__search-icon" size={20} />
              <input
                type="text"
                className="directory-view__search-input"
                placeholder={getPlaceholderText()}
                value={searchTerm}
                onInput={(e) => setSearchTerm(e.currentTarget.value)}
              />
            </div>
          </div>
        </Stack>
      </header>

      <Box className="directory-view__content">
        {directoryTab === 'channel' && (
          <Grid container spacing={2} columns={4}>
            {filteredChannels.map((room) => {
              const isOwner = isChannelOwner(room);
              return (
                <Grid item key={room._id} xs={4} sm={2} md={1}>
                  <DirectoryItemCard
                    title={room.name || '채널'}
                    description={room.description}
                    icon={<IconHash size={20} />}
                    color={room.type === 'private' ? '#E73C7E' : '#509EE3'}
                    onClick={() => handleChannelClick(room)}
                    badge={room.type === 'private' ? 'Private' : room.isPrivate ? 'Private' : 'Public'}
                    actions={
                      isOwner ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditChannel(room);
                            }}
                            style={{ padding: '4px 8px' }}
                          >
                            <IconEdit size={14} />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChannel(room);
                            }}
                            style={{ padding: '4px 8px', color: '#ef4444' }}
                          >
                            <IconTrash size={14} />
                          </Button>
                        </>
                      ) : null
                    }
                  />
                </Grid>
              );
            })}
            {filteredChannels.length === 0 && (
              <Grid item xs={4}>
                <Flex direction="column" align="center" justify="center" style={{ padding: '64px', width: '100%' }}>
                  <Typography variant="h4" color="text-secondary">
                    검색 결과가 없습니다.
                  </Typography>
                </Flex>
              </Grid>
            )}
          </Grid>
        )}

        {directoryTab === 'team' && (
          <>
            {isLoadingTeams ? (
              <Flex align="center" justify="center" style={{ padding: '64px' }}>
                <Typography variant="body-medium">팀 목록을 불러오는 중...</Typography>
              </Flex>
            ) : (
              <Grid container spacing={2} columns={4}>
                {filteredTeams.map((team) => {
                  const isOwner = isTeamOwner(team);
                  return (
                    <Grid item key={team._id} xs={4} sm={2} md={1}>
                      <DirectoryItemCard
                        title={team.teamName}
                        description={team.teamDesc}
                        icon={<IconUsers size={20} />}
                        color="#E73C7E"
                        onClick={() => handleTeamSelect(team)}
                        badge={`${team.members?.length || 0} Members`}
                        actions={
                          isOwner ? (
                            <>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditTeam(team);
                                }}
                                style={{ padding: '4px 8px' }}
                              >
                                <IconEdit size={14} />
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTeam(team);
                                }}
                                style={{ padding: '4px 8px', color: '#ef4444' }}
                              >
                                <IconTrash size={14} />
                              </Button>
                            </>
                          ) : null
                        }
                      />
                    </Grid>
                  );
                })}
                {filteredTeams.length === 0 && (
                  <Grid item xs={4}>
                    <Flex direction="column" align="center" justify="center" style={{ padding: '64px', width: '100%' }}>
                      <Typography variant="h4" color="text-secondary">
                        {searchTerm ? '검색 결과가 없습니다.' : '생성된 팀이 없습니다.'}
                      </Typography>
                      {!searchTerm && (
                        <Typography variant="body-medium" color="text-secondary">
                          새로운 프로젝트 팀을 만들어보세요.
                        </Typography>
                      )}
                    </Flex>
                  </Grid>
                )}
              </Grid>
            )}
          </>
        )}

        {directoryTab === 'user' && (
          <Grid container spacing={2} columns={4}>
            {filteredUsers.map((userItem) => (
              <Grid item key={userItem._id} xs={4} sm={2} md={1}>
                <DirectoryItemCard
                  isUser
                  title={userItem.username}
                  initials={userItem.username.substring(0, 1).toUpperCase()}
                  userImage={
                    userItem.avatar ||
                    userItem.profileImage ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.username)}&background=random`
                  }
                  userStatus={userItem.status || 'offline'}
                  color="#23D5AB"
                  onClick={() => startDirectChat(userItem._id)}
                  actions={
                    <Button
                      variant="secondary"
                      size="sm"
                      className="directory-card__action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        startDirectChat(userItem._id);
                      }}
                    >
                      <IconMessageCircle size={14} />
                      <span className="directory-card__action-text" style={{ marginLeft: '4px' }}>
                        메시지
                      </span>
                    </Button>
                  }
                />
              </Grid>
            ))}
            {filteredUsers.length === 0 && (
              <Grid item xs={4}>
                <Flex direction="column" align="center" justify="center" style={{ padding: '64px', width: '100%' }}>
                  <Typography variant="h4" color="text-secondary">
                    검색 결과가 없습니다.
                  </Typography>
                </Flex>
              </Grid>
            )}
          </Grid>
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

      {/* 채널 수정 다이얼로그 */}
      {editChannel && (
        <DialogChatGroup
          open={!!editChannel}
          onClose={() => setEditChannel(null)}
          onGroupCreated={async () => {
            setEditChannel(null);
            await refreshRoomList();
          }}
          group={
            editChannel
              ? {
                  _id: editChannel._id,
                  name: editChannel.name || '',
                  description: editChannel.description,
                  isPrivate: editChannel.isPrivate || false,
                  members: editChannel.members || [],
                  createdBy: editChannel.members?.[0] || ({} as ChatUser),
                }
              : undefined
          }
        />
      )}

      {/* 초대 링크 다이얼로그 */}
      {inviteChannel && (
        <Dialog
          open={!!inviteChannel}
          onClose={() => setInviteChannel(null)}
          title="채널 초대"
          maxWidth="sm"
          fullWidth
          actions={
            <Flex gap="sm">
              <Button onClick={() => setInviteChannel(null)}>닫기</Button>
            </Flex>
          }
        >
          <Stack spacing="md">
            {isChannelOwner(inviteChannel) ? (
              <>
                <Typography variant="body-medium">
                  이 채널의 초대 링크를 공유하세요. 링크를 가진 사용자만 채널에 입장할 수 있습니다.
                </Typography>
                <Box>
                  <Flex gap="sm" align="center">
                    <Input
                      fullWidth
                      disabled
                      value={
                        inviteChannel.slug
                          ? `${window.location.origin}/chatapp/invite/${inviteChannel.slug}`
                          : '초대 링크 생성 중...'
                      }
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                    />
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        const inviteLink = inviteChannel.slug
                          ? `${window.location.origin}/chatapp/invite/${inviteChannel.slug}`
                          : '';
                        if (inviteLink) {
                          await navigator.clipboard.writeText(inviteLink);
                          showSuccess('초대 링크가 클립보드에 복사되었습니다.');
                        }
                      }}
                    >
                      <IconCopy size={18} />
                    </Button>
                  </Flex>
                </Box>
              </>
            ) : (
              <Typography variant="body-medium" color="text-secondary">
                이 채널은 비공개 채널입니다. 채널 Owner에게 초대 링크를 요청하세요.
              </Typography>
            )}
          </Stack>
        </Dialog>
      )}
    </Box>
  );
};
