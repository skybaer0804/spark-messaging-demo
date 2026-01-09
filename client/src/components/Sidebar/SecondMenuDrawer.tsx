import type { ComponentChildren } from 'preact';
import { IconPin, IconPinFilled } from '@tabler/icons-react';
import { Typography } from '@/ui-components/Typography/Typography';
import { List, ListItem, ListItemText } from '@/ui-components/List/List';
import { IconButton } from '@/ui-components/Button/IconButton';
import { useRouterState } from '@/routes/RouterState';
import { useSidebarLayoutOptional } from '@/layouts/SidebarLayout/SidebarLayoutContext';
import { useTheme } from '@/core/context/ThemeProvider';
import './SecondMenuDrawer.scss';

interface SecondMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: Array<{
    id: string;
    label: string;
    path: string;
    title: string;
  }>;
}

function NavLink(props: { to: string; className?: string; children: ComponentChildren }) {
  const { navigate } = useRouterState();
  const sidebarLayout = useSidebarLayoutOptional();
  const { deviceSize } = useTheme();
  return (
    <a
      href={props.to}
      className={props.className}
      onClick={(e) => {
        e.preventDefault();
        navigate(props.to);
        if (deviceSize === 'mobile') sidebarLayout?.closeMobileSidebar?.();
      }}
    >
      {props.children}
    </a>
  );
}

export function SecondMenuDrawer({ open, onClose: _onClose, title, children }: SecondMenuDrawerProps) {
  const { pathname } = useRouterState();
  const { sidebarConfig, setSidebarConfig, deviceSize } = useTheme();
  const { secondMenuPinned } = sidebarConfig;
  const isMobile = deviceSize === 'mobile';

  const handleTogglePin = () => {
    setSidebarConfig({ secondMenuPinned: !secondMenuPinned });
  };

  if (!open && !secondMenuPinned) return null;
  if (isMobile) return null; // 모바일에서는 표시하지 않음

  return (
    <div
      className={`second-menu-drawer ${open || secondMenuPinned ? 'second-menu-drawer--open' : ''} ${
        secondMenuPinned ? 'second-menu-drawer--pinned' : ''
      }`}
    >
      <div className="second-menu-drawer__container">
        <div className="second-menu-drawer__header">
          <Typography variant="body-large" className="second-menu-drawer__title">
            {title}
          </Typography>
          <IconButton
            size="small"
            color="default"
            onClick={handleTogglePin}
            title={secondMenuPinned ? '2차 메뉴 고정 해제' : '2차 메뉴 고정'}
            className="second-menu-drawer__pin-button"
          >
            {secondMenuPinned ? <IconPinFilled size={18} /> : <IconPin size={18} />}
          </IconButton>
        </div>
        <div className="second-menu-drawer__body">
          <List disablePadding>
            {children?.map((c) => {
              const isActive = pathname === c.path;
              return (
                <NavLink
                  key={c.id}
                  to={c.path}
                  className={`second-menu-drawer__link ${isActive ? 'second-menu-drawer__link--active' : ''}`}
                >
                  <ListItem className="second-menu-drawer__item" disableGutters>
                    <ListItemText primary={c.label} />
                  </ListItem>
                </NavLink>
              );
            })}
          </List>
        </div>
      </div>
    </div>
  );
}
