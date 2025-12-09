import { memo } from 'preact/compat';
import type { Category, Room } from '../types';
import type { ReverseAuctionStore } from '../stores/ReverseAuctionStore';
import { Button } from '@/ui-component/Button/Button';
import { Input } from '@/ui-component/Input/Input';
import { Box } from '@/ui-component/Layout/Box';
import { Stack } from '@/ui-component/Layout/Stack';
import { Grid } from '@/ui-component/Layout/Grid';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Card, CardHeader, CardBody, CardFooter } from '@/ui-component/Card/Card';
import { StatusChip } from '@/ui-component/StatusChip/StatusChip';

interface ReverseAuctionCoreProps {
  store: ReverseAuctionStore;
}

function ReverseAuctionCoreComponent({ store }: ReverseAuctionCoreProps) {
  // Signal을 직접 읽어서 자동으로 반응형 업데이트
  // Signal.value를 읽으면 자동으로 구독되므로 컴포넌트가 리렌더링됨
  const isConnected = store.isConnected.value;
  const userRole = store.userRole.value;
  const currentRoom = store.currentRoom.value;
  const roomList = store.roomList.value;
  const showCreateForm = store.showCreateForm.value;
  const selectedCategory = store.selectedCategory.value;
  const roomTitle = store.roomTitle.value;
  const pendingRequests = store.pendingRequests.value;
  const joinRequestStatus = store.joinRequestStatus.value;
  const myRooms = store.getMyRooms();

  // 룸 생성 핸들러
  const handleCreateRoom = async () => {
    await store.createRoom(selectedCategory, roomTitle);
  };

  // 룸 참가 핸들러
  const handleJoinRoom = async (room: Room) => {
    await store.joinRoom(room);
  };

  // 참가 요청 승인 핸들러
  const handleApproveRequest = async (requesterSocketId: string) => {
    await store.approveRequest(requesterSocketId);
  };

  // 참가 요청 거부 핸들러
  const handleRejectRequest = async (requesterSocketId: string) => {
    await store.rejectRequest(requesterSocketId);
  };

  // 룸 나가기 핸들러
  const handleLeaveRoom = async () => {
    await store.leaveRoom();
  };

  // 초기 화면 (랜딩)
  if (!currentRoom) {
    return (
      <Box padding="lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <Stack spacing="lg">
          <Stack direction="row" align="center" justify="space-between">
            <Typography variant="h2">Reverse Auction</Typography>
            {!showCreateForm && (
              <Button onClick={() => store.setShowCreateForm(true)} disabled={!isConnected}>
                🏠 Create Room (Demander)
              </Button>
            )}
          </Stack>

          {showCreateForm ? (
            <Paper padding="lg">
              <Stack spacing="lg">
                <Typography variant="h3">Create New Room</Typography>
                <Stack spacing="sm">
                  <Typography variant="body-small">Category</Typography>
                  <Stack direction="row" spacing="sm">
                    {(['인테리어', '웹개발', '피규어'] as Category[]).map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? 'primary' : 'secondary'}
                        onClick={() => store.setSelectedCategory(cat)}
                        size="sm"
                      >
                        {cat}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
                <Input
                  label="Title"
                  value={roomTitle}
                  onInput={(e) => store.setRoomTitle(e.currentTarget.value)}
                  placeholder="e.g. 3평 원룸 인테리어 견적 요청"
                  disabled={!isConnected}
                  fullWidth
                />
                <Stack direction="row" spacing="md" justify="flex-end">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      store.setShowCreateForm(false);
                      store.setRoomTitle('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoom} disabled={!isConnected || !roomTitle.trim()}>
                    Create
                  </Button>
                </Stack>
              </Stack>
            </Paper>
          ) : (
            <Stack spacing="md">
              <Typography variant="h3">Active Rooms</Typography>
              {roomList.length === 0 ? (
                <Paper padding="lg">
                  <Typography align="center" color="text-secondary">
                    {!isConnected ? 'Connecting...' : 'No active rooms.'}
                  </Typography>
                </Paper>
              ) : (
                <Grid columns="repeat(auto-fill, minmax(300px, 1fr))" gap="lg">
                  {roomList.map((room) => (
                    <Card key={room.roomId}>
                      <CardHeader>
                        <Stack direction="row" justify="space-between" align="flex-start">
                          <StatusChip label={room.category} variant="badge" />
                          {myRooms.has(room.roomId) && <StatusChip label="My Room" variant="active" />}
                        </Stack>
                        <Typography variant="h3" style={{ marginTop: '8px' }}>
                          {room.title}
                        </Typography>
                      </CardHeader>
                      <CardBody>
                        <Typography variant="body-small" color="text-secondary">
                          Host: {room.creatorId.substring(0, 6)}
                        </Typography>
                        <Typography variant="body-small" color="text-secondary">
                          Participants: {room.participants}
                        </Typography>
                      </CardBody>
                      <CardFooter>
                        <Button
                          fullWidth
                          disabled={!isConnected || (joinRequestStatus === 'pending' && !myRooms.has(room.roomId))}
                          onClick={() => handleJoinRoom(room)}
                        >
                          {myRooms.has(room.roomId)
                            ? 'Enter'
                            : joinRequestStatus === 'pending'
                            ? 'Request Sent...'
                            : 'Join Request'}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </Grid>
              )}
            </Stack>
          )}
        </Stack>
      </Box>
    );
  }

  // 룸 내부 화면 - 헤더만 렌더링 (메인 컨텐츠는 ReverseAuction.tsx에서 렌더링)
  return (
    <Box style={{ flexShrink: 0 }}>
      <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <Stack direction="row" align="center" justify="space-between">
          <Stack direction="row" align="center" spacing="md">
            <Button onClick={handleLeaveRoom} variant="secondary" size="sm">
              ← Exit
            </Button>
            <Stack spacing="xs">
              <Stack direction="row" align="center" spacing="sm">
                <Typography variant="h3">{currentRoom.title}</Typography>
                <StatusChip label={currentRoom.category} variant="badge" />
              </Stack>
              <Typography variant="caption">
                Role: {userRole === 'demander' ? 'Demander (Host)' : 'Supplier'}
              </Typography>
            </Stack>
          </Stack>

          {/* 수요자일 경우 참가 요청 관리 */}
          {userRole === 'demander' && pendingRequests.length > 0 && (
            <Paper
              elevation={2}
              padding="sm"
              style={{ position: 'absolute', top: '60px', right: '20px', zIndex: 100, width: '300px' }}
            >
              <Stack spacing="sm">
                <Typography variant="h3">Join Requests ({pendingRequests.length})</Typography>
                {pendingRequests.map((req) => (
                  <Paper key={req.socketId} variant="outlined" padding="sm">
                    <Stack spacing="xs">
                      <Typography variant="body-small">
                        {req.name} ({req.socketId.substring(0, 6)})
                      </Typography>
                      <Stack direction="row" spacing="sm">
                        <Button size="sm" onClick={() => handleApproveRequest(req.socketId)} fullWidth>
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleRejectRequest(req.socketId)}
                          fullWidth
                        >
                          Reject
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// memo로 메모이제이션하여 store 참조가 변경되지 않으면 리렌더링 방지
export const ReverseAuctionCore = memo(ReverseAuctionCoreComponent, (prevProps, nextProps) => {
  return prevProps.store === nextProps.store;
});
