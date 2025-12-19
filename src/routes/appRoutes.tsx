import type { JSX } from 'preact';
import { IconBell, IconGavel, IconMessageCircle, IconPalette } from '@tabler/icons-react';
import { ChatApp } from '@/components/ChatApp/ChatApp';
import { NotificationApp } from '@/components/NotificationApp/NotificationApp';
import { ReverseAuction } from '@/components/ReverseAuction/ReverseAuction';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';

export type AppRouteId = 'chatapp' | 'notification' | 'reverse-auction' | 'design-system';

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
    id: 'reverse-auction',
    label: '역경매',
    path: '/reverse-auction',
    icon: <IconGavel size={20} />,
    title: 'Reverse Auction',
    element: <ReverseAuction />,
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
