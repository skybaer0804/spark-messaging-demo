import './Header.scss';
import { useTokens } from '../../context/TokenProvider';

interface HeaderProps {
  title: string;
  isConnected: boolean;
  socketId: string | null;
}

export function Header({ title, isConnected, socketId }: HeaderProps) {
  const { theme, toggleTheme, contrast, toggleContrast } = useTokens();

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{title}</h1>
      </div>

      <div className="header__right">
        <div className="header__status">
          <div className={`header__status-indicator ${isConnected ? 'header__status-indicator--connected' : ''}`} />
          <span className="header__status-text">
            {isConnected ? `Connected (${socketId?.substring(0, 8)}...)` : 'Disconnected'}
          </span>
        </div>

        <div className="header__controls">
          <button
            className="header__icon-button"
            onClick={toggleTheme}
            title={theme === 'light' ? '다크 모드로 전환' : '라이트 모드로 전환'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            className="header__icon-button"
            onClick={toggleContrast}
            title={contrast === 'standard' ? '고대비 모드 켜기' : '고대비 모드 끄기'}
          >
            {contrast === 'standard' ? '👁️' : '👓'}
          </button>
        </div>
      </div>
    </header>
  );
}
