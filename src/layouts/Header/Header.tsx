import './Header.scss';

interface HeaderProps {
    title: string;
    isConnected: boolean;
    socketId: string | null;
}

export function Header({ title, isConnected, socketId }: HeaderProps) {
    return (
        <header className="header">
            <h1 className="header__title">{title}</h1>
            <div className="header__status">
                <div className={`header__status-indicator ${isConnected ? 'header__status-indicator--connected' : ''}`} />
                <span className="header__status-text">{isConnected ? `Connected (${socketId?.substring(0, 8)}...)` : 'Disconnected'}</span>
            </div>
        </header>
    );
}
