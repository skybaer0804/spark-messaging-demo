import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import {
  IconMessageCircle,
  IconBell,
  IconGavel,
  IconPalette,
  IconSparkles,
  IconPin,
  IconPinFilled,
} from '@tabler/icons-react';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { List, ListItem, ListItemText } from '@/ui-component/List/List';
import { IconButton } from '@/ui-component/Button/IconButton';
import { useTheme } from '@/context/ThemeProvider';
import './Sidebar.scss';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: JSX.Element;
  view: string;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { sidebarConfig, setSidebarConfig } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  const { miniDrawer, pinned } = sidebarConfig;
  const isExpanded = pinned || (!miniDrawer && !pinned) || (miniDrawer && isHovered);

  const menuItems: MenuItem[] = [
    {
      id: 'chat',
      label: '채팅',
      icon: <IconMessageCircle size={20} />,
      view: 'chat',
    },
    {
      id: 'notification',
      label: '알림',
      icon: <IconBell size={20} />,
      view: 'notification',
    },
    {
      id: 'reverse-auction',
      label: '역경매',
      icon: <IconGavel size={20} />,
      view: 'reverse-auction',
    },
    {
      id: 'design-system',
      label: '디자인',
      icon: <IconPalette size={20} />,
      view: 'design-system',
    },
  ];

  const handleTogglePin = () => {
    setSidebarConfig({ pinned: !pinned });
  };

  return (
    <aside
      className={`sidebar ${miniDrawer ? 'sidebar--mini' : ''} ${isExpanded ? 'sidebar--expanded' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="sidebar__container">
        {/* 상단 헤더 */}
        <div className="sidebar__header">
          {isExpanded && (
            <Flex align="center" gap="sm" style={{ flex: 1 }}>
              <div className="sidebar__logo">
                <IconSparkles size={24} />
              </div>
              <Typography variant="body-large" className="sidebar__header-title">
                Spark
              </Typography>
            </Flex>
          )}
          {!isExpanded && (
            <div className="sidebar__logo sidebar__logo--centered">
              <IconSparkles size={24} />
            </div>
          )}
          <div className="sidebar__header-actions">
            {isExpanded && (
              <IconButton
                size="small"
                color="default"
                onClick={handleTogglePin}
                title={pinned ? '고정 해제' : '고정'}
                className="sidebar__pin-button"
              >
                {pinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
              </IconButton>
            )}
          </div>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="sidebar__nav">
          <List disablePadding>
            {menuItems.map((item) => {
              const isActive = currentView === item.view;
              return (
                <ListItem
                  key={item.id}
                  className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`}
                  onClick={() => onViewChange(item.view)}
                  disableGutters
                >
                  {miniDrawer && !isExpanded ? (
                    <div className="sidebar__nav-item-mini">
                      <div className="sidebar__nav-item-icon">{item.icon}</div>
                      <Typography variant="body-small" className="sidebar__nav-item-label">
                        {item.label}
                      </Typography>
                    </div>
                  ) : (
                    <>
                      <div className="sidebar__nav-item-icon">{item.icon}</div>
                      <ListItemText primary={item.label} />
                    </>
                  )}
                </ListItem>
              );
            })}
          </List>
        </nav>
      </div>
    </aside>
  );
}
