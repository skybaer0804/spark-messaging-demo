import { useMemo } from 'preact/hooks';
import { IconSparkles } from '@tabler/icons-react';
import { Flex } from '@/ui-components/Layout/Flex';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import './Sidebar.scss';

export function Sidebar() {
  const { pathname, navigate } = useRouterState();

  const lnbRouteIds = ['chatapp', 'notification', 'video-meeting', 'settings', 'profile'];
  
  const lnbRoutes = useMemo(() => {
    return lnbRouteIds.map(id => appRoutes.find(r => r.id === id)).filter(Boolean) as AppRouteNode[];
  }, []);

  return (
    <aside className="lnb">
      <div className="lnb__container">
        {/* 상단 로고 */}
        <div className="lnb__header">
          <div 
            className="lnb__logo" 
            onClick={() => navigate('/')}
            title="Home"
          >
            <IconSparkles size={28} />
          </div>
        </div>

        {/* 메인 메뉴 아이콘들 */}
        <nav className="lnb__nav">
          {lnbRoutes.map((route) => {
            const isActive = pathname.startsWith(route.path) && (route.path !== '/' || pathname === '/');
            return (
              <button
                key={route.id}
                type="button"
                className={`lnb__item ${isActive ? 'lnb__item--active' : ''}`}
                onClick={() => navigate(route.path)}
                title={route.label}
              >
                <div className="lnb__item-icon">
                  {route.icon}
                </div>
                <span className="lnb__item-label">{route.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 하단 빈 공간 또는 추가 액션 (필요시) */}
        <div className="lnb__footer">
          {/* 하단에 추가하고 싶은 아이콘이 있다면 여기에 */}
        </div>
      </div>
    </aside>
  );
}
