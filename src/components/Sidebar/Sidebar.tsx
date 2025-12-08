import { JSX } from 'preact';
import {
    IconMessageCircle,
    IconBell,
    IconGavel,
    IconPalette,
    IconSparkles,
} from '@tabler/icons-react';
import { Flex } from '@/ui-component/Layout/Flex';
import { Typography } from '@/ui-component/Typography/Typography';
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
            label: '디자인 시스템',
            icon: <IconPalette size={20} />,
            view: 'design-system',
        },
    ];

    return (
        <aside className="sidebar">
            <div className="sidebar__container">
                {/* 상단 헤더 */}
                <div className="sidebar__header">
                    <Flex align="center" gap="sm" style={{ flex: 1 }}>
                        <div className="sidebar__logo">
                            <IconSparkles size={24} />
                        </div>
                        <Typography variant="body-large" className="sidebar__header-title">
                            Spark Messaging
                        </Typography>
                    </Flex>
                </div>

                {/* 메인 네비게이션 */}
                <nav className="sidebar__nav">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`sidebar__nav-item ${currentView === item.view ? 'sidebar__nav-item--active' : ''}`}
                            onClick={() => onViewChange(item.view)}
                        >
                            {item.icon}
                            <Typography variant="body-medium">{item.label}</Typography>
                        </button>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
