import './Header.scss';
import { useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import { IconButton } from '@/ui-components/Button/IconButton';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { ThemeCustomization } from '@/components/ThemeCustomization/ThemeCustomization';
import { Select, SelectOption } from '@/ui-components/Select/Select';
import {
  IconMoon,
  IconSun,
  IconWifi,
  IconWifiOff,
  IconSettings,
  IconUser,
  IconLogin,
  IconPalette,
  IconLogout,
} from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes } from '@/routes/appRoutes';
import { useAuth } from '@/core/hooks/useAuth';
import { Paper } from '@/ui-components/Paper/Paper';
import { List, ListItem, ListItemText } from '@/ui-components/List/List';

interface HeaderProps {
  title: string;
  isConnected: boolean;
  socketId: string | null;
}

export function Header({ title, isConnected, socketId }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { pathname, navigate } = useRouterState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();

  const homeRoute = appRoutes.find((r) => r.id === 'home');
  const viewOptions: SelectOption[] = [
    ...(homeRoute ? [{ value: homeRoute.path, label: homeRoute.title }] : []),
    ...appRoutes
      .filter((r) => r.id !== 'design-system' && r.id !== 'home')
      .map((r) => ({ value: r.path, label: r.title })),
  ];

  const handleViewSelectChange = (e: Event) => {
    const target = e.currentTarget as HTMLSelectElement;
    navigate(target.value);
  };

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/login');
  };

  const openThemeSettings = () => {
    setSettingsOpen(true);
    setMenuOpen(false);
  };

  const mobileSelectValue = viewOptions.some((o) => o.value === pathname)
    ? pathname
    : pathname === '/'
    ? '/'
    : viewOptions[0]?.value || '/chatapp';

  return (
    <header className="header">
      <div className="header__left">
        <div className="header__mobile-select">
          <Select
            options={viewOptions}
            value={mobileSelectValue}
            onChange={handleViewSelectChange}
            className="header__view-select"
            style={{ maxWidth: '100px' }}
            fullWidth={false}
          />
        </div>
        <Typography variant="h3" className="header__title">
          {title}
        </Typography>
      </div>

      <div className="header__right">
        <Flex align="center" gap="md">
          {/* 연결 상태 */}
          <div className="header__status">
            <div
              className={`header__status-badge ${
                isConnected ? 'header__status-badge--connected' : 'header__status-badge--disconnected'
              }`}
            >
              <Flex align="center" gap="xs">
                {isConnected ? <IconWifi size={14} /> : <IconWifiOff size={14} />}
                <Typography variant="body-small" className="header__status-text">
                  {isConnected ? `Connected (${socketId?.substring(0, 8)}...)` : 'Disconnected'}
                </Typography>
              </Flex>
            </div>
          </div>

          {/* 컨트롤 버튼 */}
          <Flex align="center" gap="xs" className="header__controls">
            {isAuthenticated ? (
              <IconButton
                size="medium"
                color="default"
                onClick={() => navigate('/profile')}
                title="프로필"
                className="header__icon-button"
              >
                <IconUser size={20} />
              </IconButton>
            ) : (
              <IconButton
                size="medium"
                color="primary"
                onClick={() => navigate('/login')}
                title="로그인"
                className="header__icon-button"
              >
                <IconLogin size={20} />
              </IconButton>
            )}
            <IconButton
              size="medium"
              color="default"
              onClick={toggleTheme}
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
              className="header__icon-button"
            >
              {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
            </IconButton>
            <div className="header__settings-container">
              <IconButton
                size="medium"
                color="default"
                onClick={() => {
                  console.log('Settings clicked, current state:', !menuOpen);
                  setMenuOpen(!menuOpen);
                }}
                title="설정"
                className={`header__icon-button ${menuOpen ? 'header__icon-button--active' : ''}`}
              >
                <IconSettings size={20} />
              </IconButton>

              {menuOpen && (
                <div className="header__menu">
                  <Paper elevation={4} className="header__menu-paper">
                    <List disablePadding>
                      <ListItem onClick={openThemeSettings} className="header__menu-item">
                        <Flex align="center" gap="sm">
                          <IconPalette size={18} />
                          <ListItemText primary="테마" />
                        </Flex>
                      </ListItem>
                      {isAuthenticated && (
                        <ListItem onClick={handleLogout} className="header__menu-item">
                          <Flex align="center" gap="sm">
                            <IconLogout size={18} />
                            <ListItemText primary="로그아웃" />
                          </Flex>
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </div>
              )}
            </div>
          </Flex>
        </Flex>
      </div>
      <ThemeCustomization open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {menuOpen && <div className="header__menu-overlay" onClick={() => setMenuOpen(false)} />}
    </header>
  );
}
