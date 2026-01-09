import type { JSX } from 'preact';
import {
  IconBell,
  IconGavel,
  IconMessageCircle,
  IconPalette,
  IconHome,
  IconUser,
  IconUsers,
} from '@tabler/icons-react';
import { ChatApp } from '@/components/ChatApp/ChatApp';
import { NotificationApp } from '@/components/NotificationApp/NotificationApp';
import { VideoMeeting } from '@/components/VideoMeeting/VideoMeeting';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { HomePage } from '@/components/HomePage/HomePage';
import { AuthPage } from '@/components/Auth/AuthPage';
import { Profile } from '@/components/Profile/Profile';
import { Organization } from '@/components/Organization/Organization';

export type AppRouteId =
  | 'home'
  | 'chatapp'
  | 'notification'
  | 'reverse-auction'
  | 'design-system'
  | 'auth'
  | 'profile'
  | 'organization';

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
    icon: <IconHome size={20} />,
    title: 'Home',
    element: <HomePage />,
  },
  {
    id: 'chatapp',
    label: '채팅',
    path: '/chatapp',
    icon: <IconMessageCircle size={20} />,
    title: 'Chat',
    element: <ChatApp />,
  },
  {
    id: 'notification',
    label: '알림',
    path: '/notification',
    icon: <IconBell size={20} />,
    title: 'Notification',
    element: <NotificationApp />,
  },
  {
    id: 'profile',
    label: '프로필',
    path: '/profile',
    icon: <IconUser size={20} />,
    title: 'Profile',
    element: <Profile />,
  },
  {
    id: 'organization',
    label: '조직',
    path: '/organization',
    icon: <IconUsers size={20} />,
    title: 'Organization',
    element: <Organization />,
  },
  {
    id: 'reverse-auction',
    label: '역경매',
    path: '/reverse-auction',
    icon: <IconGavel size={20} />,
    title: 'Reverse Auction',
    element: <VideoMeeting />,
  },
  {
    id: 'design-system',
    label: '디자인',
    path: '/design-system',
    icon: <IconPalette size={20} />,
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
    if (normalized === r.path) return r.title;
    if (r.children) {
      const hit = r.children.find((c) => normalized === c.path);
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
