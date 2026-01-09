import type { JSX } from 'preact';
import {
  IconBell,
  IconGavel,
  IconMessageCircle,
  IconPalette,
  IconHome,
  IconUser,
  IconUsers,
  IconVideo,
  IconSettings,
} from '@tabler/icons-preact';
import { ChatApp } from '@/domains/Chat';
import { NotificationApp } from '@/domains/Notification';
import { VideoMeeting } from '@/domains/VideoMeeting';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { HomePage } from '@/components/HomePage/HomePage';
import { AuthPage } from '@/components/Auth/AuthPage';
import { Profile } from '@/components/Profile/Profile';
import { Workspace } from '@/components/Workspace/Workspace';
import { ThemeCustomization } from '@/components/ThemeCustomization/ThemeCustomization';

export type AppRouteId =
  | 'home'
  | 'chatapp'
  | 'notification'
  | 'video-meeting'
  | 'settings'
  | 'design-system'
  | 'auth'
  | 'profile'
  | 'workspace';

export interface AppRouteNode {
  id: AppRouteId;
  label: string;
  path: string;
  icon: JSX.Element;
  title: string;
  element: JSX.Element;
  secondMenu?: boolean; // true이면 호버시 2차 사이드메뉴 Drawer 열림
  children?: Array<{
    id: string;
    label: string;
    path: string;
    title: string;
  }>;
}

const designSystemComponents = [
  'accordion',
  'alert',
  'avatar',
  'badge',
  'bottom-navigation',
  'breadcrumbs',
  'button',
  'button-group',
  'card',
  'checkbox',
  'circular-progress',
  'collapsible',
  'dialog',
  'divider',
  'drawer',
  'floating-action-button',
  'input',
  'layout',
  'list',
  'pagination',
  'paper',
  'radio',
  'radio-group',
  'select',
  'skeleton',
  'speed-dial',
  'status-chip',
  'stepper',
  'switch',
  'table',
  'tabs',
  'text-field',
  'tooltip',
  'typography',
] as const;

function toTitle(label: string) {
  return label
    .split('-')
    .map((p) => (p.length ? p[0].toUpperCase() + p.slice(1) : p))
    .join(' ');
}

export const appRoutes: AppRouteNode[] = [
  {
    id: 'home',
    label: '홈',
    path: '/',
    icon: <IconHome size={24} />,
    title: 'Home',
    element: <HomePage />,
  },
  {
    id: 'chatapp',
    label: '채팅',
    path: '/chatapp',
    icon: <IconMessageCircle size={24} />,
    title: 'Chat',
    element: <ChatApp />,
  },
  {
    id: 'notification',
    label: '알림',
    path: '/notification',
    icon: <IconBell size={24} />,
    title: 'Notification',
    element: <NotificationApp />,
  },
  {
    id: 'video-meeting',
    label: '회의',
    path: '/video-meeting',
    icon: <IconVideo size={24} />,
    title: 'Video Meeting',
    element: <VideoMeeting />,
  },
  {
    id: 'settings',
    label: '설정',
    path: '/settings',
    icon: <IconSettings size={24} />,
    title: 'Settings',
    element: (
      <div style={{ padding: '20px' }}>
        <ThemeCustomization open={true} onClose={() => {}} />
      </div>
    ),
  },
  {
    id: 'profile',
    label: '프로필',
    path: '/profile',
    icon: <IconUser size={24} />,
    title: 'Profile',
    element: <Profile />,
  },
  {
    id: 'workspace',
    label: '워크스페이스',
    path: '/workspace',
    icon: <IconUsers size={24} />,
    title: 'Workspace',
    element: <Workspace />,
  },
  {
    id: 'design-system',
    label: '디자인',
    path: '/design-system',
    icon: <IconPalette size={24} />,
    title: 'Design System Demo',
    element: <DesignSystemDemo />,
    secondMenu: true,
    children: [
      {
        id: 'overview',
        label: 'Overview',
        path: '/design-system',
        title: 'Design System Demo',
      },
      ...designSystemComponents.map((c) => ({
        id: c,
        label: toTitle(c),
        path: `/design-system/${c}`,
        title: `Design System / ${toTitle(c)}`,
      })),
    ],
  },
];

export function findRouteTitleByPath(pathname: string) {
  const normalized = pathname.split('?')[0].split('#')[0];

  // 개인정보처리방침 페이지
  if (normalized === '/legal/privacy-policy') {
    return '개인정보처리방침';
  }

  // 홈 페이지
  if (normalized === '/') {
    return 'Home';
  }

  for (const r of appRoutes) {
    if (r.path === '/') {
      if (normalized === '/') return r.title;
      continue;
    }
    if (normalized.startsWith(r.path)) return r.title;
    if (r.children) {
      const hit = r.children.find((c) => normalized.startsWith(c.path));
      if (hit) return hit.title;
    }
  }

  return 'Spark Messaging Demo';
}

export function getDesignSystemComponentFromPath(pathname: string) {
  const match = pathname.match(/^\/design-system\/([^/?#]+)$/);
  if (!match) return null;
  return match[1];
}

export const designSystemComponentIds = designSystemComponents;
