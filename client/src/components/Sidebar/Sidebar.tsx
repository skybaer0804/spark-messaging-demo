import { useMemo, useEffect, useState } from 'preact/hooks';
import { IconSparkles, IconPlus, IconUser } from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { appRoutes, type AppRouteNode } from '@/routes/appRoutes';
import { currentWorkspaceId, setCurrentWorkspaceId, chatRoomList } from '@/stores/chatRoomsStore';
import { workspaceApi } from '@/core/api/ApiService';
import { useAuth } from '@/core/hooks/useAuth';
import { Badge } from '@/ui-components/Badge/Badge';
import { Avatar } from '@/ui-components/Avatar/Avatar';
import './Sidebar.scss';

export function Sidebar() {
  const { pathname, navigate } = useRouterState();
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<any[]>([]);

  const totalUnreadCount = useMemo(() => {
    return chatRoomList.value.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
  }, [chatRoomList.value]);

  const lnbRouteIds = ['chatapp', 'notification', 'video-meeting'];

  const lnbRoutes = useMemo(() => {
    return lnbRouteIds.map((id) => appRoutes.find((r) => r.id === id)).filter(Boolean) as AppRouteNode[];
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getWorkspaces();
      setWorkspaces(res.data);
      if (res.data.length > 0 && !currentWorkspaceId.value) {
        setCurrentWorkspaceId(res.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const activeWorkspaceId = currentWorkspaceId.value;

  const handleWorkspaceSelect = (id: string) => {
    setCurrentWorkspaceId(id);
    navigate(`/workspace/${id}`);
  };

  return (
    <aside className="lnb">
      <div className="lnb__container">
        {/* 2.2.0: 홈 아이콘 (상단 배치) */}
        <div className="lnb__header">
          <div className="lnb__logo" onClick={() => navigate('/')} title="Home">
            <IconSparkles size={28} />
          </div>
        </div>

        <div className="lnb__divider" />

        {/* 워크스페이스 목록 (Column 1) */}
        <div className="lnb__workspaces">
          {workspaces.map((ws) => (
            <div
              key={ws._id}
              className={`lnb__workspace-item ${activeWorkspaceId === ws._id ? 'lnb__workspace-item--active' : ''}`}
              onClick={() => handleWorkspaceSelect(ws._id)}
              title={ws.name}
            >
              <div className="lnb__workspace-icon" style={{ backgroundColor: ws.color }}>
                {ws.initials || ws.name.substring(0, 1).toUpperCase()}
              </div>
            </div>
          ))}
          <button className="lnb__add-workspace" title="Add workspace" onClick={() => navigate('/workspace')}>
            <IconPlus size={20} />
          </button>
        </div>

        <div className="lnb__divider" />

        {/* 메인 메뉴 아이콘들 */}
        <nav className="lnb__nav">
          {lnbRoutes.map((route) => {
            const isActive = pathname.startsWith(route.path) && (route.path !== '/' || pathname === '/');
            const isChat = route.id === 'chatapp';

            return (
              <button
                key={route.id}
                type="button"
                className={`lnb__item ${isActive ? 'lnb__item--active' : ''}`}
                onClick={() => navigate(route.path)}
                title={route.label}
              >
                <div className="lnb__item-icon">
                  {isChat && totalUnreadCount > 0 ? (
                    <Badge badgeContent={totalUnreadCount} color="error">
                      {route.icon}
                    </Badge>
                  ) : (
                    route.icon
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        <div className="lnb__footer">
          <div
            className={`lnb__workspace-item ${pathname.startsWith('/profile') ? 'lnb__workspace-item--active' : ''}`}
            onClick={() => navigate('/profile')}
            title="Profile"
          >
            <Avatar
              src={user?.profileImage}
              variant="circular"
              size="lg"
              className="lnb__workspace-icon"
              style={{ backgroundColor: 'var(--color-interactive-primary)' }}
            >
              {user?.username?.substring(0, 1).toUpperCase() || <IconUser size={24} />}
            </Avatar>
          </div>
        </div>
      </div>
    </aside>
  );
}
