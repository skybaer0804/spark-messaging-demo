import { useNotificationApp } from './hooks/useNotificationApp';
import { Button } from '@/ui-components/Button/Button';
import { Input } from '@/ui-components/Input/Input';
import { Select } from '@/ui-components/Select/Select';
import { Box } from '@/ui-components/Layout/Box';
import { Stack } from '@/ui-components/Layout/Stack';
import { Flex } from '@/ui-components/Layout/Flex';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconSend, IconCalendar, IconPlus, IconRefresh, IconHistory } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { Drawer } from '@/ui-components/Drawer/Drawer';
import { StatusChip } from '@/ui-components/StatusChip/StatusChip';
import './NotificationApp.scss';

export function NotificationApp() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  const {
    title,
    setTitle,
    message,
    setMessage,
    scheduledDate,
    setScheduledAt,
    targetType,
    setTargetType,
    targetId,
    setTargetId,
    workspaceList,
    isConnected,
    handleSend,
    notifications,
    isLoading,
    isDrawerOpen,
    setIsDrawerOpen,
    handleResend,
    fetchNotifications,
  } = useNotificationApp();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTargetLabel = (type: string, id?: string) => {
    if (type === 'all') return '전체 사용자';
    const workspace = workspaceList.find((ws) => ws._id === id);
    return workspace ? `워크스페이스: ${workspace.name}` : '알 수 없는 대상';
  };

  if (!isAdmin) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '100%', padding: '40px' }}>
        <Typography variant="h2" color="text-error">
          접근 거부
        </Typography>
        <Typography variant="body-medium">관리자만 시스템 알림을 보낼 수 있습니다.</Typography>
      </Flex>
    );
  }

  return (
    <Paper square elevation={0} className="notification-app">
      <Box padding="lg" className="notification-app__header">
        <Flex justify="space-between" align="center">
          <Box>
            <Typography variant="h3">시스템 알림 관리</Typography>
            <Typography variant="body-medium" color="text-secondary">
              과거 발송 목록을 확인하고 새로운 공지를 생성합니다.
            </Typography>
          </Box>
          <Flex gap="sm">
            <Button variant="outline" onClick={fetchNotifications} disabled={isLoading}>
              <IconRefresh size={20} className={isLoading ? 'rotate' : ''} />
            </Button>
            <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
              <IconPlus size={20} />
              <span>공지 생성</span>
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Box padding="lg" style={{ flex: 1, overflowY: 'auto' }}>
        <div className="notification-list">
          {notifications.length === 0 ? (
            <Flex direction="column" align="center" justify="center" style={{ padding: '80px 0' }}>
              <IconHistory size={48} color="var(--color-text-tertiary)" style={{ marginBottom: '16px' }} />
              <Typography color="text-tertiary">발송된 알림이 없습니다.</Typography>
            </Flex>
          ) : (
            <table className="notification-table">
              <thead>
                <tr>
                  <th>제목/내용</th>
                  <th>대상</th>
                  <th>발송 시간</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif._id}>
                    <td>
                      <Typography variant="body-medium" style={{ fontWeight: 600 }}>
                        {notif.title}
                      </Typography>
                      <Typography variant="caption" color="text-secondary" className="text-truncate">
                        {notif.content}
                      </Typography>
                    </td>
                    <td>
                      <Typography variant="caption">{getTargetLabel(notif.targetType, notif.targetId)}</Typography>
                    </td>
                    <td>
                      <Typography variant="caption">{formatDate(notif.createdAt)}</Typography>
                    </td>
                    <td>
                      <StatusChip
                        label={notif.isSent ? '발송완료' : '대기중'}
                        color={notif.isSent ? 'success' : 'warning'}
                      />
                    </td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => handleResend(notif)}>
                        <IconSend size={16} />
                        <span>재발송</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Box>

      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="새 시스템 알림 생성"
        anchor="right"
        width={400}
      >
        <Box padding="lg">
          <Stack spacing="xl">
            <Input
              label="알림 제목"
              value={title}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder="알림 제목을 입력하세요..."
              fullWidth
            />

            <Input
              label="메시지 내용"
              multiline
              rows={6}
              value={message}
              onInput={(e) => setMessage(e.currentTarget.value)}
              placeholder="알림 메시지를 입력하세요..."
              fullWidth
            />

            <Select
              label="대상 유형"
              value={targetType}
              onChange={(e) => setTargetType(e.currentTarget.value as any)}
              options={[
                { label: '전체 사용자', value: 'all' },
                { label: '특정 워크스페이스', value: 'workspace' },
              ]}
              fullWidth
            />

            {targetType === 'workspace' && (
              <Select
                label="워크스페이스 선택"
                value={targetId}
                onChange={(e) => setTargetId(e.currentTarget.value)}
                options={workspaceList.map((ws) => ({
                  label: ws.name,
                  value: ws._id,
                }))}
                fullWidth
              />
            )}

            <Box>
              <Typography variant="body-small" style={{ marginBottom: '8px', display: 'block', fontWeight: 600 }}>
                예약 전송 (선택 사항)
              </Typography>
              <Flex gap="sm" align="center">
                <IconCalendar size={20} color="var(--color-text-tertiary)" />
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledAt(e.currentTarget.value)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-default)',
                    color: 'var(--color-text-primary)',
                    flex: 1,
                  }}
                />
              </Flex>
              <Typography variant="caption" color="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
                비워두면 즉시 전송됩니다.
              </Typography>
            </Box>

            <Box style={{ marginTop: '24px' }}>
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={handleSend}
                disabled={!isConnected || !message.trim() || !title.trim()}
              >
                <Stack direction="row" align="center" spacing="sm" justify="center">
                  <IconSend size={20} />
                  <span>알림 보내기</span>
                </Stack>
              </Button>
            </Box>
          </Stack>
        </Box>
      </Drawer>
    </Paper>
  );
}

