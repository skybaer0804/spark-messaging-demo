import './Header.scss';
import { useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { ThemeCustomization } from '@/components/ThemeCustomization/ThemeCustomization';
import { Select, SelectOption } from '@/ui-component/Select/Select';
import { IconMoon, IconSun, IconEye, IconEyeOff, IconWifi, IconWifiOff, IconSettings } from '@tabler/icons-react';

interface HeaderProps {
  title: string;
  isConnected: boolean;
  socketId: string | null;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export function Header({ title, isConnected, socketId, currentView, onViewChange }: HeaderProps) {
  const { theme, toggleTheme, contrast, toggleContrast } = useTheme();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const viewOptions: SelectOption[] = [
    { value: 'chat', label: 'Chat' },
    { value: 'notification', label: 'Notification' },
    { value: 'reverse-auction', label: 'Reverse Auction' },
  ];

  const handleViewSelectChange = (e: Event) => {
    if (onViewChange) {
      const target = e.currentTarget as HTMLSelectElement;
      onViewChange(target.value);
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        {/* 모바일: Select로 뷰 전환 */}
        <div className="header__mobile-select">
          <Select
            options={viewOptions}
            value={currentView || 'chat'}
            onChange={handleViewSelectChange}
            className="header__view-select"
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
            <IconButton
              size="medium"
              color="default"
              onClick={toggleContrast}
              title={contrast === 'standard' ? '고대비 모드 켜기' : '고대비 모드 끄기'}
              className="header__icon-button"
            >
              {contrast === 'standard' ? <IconEye size={20} /> : <IconEyeOff size={20} />}
            </IconButton>
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
