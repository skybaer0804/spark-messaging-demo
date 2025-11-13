import './BottomTab.scss';

interface BottomTabProps {
    currentView: string;
    onTabClick: (view: string) => void;
}

export function BottomTab({ currentView, onTabClick }: BottomTabProps) {
    return (
        <nav className="bottom-tab">
            <button className={`bottom-tab__item ${currentView === 'chat' ? 'bottom-tab__item--active' : ''}`} onClick={() => onTabClick('chat')}>
                <span className="bottom-tab__label">Chat</span>
            </button>
            <button
                className={`bottom-tab__item ${currentView === 'notification' ? 'bottom-tab__item--active' : ''}`}
                onClick={() => onTabClick('notification')}
            >
                <span className="bottom-tab__label">Notification</span>
            </button>
        </nav>
    );
}
