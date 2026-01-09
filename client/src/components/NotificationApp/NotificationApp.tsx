import { useNotificationApp } from './hooks/useNotificationApp';
import { Button } from '@/ui-component/Button/Button';
import { Input } from '@/ui-component/Input/Input';
import { Select } from '@/ui-component/Select/Select';
import { Box } from '@/ui-component/Layout/Box';
import { Stack } from '@/ui-component/Layout/Stack';
import { Flex } from '@/ui-component/Layout/Flex';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Divider } from '@/ui-component/Divider/Divider';
import { IconSend, IconCalendar } from '@tabler/icons-react';
import { useAuth } from '@/hooks/useAuth';
import './NotificationApp.scss';

export function NotificationApp() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const { 
    title, setTitle,
    message, setMessage, 
    scheduledDate, setScheduledAt,
    targetType, setTargetType,
    targetId, setTargetId,
    orgList,
    isConnected, 
    handleSend 
  } = useNotificationApp();

  if (!isAdmin) {
    return (
      <Flex direction="column" align="center" justify="center" style={{ height: '100%', padding: '40px' }}>
        <Typography variant="h2" color="text-error">Access Denied</Typography>
        <Typography variant="body-medium">Only administrators can send system notifications.</Typography>
      </Flex>
    );
  }

  return (
    <Paper square elevation={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box padding="lg" style={{ flex: 1, overflowY: 'auto' }}>
        <Typography variant="h3" style={{ marginBottom: '8px' }}>Create System Notification</Typography>
        <Typography variant="body-medium" color="text-secondary" style={{ marginBottom: '24px' }}>
          Send broadcast or targeted messages to users.
        </Typography>

        <Stack spacing="xl">
          <Input
            label="Notification Title"
            value={title}
            onInput={(e) => setTitle(e.currentTarget.value)}
            placeholder="Enter notification title..."
            fullWidth
          />

          <Input
            label="Message Content"
            multiline
            rows={4}
            value={message}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="Enter your notification message here..."
            fullWidth
          />

          <Flex gap="md">
            <Select
              label="Target Type"
              value={targetType}
              onChange={(e) => setTargetType(e.currentTarget.value as any)}
              options={[
                { label: 'All Users', value: 'all' },
                { label: 'Specific Organization', value: 'organization' },
              ]}
              style={{ flex: 1 }}
            />
            
            {targetType === 'organization' && (
              <Select
                label="Select Organization"
                value={targetId}
                onChange={(e) => setTargetId(e.currentTarget.value)}
                options={orgList.map(org => ({ 
                  label: `${org.name} (${org.dept1})`, 
                  value: org._id 
                }))}
                style={{ flex: 1 }}
              />
            )}
          </Flex>

          <Box>
            <Typography variant="body-small" fontWeight={600} style={{ marginBottom: '8px', display: 'block' }}>
              Schedule Delivery (Optional)
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
                  flex: 1
                }}
              />
            </Flex>
            <Typography variant="caption" color="text-secondary" style={{ marginTop: '4px', display: 'block' }}>
              Leave blank for immediate delivery.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box padding="lg" style={{ borderTop: '1px solid var(--color-border-default)' }}>
        <Button variant="primary" fullWidth size="lg" onClick={handleSend} disabled={!isConnected || !message.trim() || !title.trim()}>
          <Stack direction="row" align="center" spacing="sm" justify="center">
            <IconSend size={20} />
            <span>Send Notification</span>
          </Stack>
        </Button>
      </Box>
    </Paper>
  );
}
