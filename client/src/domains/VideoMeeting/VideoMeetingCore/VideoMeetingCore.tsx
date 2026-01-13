import { memo } from 'preact/compat';
import { useState, useEffect } from 'preact/hooks';
import type { Room } from '../types';
import type { VideoMeetingStore } from '../stores/VideoMeetingStore';
import { Button } from '@/ui-components/Button/Button';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Input } from '@/ui-components/Input/Input';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Grid } from '@/ui-components/Layout/Grid';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Card, CardHeader, CardBody, CardFooter } from '@/ui-components/Card/Card';
import { StatusChip } from '@/ui-components/StatusChip/StatusChip';
import { Drawer } from '@/ui-components/Drawer/Drawer';
import { Switch } from '@/ui-components/Switch/Switch';
import {
  IconArrowLeft,
  IconCalendar,
  IconVideo,
  IconVideoOff,
  IconMicrophone,
  IconMicrophoneOff,
  IconUsers,
  IconLink,
  IconPlus,
  IconMessages,
} from '@tabler/icons-preact';
import { authApi } from '@/core/api/ApiService';
import './VideoMeetingCore.scss';

interface VideoMeetingCoreProps {
  store: VideoMeetingStore;
}

function VideoMeetingCoreComponent({ store }: VideoMeetingCoreProps) {
  const isConnected = store.isConnected.value;
  const userRole = store.userRole.value;
  const currentRoom = store.currentRoom.value;
  const roomList = store.roomList.value;
  const selectedCategory = store.selectedCategory.value;
  const pendingRequests = store.pendingRequests.value;
  const scheduledMeetings = store.scheduledMeetings.value;
  const isLocalVideoEnabled = store.isLocalVideoEnabled.value;
  const isLocalAudioEnabled = store.isLocalAudioEnabled.value;
  const myRooms = store.getMyRooms();

  // Drawer & Form State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [meetingForm, setMeetingForm] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    isReserved: false,
    isPrivate: false,
    password: '',
    invitedUsers: [] as string[],
    invitedWorkspaces: [] as string[],
  });
  const [userList, setUserList] = useState<any[]>([]);

  useEffect(() => {
    if (drawerOpen) {
      authApi.getUsers().then((uRes) => {
        setUserList(uRes.data);
      });
    }
  }, [drawerOpen]);

  const handleCreateMeeting = async () => {
    if (meetingForm.isReserved) {
      await store.scheduleMeeting(meetingForm);
    } else {
      await store.createRoom(selectedCategory, meetingForm.title);
    }
    setDrawerOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setMeetingForm({
      title: '',
      description: '',
      scheduledAt: '',
      isReserved: false,
      isPrivate: false,
      password: '',
      invitedUsers: [],
      invitedWorkspaces: [],
    });
  };

  const copyJoinLink = (hash: string) => {
    const link = `${window.location.origin}/video-meeting/join/${hash}`;
    navigator.clipboard.writeText(link);
    console.log('Link copied:', link);
  };

  const handleJoinRoom = async (room: Room) => {
    await store.joinRoom(room);
  };

  if (!currentRoom) {
    return (
      <Box className="video-meeting-core">
        <div className="video-meeting-core__container">
          {/* 히어로 섹션 */}
          <section className="video-meeting-core__hero">
            <Stack spacing="sm">
              <Flex align="center" gap="xs" className="video-meeting-core__badge">
                <IconVideo size={16} />
                <Typography variant="body-small">실시간 협업 도구</Typography>
              </Flex>
              <Typography variant="h1" className="video-meeting-core__title">
                얼굴을 보며 <span className="highlight">소통</span>하세요
              </Typography>
              <Typography variant="body-large" className="video-meeting-core__desc">
                언제 어디서나 팀원들과 실시간으로 연결되어 아이디어를 나누고 결정을 내릴 수 있습니다.
              </Typography>
              <Box style={{ marginTop: '24px' }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setDrawerOpen(true)}
                  disabled={!isConnected}
                  style={{ padding: '12px 24px' }}
                >
                  <IconPlus size={20} style={{ marginRight: '8px' }} /> 새 회의 만들기
                </Button>
              </Box>
            </Stack>
          </section>

          {/* 회의 생성 Drawer */}
          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="새 회의 만들기" width="450px">
            <Stack spacing="lg" padding="md">
              <Box>
                <Stack spacing="md">
                  <Input
                    label="회의 제목"
                    value={meetingForm.title}
                    onInput={(e) => setMeetingForm({ ...meetingForm, title: e.currentTarget.value })}
                    fullWidth
                    placeholder="회의 제목을 입력하세요"
                  />
                  <Input
                    label="회의 설명"
                    value={meetingForm.description}
                    onInput={(e) => setMeetingForm({ ...meetingForm, description: e.currentTarget.value })}
                    multiline
                    rows={3}
                    fullWidth
                    placeholder="회의에 대한 설명을 입력하세요"
                  />
                </Stack>
              </Box>

              <Box>
                <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                  <Typography variant="body-medium" style={{ fontWeight: 600 }}>
                    회의 예약
                  </Typography>
                  <Switch
                    checked={meetingForm.isReserved}
                    onChange={(checked) => setMeetingForm({ ...meetingForm, isReserved: checked })}
                  />
                </Flex>
                {meetingForm.isReserved && (
                  <Box style={{ marginTop: '12px' }}>
                    <Typography variant="caption" style={{ marginBottom: '4px', display: 'block' }}>
                      시작 시간
                    </Typography>
                    <input
                      type="datetime-local"
                      value={meetingForm.scheduledAt}
                      onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.currentTarget.value })}
                      style={{
                        padding: '10px',
                        width: '100%',
                        borderRadius: '8px',
                        border: '1px solid var(--color-border-default)',
                        backgroundColor: 'var(--color-bg-default)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </Box>
                )}
              </Box>

              <Box>
                <Flex justify="space-between" align="center" style={{ marginBottom: '8px' }}>
                  <Typography variant="body-medium" style={{ fontWeight: 600 }}>
                    비공개 설정 (비밀번호)
                  </Typography>
                  <Switch
                    checked={meetingForm.isPrivate}
                    onChange={(checked) => setMeetingForm({ ...meetingForm, isPrivate: checked })}
                  />
                </Flex>
                {meetingForm.isPrivate && (
                  <Input
                    type="password"
                    label="비밀번호"
                    value={meetingForm.password}
                    onInput={(e) => setMeetingForm({ ...meetingForm, password: e.currentTarget.value })}
                    fullWidth
                    placeholder="입장 시 필요한 비밀번호"
                    style={{ marginTop: '12px' }}
                  />
                )}
              </Box>

              <Box>
                <Typography variant="body-medium" style={{ fontWeight: 600, marginBottom: '12px' }}>
                  참가자 초대 (선택)
                </Typography>
                <Paper variant="outlined" style={{ maxHeight: '200px', overflowY: 'auto', padding: '0' }}>
                  <Box
                    padding="xs"
                    style={{
                      backgroundColor: 'var(--color-bg-tertiary)',
                      borderBottom: '1px solid var(--color-border-default)',
                    }}
                  >
                    <Typography variant="caption" style={{ fontWeight: 600 }}>
                      사용자
                    </Typography>
                  </Box>
                  {userList.map((u) => (
                    <Flex
                      key={u._id}
                      padding="sm"
                      align="center"
                      gap="sm"
                      style={{ borderBottom: '1px solid var(--color-border-muted)' }}
                    >
                      <input
                        type="checkbox"
                        checked={meetingForm.invitedUsers.includes(u._id)}
                        onChange={(e) => {
                          const ids = e.currentTarget.checked
                            ? [...meetingForm.invitedUsers, u._id]
                            : meetingForm.invitedUsers.filter((id) => id !== u._id);
                          setMeetingForm({ ...meetingForm, invitedUsers: ids });
                        }}
                      />
                      <Typography variant="body-small">{u.username}</Typography>
                    </Flex>
                  ))}
                </Paper>
              </Box>

              <Flex gap="md" style={{ marginTop: '16px' }}>
                <Button variant="secondary" onClick={() => setDrawerOpen(false)} fullWidth>
                  취소
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateMeeting}
                  disabled={!meetingForm.title || (meetingForm.isReserved && !meetingForm.scheduledAt)}
                  fullWidth
                >
                  {meetingForm.isReserved ? '회의 예약' : '지금 시작'}
                </Button>
              </Flex>
            </Stack>
          </Drawer>

          {/* 회의 리스트 섹션 */}
          <Box className="video-meeting-core__section">
            <Stack spacing="xl">
              {/* 예약 회의 */}
              <Box>
                <div className="video-meeting-core__section-header">
                  <Typography variant="h3">예약된 회의 ({scheduledMeetings.length})</Typography>
                </div>
                {scheduledMeetings.length === 0 ? (
                  <Paper className="video-meeting-core__empty-state">
                    <Stack align="center" spacing="sm">
                      <IconCalendar size={48} color="var(--color-text-tertiary)" />
                      <Typography color="text-secondary" variant="body-large">
                        아직 예약된 회의가 없습니다.
                      </Typography>
                    </Stack>
                  </Paper>
                ) : (
                  <Grid container spacing={3} columns={4}>
                    {scheduledMeetings.map((m) => (
                      <Grid item key={m._id} xs={4} sm={2} md={1}>
                        <Card className="video-meeting-core__meeting-card">
                          <CardHeader>
                            <Flex justify="space-between" align="flex-start">
                              <Stack spacing="xs">
                                <span className="meeting-type-tag">예약 회의</span>
                                <Typography variant="h4">{m.title}</Typography>
                              </Stack>
                              <StatusChip
                                label={m.status === 'ongoing' ? '진행중' : '대기중'}
                                variant={m.status === 'ongoing' ? 'active' : 'badge'}
                              />
                            </Flex>
                          </CardHeader>
                          <CardBody>
                            <Typography
                              variant="body-small"
                              color="text-secondary"
                              style={{
                                minHeight: '40px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {m.description || '회의에 대한 설명이 없습니다.'}
                            </Typography>
                            <div className="video-meeting-core__host-info">
                              <IconCalendar size={14} color="var(--color-text-tertiary)" />
                              <Typography variant="caption" color="text-tertiary">
                                {new Date(m.scheduledAt).toLocaleString()}
                              </Typography>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                              <IconUsers size={14} color="var(--color-text-tertiary)" />
                              <Typography variant="caption" color="text-tertiary">
                                호스트: {m.hostId.username}
                              </Typography>
                            </div>
                          </CardBody>
                          <CardFooter>
                            <Flex gap="sm" style={{ width: '100%' }}>
                              <IconButton size="medium" onClick={() => copyJoinLink(m.joinHash)} title="참여 링크 복사">
                                <IconLink size={18} />
                              </IconButton>
                              <Button
                                fullWidth
                                variant={m.status === 'ongoing' ? 'primary' : 'secondary'}
                                disabled={m.status === 'completed' || m.status === 'cancelled'}
                              >
                                {m.status === 'ongoing' ? '참여하기' : '상세정보'}
                              </Button>
                            </Flex>
                          </CardFooter>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>

              {/* 진행 중인 공개 회의 */}
              <Box>
                <div className="video-meeting-core__section-header">
                  <Typography variant="h3">공개 회의실 ({roomList.length})</Typography>
                </div>
                {roomList.length === 0 ? (
                  <Paper className="video-meeting-core__empty-state">
                    <Stack align="center" spacing="sm">
                      <IconMessages size={48} color="var(--color-text-tertiary)" />
                      <Typography color="text-secondary" variant="body-large">
                        활성화된 공개 회의실이 없습니다.
                      </Typography>
                    </Stack>
                  </Paper>
                ) : (
                  <Grid container spacing={3} columns={4}>
                    {roomList.map((room) => (
                      <Grid item key={room.roomId} xs={4} sm={2} md={1}>
                        <Card className="video-meeting-core__meeting-card">
                          <CardHeader>
                            <Flex justify="space-between">
                              <span className="meeting-type-tag">{room.category}</span>
                              {myRooms.has(room.roomId) && <StatusChip label="내 회의실" variant="active" />}
                            </Flex>
                            <Typography variant="h4" style={{ marginTop: '12px' }}>
                              {room.title}
                            </Typography>
                          </CardHeader>
                          <CardBody>
                            <Flex align="center" gap="xs">
                              <IconUsers size={14} color="var(--color-text-tertiary)" />
                              <Typography variant="caption" color="text-tertiary">
                                참가자 {room.participants || 0}명
                              </Typography>
                            </Flex>
                          </CardBody>
                          <CardFooter>
                            <Button fullWidth onClick={() => handleJoinRoom(room)} variant="primary">
                              참여하기
                            </Button>
                          </CardFooter>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            </Stack>
          </Box>
        </div>
      </Box>
    );
  }

  // Active Meeting View
  return (
    <Box style={{ flexShrink: 0 }} className="video-meeting-core__header">
      <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <Stack direction="row" align="center" justify="space-between">
          <Stack direction="row" align="center" spacing="sm">
            <IconButton onClick={() => store.leaveRoom()} color="default" size="medium" title="뒤로가기">
              <IconArrowLeft size={24} />
            </IconButton>
            <Typography variant="h3">{currentRoom.title}</Typography>
            <StatusChip label={currentRoom.category} variant="badge" />
          </Stack>

          <Flex align="center" gap="md">
            {/* 비디오/오디오 컨트롤 */}
            <Flex gap="xs">
              <IconButton
                onClick={() => store.toggleVideo()}
                color={isLocalVideoEnabled ? 'primary' : 'default'}
                size="medium"
                title={isLocalVideoEnabled ? '카메라 끄기' : '카메라 켜기'}
              >
                {isLocalVideoEnabled ? <IconVideo size={20} /> : <IconVideoOff size={20} />}
              </IconButton>
              <IconButton
                onClick={() => store.toggleAudio()}
                color={isLocalAudioEnabled ? 'primary' : 'default'}
                size="medium"
                title={isLocalAudioEnabled ? '마이크 끄기' : '마이크 켜기'}
              >
                {isLocalAudioEnabled ? <IconMicrophone size={20} /> : <IconMicrophoneOff size={20} />}
              </IconButton>
            </Flex>

            {userRole === 'demander' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => store.destroyRoom()}
                style={{ color: 'var(--color-error-main)' }}
              >
                방 폭파
              </Button>
            )}

            <Button variant="primary" size="sm" onClick={() => store.leaveRoom()}>
              나가기
            </Button>

            {userRole === 'demander' && pendingRequests.length > 0 && (
              <Paper
                elevation={2}
                padding="sm"
                style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 100, width: '300px' }}
              >
                <Stack spacing="sm">
                  <Typography variant="h4">참여 요청 ({pendingRequests.length})</Typography>
                  {pendingRequests.map((req) => (
                    <Paper key={req.socketId} variant="outlined" padding="sm">
                      <Typography variant="body-small">{req.name}</Typography>
                      <Flex gap="sm" style={{ marginTop: '8px' }}>
                        <Button size="sm" onClick={() => store.approveRequest(req.socketId)} fullWidth>
                          수락
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => store.rejectRequest(req.socketId)}
                          fullWidth
                        >
                          거절
                        </Button>
                      </Flex>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            )}

            {userRole === 'guest' && (
              <StatusChip label="게스트 모드 (관람/발언 전용)" variant="badge" style={{ marginLeft: '12px' }} />
            )}
          </Flex>
        </Stack>
      </Box>
    </Box>
  );
}

export const VideoMeetingCore = memo(VideoMeetingCoreComponent);
