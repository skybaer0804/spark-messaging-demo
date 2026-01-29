import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { IconPalette, IconUser } from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { useRouterState } from '@/routes/RouterState';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Paper } from '@/ui-components/Paper/Paper';

export function MobileHeader() {
  const { user } = useAuth();
  const { navigate } = useRouterState();

  return (
    <Paper
      square
      elevation={1}
      padding="sm"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'var(--color-bg-default)',
        borderBottom: '1px solid var(--color-border-default)',
      }}
    >
      <Flex align="center" justify="space-between" style={{ height: '40px' }}>
        <div onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }}>
          <Avatar
             src={user?.profileImage}
             variant="circular"
             size="md"
             style={{ backgroundColor: 'var(--color-interactive-primary)' }}
          >
            {user?.username?.substring(0, 1).toUpperCase() || <IconUser size={20} />}
          </Avatar>
        </div>
        
        <Typography variant="h3" style={{ fontWeight: 800 }}>
          채팅
        </Typography>

        <IconButton onClick={() => navigate('/settings')}>
          <IconPalette size={24} />
        </IconButton>
      </Flex>
    </Paper>
  );
}
