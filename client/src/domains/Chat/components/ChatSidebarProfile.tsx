import { useState, useEffect } from 'preact/hooks';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { List, ListItem, ListItemText } from '@/ui-components/List/List';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Divider } from '@/ui-components/Divider/Divider';
import {
  IconSearch,
  IconAddressBook,
  IconArrowsExchange,
  IconEdit,
  IconDotsVertical,
  IconCircleFilled,
  IconCircle,
  IconUser,
  IconLogout,
} from '@tabler/icons-preact';
import { useAuth } from '@/core/hooks/useAuth';
import { authApi } from '@/core/api/ApiService';
import { useToast } from '@/core/context/ToastContext';
import { useRouterState } from '@/routes/RouterState';

interface ChatSidebarProfileProps {
  setIsSearching: (val: boolean) => void;
  showCreateMenu: boolean;
  setShowCreateMenu: (val: boolean | ((prev: boolean) => boolean)) => void;
}

export const ChatSidebarProfile = ({
  setIsSearching,
  showCreateMenu,
  setShowCreateMenu,
}: ChatSidebarProfileProps) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user: currentUser, signOut } = useAuth();
  const { showInfo, showSuccess } = useToast();
  const { navigate } = useRouterState();

  const handleUpdateStatus = async (status: string) => {
    try {
      await authApi.updateProfile({ status });
      setShowProfileMenu(false);
      showSuccess(`상태가 ${status}로 변경되었습니다.`);
      if (currentUser) {
        currentUser.status = status as any;
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth/login');
    } catch (err) {
      console.error('Failed to logout:', err);
    }
  };

  useEffect(() => {
    const handleClick = () => {
      setShowProfileMenu(false);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <>
      <div
        className="chat-app__sidebar-profile"
        onClick={(e) => {
          e.stopPropagation();
          setShowProfileMenu(!showProfileMenu);
        }}
        style={{ cursor: 'pointer', position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}
      >
        <div style={{ position: 'relative' }}>
          <Avatar src={currentUser?.profileImage} size="sm">
            {currentUser?.username?.substring(0, 1).toUpperCase() || <IconUser size={20} />}
          </Avatar>
          <div
            className={`avatar-status avatar-status--${currentUser?.status || 'online'}`}
            style={{
              border: '2px solid #2c333d',
              bottom: '-2px',
              right: '-2px',
              width: '10px',
              height: '10px',
            }}
          />
        </div>
        <Typography variant="body-medium" style={{ fontWeight: 'bold', color: 'inherit' }}>
          {currentUser?.username || 'User'}
        </Typography>
      </div>

      {/* Profile Menu Dropdown */}
      {showProfileMenu && (
        <div className="chat-app__profile-menu" onClick={(e) => e.stopPropagation()}>
          <div className="chat-app__profile-menu-header">
            <Flex align="center" gap="md">
              <div style={{ position: 'relative' }}>
                <Avatar src={currentUser?.profileImage} size="md">
                  {currentUser?.username?.substring(0, 1)}
                </Avatar>
                <div
                  className={`avatar-status avatar-status--${currentUser?.status || 'online'}`}
                  style={{ border: '2px solid #fff', bottom: '0', right: '0', width: '12px', height: '12px' }}
                />
              </div>
              <Box>
                <Typography variant="h4" style={{ fontWeight: 'bold' }}>
                  {currentUser?.username || 'User'}
                </Typography>
                <Typography variant="caption" color="text-secondary">
                  {currentUser?.status === 'online'
                    ? '온라인'
                    : currentUser?.status === 'away'
                    ? '자리비움'
                    : currentUser?.status === 'busy'
                    ? '바쁨'
                    : '오프라인'}
                </Typography>
              </Box>
            </Flex>
          </div>

          <div className="chat-app__profile-menu-section">
            <List disablePadding>
              <ListItem onClick={() => handleUpdateStatus('online')} className="chat-app__profile-menu-item">
                <IconCircleFilled size={14} style={{ color: '#2bac76', marginRight: '12px' }} />
                <ListItemText primary="온라인" />
              </ListItem>
              <ListItem onClick={() => handleUpdateStatus('away')} className="chat-app__profile-menu-item">
                <IconCircleFilled size={14} style={{ color: '#f59e0b', marginRight: '12px' }} />
                <ListItemText primary="자리비움" />
              </ListItem>
              <ListItem onClick={() => handleUpdateStatus('busy')} className="chat-app__profile-menu-item">
                <IconCircleFilled size={14} style={{ color: '#e11d48', marginRight: '12px' }} />
                <ListItemText primary="바쁨" />
              </ListItem>
              <ListItem onClick={() => handleUpdateStatus('offline')} className="chat-app__profile-menu-item">
                <IconCircle size={14} style={{ color: '#94a3b8', marginRight: '12px' }} />
                <ListItemText primary="오프라인" />
              </ListItem>
            </List>
          </div>

          <Divider />

          <div className="chat-app__profile-menu-section">
            <List disablePadding>
              <ListItem
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="chat-app__profile-menu-item"
              >
                <IconUser size={18} style={{ marginRight: '12px', color: '#64748b' }} />
                <ListItemText primary="프로필" />
              </ListItem>
            </List>
          </div>

          <Divider />

          <div className="chat-app__profile-menu-section">
            <List disablePadding>
              <ListItem onClick={handleLogout} className="chat-app__profile-menu-item">
                <IconLogout size={18} style={{ marginRight: '12px', color: '#64748b' }} />
                <ListItemText primary="로그아웃" />
              </ListItem>
            </List>
          </div>
        </div>
      )}

      <div className="chat-app__sidebar-actions">
        <IconButton size="small" onClick={() => setIsSearching(true)}>
          <IconSearch size={20} />
        </IconButton>
        <IconButton size="small" title="디렉토리" onClick={() => navigate('/chatapp/directory')}>
          <IconAddressBook size={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            showInfo('준비 중입니다.');
          }}
        >
          <IconArrowsExchange size={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setShowCreateMenu(!showCreateMenu);
          }}
        >
          <IconEdit size={20} />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            showInfo('준비 중입니다.');
          }}
        >
          <IconDotsVertical size={20} />
        </IconButton>
      </div>
    </>
  );
};
