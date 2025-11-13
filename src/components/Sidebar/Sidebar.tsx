import './Sidebar.scss';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
    return (
        <aside className="sidebar">
            <nav className="sidebar__nav">
                <button className={`sidebar__item ${currentView === 'chat' ? 'sidebar__item--active' : ''}`} onClick={() => onViewChange('chat')}>
                    <span className="sidebar__item-label">Chat</span>
                </button>
                <button
                    className={`sidebar__item ${currentView === 'notification' ? 'sidebar__item--active' : ''}`}
                    onClick={() => onViewChange('notification')}
                >
                    <span className="sidebar__item-label">Notification</span>
                </button>
            </nav>
        </aside>
    );
}
