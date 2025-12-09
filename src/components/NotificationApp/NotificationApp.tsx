import { useNotificationApp } from './hooks/useNotificationApp';
import { Button } from '@/ui-component/Button/Button';
import { Input } from '@/ui-component/Input/Input';
import { Select } from '@/ui-component/Select/Select';
import { Box } from '@/ui-component/Layout/Box';
import { Stack } from '@/ui-component/Layout/Stack';
import { Paper } from '@/ui-component/Paper/Paper';
import { Typography } from '@/ui-component/Typography/Typography';
import { Divider } from '@/ui-component/Divider/Divider';
import { IconBell, IconSend } from '@tabler/icons-react';
import './NotificationApp.scss';

export function NotificationApp() {
  const { message, setMessage, scheduleOption, setScheduleOption, isConnected, handleSend } = useNotificationApp();

  return (
    <Paper square elevation={0} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box padding="lg">
        <Stack direction="row" align="center" spacing="md" style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--primitive-blue-500)',
              color: 'white',
            }}
          >
            <IconBell size={24} />
          </div>
          <Typography variant="h2">Send Notification</Typography>
        </Stack>
        <Typography variant="body-medium" color="text-secondary" style={{ marginBottom: '24px' }}>
          Send broadcast messages to all connected users.
        </Typography>

        <Divider style={{ marginBottom: '24px' }} />

        <Stack spacing="xl">
          <Input
            label="Message Content"
            multiline
            rows={6}
            value={message}
            onInput={(e) => setMessage(e.currentTarget.value)}
            placeholder="Enter your notification message here..."
            fullWidth
            helperText={`${message.length} characters`}
          />

          <Select
            label="Schedule Delivery"
            value={scheduleOption}
            onChange={(e) => setScheduleOption(e.currentTarget.value as any)}
            options={[
              { label: '즉시', value: 'immediate' },
              { label: '1분 후', value: '1min' },
              { label: '5분 후', value: '5min' },
            ]}
            fullWidth
            disabled={!isConnected}
          />
          {/* Select disabled for demo as scheduling might not be fully implemented in backend yet, or just to keep it simple. 
                         Wait, the hook has setScheduleOption, so I should enable it? 
                         Original code had it enabled. Let's enable it. 
                         Wait, Select component has 'disabled' prop? Yes. 
                         Let's keep it enabled unless not isConnected? 
                      */}
        </Stack>
      </Box>

      <Box padding="lg" style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border-default)' }}>
        <Button variant="primary" fullWidth size="lg" onClick={handleSend} disabled={!isConnected || !message.trim()}>
          <Stack direction="row" align="center" spacing="sm" justify="center">
            <IconSend size={20} />
            <span>Send Notification</span>
          </Stack>
        </Button>
        {!isConnected && (
          <Typography
            variant="caption"
            color="text-error"
            align="center"
            style={{ marginTop: '8px', display: 'block' }}
          >
            Disconnected from server
          </Typography>
        )}
      </Box>
    </Paper>
  );
}
