import type { ComponentChildren } from 'preact';
import { useEffect, useMemo } from 'preact/hooks';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { Content } from '@/layouts/Content/Content';
import { Drawer } from '@/ui-component/Drawer/Drawer';
import { Grid } from '@/ui-component/Layout/Grid';
import { useTheme } from '@/context/ThemeProvider';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { SecondMenuDrawer } from '@/components/Sidebar/SecondMenuDrawer';
import { SidebarLayoutProvider, useSidebarLayout } from './SidebarLayoutContext';
import './SidebarLayout.scss';

interface SidebarLayoutInnerProps {
  headerTitle: string;
  isConnected: boolean;
  socketId: string | null;
  children: ComponentChildren;
}

function SidebarLayoutInner({ headerTitle, isConnected, socketId, children }: SidebarLayoutInnerProps) {
  const { deviceSize, sidebarConfig } = useTheme();
  const { isMobileSidebarOpen, closeMobileSidebar } = useSidebarLayout();
  const { pathname } = useRouterState();
  const { secondMenuPinned } = sidebarConfig;

  // 모바일 → PC 전환 시 Drawer가 열려있으면 자동 닫기
  useEffect(() => {
    if (deviceSize === 'pc') closeMobileSidebar();
  }, [closeMobileSidebar, deviceSize]);

  // 고정된 2차 메뉴 라우트 찾기
  const pinnedSecondMenuRoute: AppRouteNode | undefined = useMemo(() => {
    if (!secondMenuPinned) return undefined;
    const mainRoutes = appRoutes;
    const activeMainRoute = pathname.startsWith('/design-system')
      ? mainRoutes.find((r) => r.id === 'design-system')
      : mainRoutes.find((r) => pathname === r.path);
    if (activeMainRoute?.secondMenu && activeMainRoute?.children?.length) {
      return activeMainRoute;
    }
    return undefined;
  }, [pathname, secondMenuPinned]);

  return (
    <Grid 
      className={`sidebar-layout ${secondMenuPinned && pinnedSecondMenuRoute ? 'sidebar-layout--with-second-menu' : ''}`}
      columns="var(--sidebar-layout-columns)" 
      gap="none"
    >
      {/* 데스크톱: 고정 사이드바 */}
      <aside className="sidebar-layout__sidebar" aria-label="사이드바">
        <Sidebar />
      </aside>

      {/* 고정된 2차 사이드메뉴 */}
      {secondMenuPinned && pinnedSecondMenuRoute && (
        <aside className="sidebar-layout__second-menu" aria-label="2차 사이드메뉴">
          <SecondMenuDrawer
            open={true}
            onClose={() => {}}
            title={pinnedSecondMenuRoute.label}
            children={pinnedSecondMenuRoute.children}
          />
        </aside>
      )}

      {/* 메인 콘텐츠 */}
      <div className="sidebar-layout__content">
        <Content headerTitle={headerTitle} isConnected={isConnected} socketId={socketId}>
          {children}
        </Content>
      </div>

      {/* 모바일: 오버레이 Drawer */}
      <Drawer
        open={deviceSize === 'mobile' && isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        anchor="left"
        title="메뉴"
        width="var(--sidebar-width)"
        className="sidebar-layout__mobile-drawer"
      >
        <Sidebar />
      </Drawer>
    </Grid>
  );
}

interface SidebarLayoutProps {
  headerTitle: string;
  isConnected: boolean;
  socketId: string | null;
  children: ComponentChildren;
}

export function SidebarLayout(props: SidebarLayoutProps) {
  return (
    <SidebarLayoutProvider>
      <SidebarLayoutInner {...props} />
    </SidebarLayoutProvider>
  );
}


