import { IconMessageCircle, IconBell, IconVideo, IconSettings, IconUser } from '@tabler/icons-react';
import { useRouterState } from '@/routes/RouterState';
import './BottomTab.scss';

export function BottomTab() {
  const { pathname, navigate } = useRouterState();

  const tabs = [
    { id: 'chatapp', label: '채팅', path: '/chatapp', icon: <IconMessageCircle size={24} /> },
    { id: 'notification', label: '알림', path: '/notification', icon: <IconBell size={24} /> },
    { id: 'video-meeting', label: '회의', path: '/video-meeting', icon: <IconVideo size={24} /> },
    { id: 'settings', label: '설정', path: '/settings', icon: <IconSettings size={24} /> },
    { id: 'profile', label: '프로필', path: '/profile', icon: <IconUser size={24} /> },
  ];

  return (
    <nav className="bottom-tab">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path);
        return (
          <button
            key={tab.id}
            className={`bottom-tab__item ${isActive ? 'bottom-tab__item--active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <div className="bottom-tab__icon">{tab.icon}</div>
            <span className="bottom-tab__label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
