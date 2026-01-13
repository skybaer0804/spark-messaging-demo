import { JSX } from 'preact';
import { IconRocket } from '@tabler/icons-preact';
import './Loading.scss';

export interface LoadingProps extends JSX.HTMLAttributes<HTMLDivElement> {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export function Loading({ size = 'medium', fullScreen = false, className = '', ...props }: LoadingProps) {
  return (
    <div
      className={`loading ${fullScreen ? 'loading--fullscreen' : ''} loading--${size} ${className}`}
      role="status"
      aria-label="로딩 중"
      {...props}
    >
      <div className="loading__container">
        {/* 우주 먼지/속도감 효과 */}
        <div className="loading__particles">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`loading__particle loading__particle--${i}`} />
          ))}
        </div>

        {/* 로켓 본체 */}
        <div className="loading__rocket-wrapper">
          <div className="loading__rocket">
            <IconRocket size={size === 'small' ? 24 : size === 'large' ? 48 : 36} stroke={1.5} />
          </div>
          
          {/* 로켓 화염/연기 */}
          <div className="loading__exhaust">
            <div className="loading__flame" />
            <div className="loading__smoke" />
          </div>
        </div>

        {/* 텍스트 (선택 사항) */}
        <div className="loading__text">이동 중...</div>
      </div>
    </div>
  );
}
