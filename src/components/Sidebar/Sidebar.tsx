import type { ComponentChildren, JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import {
  IconSparkles,
  IconPlus,
  IconSettings,
} from '@tabler/icons-react';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
import { List, ListItem, ListItemText } from '@/ui-component/List/List';
import { IconButton } from '@/ui-component/Button/IconButton';
import { useTheme } from '@/context/ThemeProvider';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { useRouterState } from '@/routes/RouterState';
import { useSidebarLayoutOptional } from '@/layouts/SidebarLayout/SidebarLayoutContext';
import { Button } from '@/ui-component/Button/Button';
import { Divider } from '@/ui-component/Divider/Divider';
import { ThemeCustomization } from '@/components/ThemeCustomization/ThemeCustomization';
import { Avatar } from '@/ui-component/Avatar/Avatar';
import { chatCurrentRoom, chatRoomList, clearPendingJoinChatRoom, requestJoinChatRoom } from '@/stores/chatRoomsStore';
import { useRecentChatRooms } from './hooks/useRecentChatRooms';
import { SecondMenuDrawer } from './SecondMenuDrawer';
import './Sidebar.scss';

function NavLink(props: {
  to: string;
  className?: string;
  onMouseEnter?: JSX.MouseEventHandler<HTMLAnchorElement>;
  children: ComponentChildren;
}) {
  const { navigate } = useRouterState();
  const sidebarLayout = useSidebarLayoutOptional();
  const { deviceSize } = useTheme();
  return (
    <a
      href={props.to}
      className={props.className}
      onMouseEnter={props.onMouseEnter}
      onClick={(e) => {
        e.preventDefault();
        navigate(props.to);
        // 모바일 Drawer 안에서는 라우트 이동 시 메뉴를 닫아 UX 개선
        if (deviceSize === 'mobile') sidebarLayout?.closeMobileSidebar?.();
      }}
    >
      {props.children}
    </a>
  );
}

export function Sidebar() {
  const { sidebarConfig, setSidebarConfig, deviceSize } = useTheme();
  const { pathname, navigate } = useRouterState();
  const sidebarLayout = useSidebarLayoutOptional();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [hoveredSecondMenuId, setHoveredSecondMenuId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { secondMenuPinned } = sidebarConfig;
  const isMobile = deviceSize === 'mobile';
  const isExpanded = isMobile; // 호버해도 미니멀 상태 유지

  const mainRoutes = useMemo(() => appRoutes, []);
  const roomList = chatRoomList.value;
  const currentChatRoom = chatCurrentRoom.value;
  const recentChatRooms = useRecentChatRooms({ roomList, currentRoom: currentChatRoom, max: 8 });

  const activeMainRoute: AppRouteNode | undefined = useMemo(() => {
    if (pathname.startsWith('/design-system')) return mainRoutes.find((r) => r.id === 'design-system');
    return mainRoutes.find((r) => pathname === r.path);
  }, [mainRoutes, pathname]);

  const secondMenuRoute: AppRouteNode | undefined = useMemo(() => {
    if (hoveredSecondMenuId) return mainRoutes.find((r) => r.id === hoveredSecondMenuId);
    if (secondMenuPinned && activeMainRoute?.secondMenu && activeMainRoute?.children?.length) return activeMainRoute;
    return undefined;
  }, [activeMainRoute, hoveredSecondMenuId, mainRoutes, secondMenuPinned]);

  const [isSecondMenuHovered, setIsSecondMenuHovered] = useState(false);

  const handleSidebarMouseLeave = () => {
    setIsSidebarHovered(false);
    // 2차 사이드메뉴에 마우스가 있으면 언마운트하지 않음
    if (!secondMenuPinned && !isSecondMenuHovered) {
      setHoveredSecondMenuId(null);
    }
  };

  const handleSecondMenuMouseEnter = () => {
    setIsSecondMenuHovered(true);
    setIsSidebarHovered(true); // 사이드바도 호버 상태 유지
  };

  const handleSecondMenuMouseLeave = () => {
    setIsSecondMenuHovered(false);
    if (!secondMenuPinned) {
      setHoveredSecondMenuId(null);
    }
    setIsSidebarHovered(false);
  };

  const handleMainItemHover = (route: AppRouteNode) => {
    if (route.secondMenu && route.children?.length) {
      setHoveredSecondMenuId(route.id);
    } else {
      if (!secondMenuPinned) setHoveredSecondMenuId(null);
    }
  };

  const handleCreateNewChat = () => {
    // 현재 앱은 "대화 리스트" 개념이 없어서, UX 상 가장 자연스러운 기본 동작으로 Chat으로 이동
    // (추후 채팅방/대화 생성 기능이 생기면 이 핸들러만 교체하면 됨)
    clearPendingJoinChatRoom();
    navigate('/chatapp');
    if (deviceSize === 'mobile') sidebarLayout?.closeMobileSidebar?.();
  };

  const handleJoinRoomFromSidebar = (roomId: string) => {
    requestJoinChatRoom(roomId);
    navigate('/chatapp');
    if (deviceSize === 'mobile') sidebarLayout?.closeMobileSidebar?.();
  };

  const showSecondMenu =
    !isMobile &&
    !!secondMenuRoute?.children?.length &&
    (secondMenuPinned || isSidebarHovered || activeMainRoute?.id === secondMenuRoute.id);

  // 사이드바 너비를 CSS 변수로 설정하여 SecondMenuDrawer 위치 조정 (항상 미니)
  const sidebarWidth = 'var(--sidebar-width-mini)';

  return (
    <>
      <aside
        className={`sidebar sidebar--mini ${isExpanded ? 'sidebar--expanded' : ''}`}
        style={{ '--current-sidebar-width': sidebarWidth } as JSX.CSSProperties}
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={handleSidebarMouseLeave}
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
        </div>

        {/* 상단 액션 */}
        <div className="sidebar__primary">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={handleCreateNewChat}
            className="sidebar__primary-button"
          >
            <span className="sidebar__primary-button-icon">
              <IconPlus size={18} />
            </span>
            <span className="sidebar__primary-button-label">새 대화</span>
          </Button>
        </div>

        {/* 스크롤 섹션: 최근 채팅방 + 메뉴 */}
        <div className="sidebar__scroll">
          {/* 최근 채팅방 */}
          {isExpanded && recentChatRooms.length > 0 && (
            <div className="sidebar__section">
              <Typography variant="caption" className="sidebar__section-title" color="text-secondary">
                최근 채팅방
              </Typography>
              <nav className="sidebar__nav">
                <List disablePadding>
                  {recentChatRooms.map((room) => {
                    const isActive = pathname.startsWith('/chatapp') && currentChatRoom === room;
                    return (
                      <button
                        key={room}
                        type="button"
                        className={`sidebar__nav-button ${isActive ? 'sidebar__nav-button--active' : ''}`}
                        onClick={() => handleJoinRoomFromSidebar(room)}
                      >
                        <ListItem className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`} disableGutters>
                          <div className="sidebar__nav-item-icon">
                            <Avatar variant="rounded" size="sm" className="sidebar__room-avatar">
                              {room.substring(0, 2).toUpperCase()}
                            </Avatar>
                          </div>
                          <ListItemText primary={room} secondary={isActive ? 'Active' : ''} />
                        </ListItem>
                      </button>
                    );
                  })}
                </List>
              </nav>
            </div>
          )}

          {isExpanded && recentChatRooms.length > 0 && <Divider className="sidebar__divider" />}

          {/* 메인 메뉴 */}
          <div className="sidebar__section">
            {isExpanded && (
              <Typography variant="caption" className="sidebar__section-title" color="text-secondary">
                메뉴
              </Typography>
            )}
            <nav className="sidebar__nav">
              <List disablePadding>
                {mainRoutes.map((r) => {
                  const isActive = activeMainRoute?.id === r.id;
                  return (
                    <NavLink
                      key={r.id}
                      to={r.path}
                      className={`sidebar__nav-link ${isActive ? 'sidebar__nav-link--active' : ''}`}
                      onMouseEnter={() => handleMainItemHover(r)}
                    >
                      <ListItem className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''}`} disableGutters>
                        {!isExpanded ? (
                          <div className="sidebar__nav-item-mini">
                            <div className="sidebar__nav-item-icon">{r.icon}</div>
                            <Typography variant="body-small" className="sidebar__nav-item-label">
                              {r.label}
                            </Typography>
                          </div>
                        ) : (
                          <>
                            <div className="sidebar__nav-item-icon">{r.icon}</div>
                            <ListItemText primary={r.label} />
                          </>
                        )}
                      </ListItem>
                    </NavLink>
                  );
                })}
              </List>
            </nav>
          </div>
        </div>

        {/* 하단 고정 */}
        <div className="sidebar__bottom">
          <Divider className="sidebar__divider" />
          <button
            type="button"
            className="sidebar__bottom-button"
            onClick={() => {
              setSettingsOpen(true);
              // 모바일 Drawer에서는 클릭 즉시 닫고, 설정 Drawer는 우측에서 열리도록
              sidebarLayout?.closeMobileSidebar?.();
            }}
          >
            <div className="sidebar__bottom-button-icon">
              <IconSettings size={18} />
            </div>
            <Typography variant="body-small" className="sidebar__bottom-button-label">
              테마 설정
            </Typography>
          </button>
        </div>
      </div>

      <ThemeCustomization open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>

    {/* 2차 사이드메뉴 Drawer */}
    {secondMenuRoute && (
      <div 
        style={{ '--current-sidebar-width': sidebarWidth } as JSX.CSSProperties}
        onMouseEnter={handleSecondMenuMouseEnter}
        onMouseLeave={handleSecondMenuMouseLeave}
      >
        <SecondMenuDrawer
          open={showSecondMenu}
          onClose={() => {
            if (!secondMenuPinned) setHoveredSecondMenuId(null);
          }}
          title={secondMenuRoute.label}
          children={secondMenuRoute.children}
        />
      </div>
    )}
    </>
  );
}
