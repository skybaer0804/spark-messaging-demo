import { Box } from '@/ui-components/Layout/Box';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem, ListItemText, ListItemAvatar } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import type { ChatUser } from '../types';

interface ChatMemberPanelProps {
  members?: ChatUser[];
}

export const ChatMemberPanel = ({ members = [] }: ChatMemberPanelProps) => {
  return (
    <Paper
      elevation={0}
      square
      style={{
        width: '240px',
        borderLeft: '1px solid var(--color-border-default)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <Box padding="md" style={{ borderBottom: '1px solid var(--color-border-default)' }}>
        <Typography variant="h4">참여자 ({members.length})</Typography>
      </Box>
      <Box style={{ flex: 1, overflowY: 'auto' }}>
        <List>
          {members.map((member) => (
            <ListItem key={member._id}>
              <ListItemAvatar>
                <Avatar
                  src={member.avatar}
                  variant="circular"
                  size="sm"
                  style={{
                    border: `2px solid ${
                      member.status === 'online' ? 'var(--color-success-main)' : 'var(--color-text-tertiary)'
                    }`,
                  }}
                >
                  {member.username.substring(0, 1).toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary={member.username} secondary={member.status === 'online' ? 'Online' : 'Offline'} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};
