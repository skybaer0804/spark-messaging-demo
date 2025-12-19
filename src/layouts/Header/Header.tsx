import './Header.scss';
import { useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { ThemeCustomization } from '@/components/ThemeCustomization/ThemeCustomization';
import { Select, SelectOption } from '@/ui-component/Select/Select';
import {
  IconMoon,
  IconSun,
  IconEye,
  IconEyeOff,
  IconWifi,
  IconWifiOff,
  IconSettings,
  IconMenu2,
} from '@tabler/icons-react';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes } from '@/routes/appRoutes';
import { useSidebarLayoutOptional } from '@/layouts/SidebarLayout/SidebarLayoutContext';

interface HeaderProps {
  title: string;
  isConnected: boolean;
  socketId: string | null;
}

export function Header({ title, isConnected, socketId }: HeaderProps) {
  const { theme, toggleTheme, contrast, toggleContrast, deviceSize } = useTheme();
  const { pathname, navigate } = useRouterState();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const sidebarLayout = useSidebarLayoutOptional();

  const viewOptions: SelectOption[] = appRoutes
    .filter((r) => r.id !== 'design-system' && r.id !== 'home')
    .map((r) => ({ value: r.path, label: r.title }));

  const handleViewSelectChange = (e: Event) => {
    const target = e.currentTarget as HTMLSelectElement;
    navigate(target.value);
  };

  const mobileSelectValue = viewOptions.some((o) => o.value === pathname)
    ? pathname
    : viewOptions[0]?.value || '/chatapp';

  return (
    <header className="header">
      <div className="header__left">
        {/* 모바일: 사이드바 열기
        {deviceSize === 'mobile' && sidebarLayout && (
          <IconButton
            size="medium"
            color="default"
            onClick={sidebarLayout.openMobileSidebar}
            title="메뉴 열기"
            className="header__menu-button"
          >
            <IconMenu2 size={20} />
          </IconButton>
        )} */}
        {/* 모바일: Select로 뷰 전환 */}
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
        {/* 데스크톱: 타이틀 표시 */}
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
            <IconButton
              size="medium"
              color="default"
              onClick={toggleTheme}
              title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
              className="header__icon-button"
            >
              {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} />}
            </IconButton>
            {/* <IconButton
              size="medium"
              color="default"
              onClick={toggleContrast}
              title={contrast === 'standard' ? '고대비 모드 켜기' : '고대비 모드 끄기'}
              className="header__icon-button"
            >
              {contrast === 'standard' ? <IconEye size={20} /> : <IconEyeOff size={20} />}
            </IconButton> */}
            <IconButton
              size="medium"
              color="default"
              onClick={() => setSettingsOpen(true)}
              title="설정"
              className="header__icon-button"
            >
              <IconSettings size={20} />
            </IconButton>
          </Flex>
        </Flex>
      </div>
      <ThemeCustomization open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </header>
  );
}
