import { JSX } from 'preact';
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
        {/* 4꼭지점 별 - 회전하지 않음 */}
        <div className="loading__star">
          <svg className="loading__star-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            {/* 4꼭지점 별: 상, 하, 좌, 우 */}
            <path className="loading__star-path" d="M50,10 L60,50 L50,60 L40,50 Z" fill="currentColor" />
            <path className="loading__star-path" d="M50,40 L50,50 L40,50 L50,50 L60,50 L50,40 Z" fill="currentColor" />
          </svg>
        </div>

        {/* 별에서 나오는 웨이브 선들 (여러 평행선) */}
        <div className="loading__waves">
          <svg className="loading__wave-svg" viewBox="0 0 200 200" preserveAspectRatio="none">
            {/* 왼쪽 웨이브 - 여러 평행선 (아래로 휘어짐) */}
            {[...Array(7)].map((_, i) => {
              const offset = i * 10;
              const curveY = 30 + i * 8;
              const endX = i * 4;
              const endY = 50 + i * 12;
              return (
                <path
                  key={`left-${i}`}
                  className={`loading__wave-path loading__wave-path--left loading__wave-path--${i}`}
                  d={`M100,100 Q${50 - offset},${100 - curveY} ${endX},${100 + endY} Q${50 - offset},${
                    100 + curveY
                  } 100,100`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5 - i * 0.25}
                  opacity={1 - i * 0.12}
                />
              );
            })}
            {/* 오른쪽 웨이브 - 여러 평행선 (위로 휘어짐) */}
            {[...Array(7)].map((_, i) => {
              const offset = i * 10;
              const curveY = 30 + i * 8;
              const endX = 200 - i * 4;
              const endY = 50 + i * 12;
              return (
                <path
                  key={`right-${i}`}
                  className={`loading__wave-path loading__wave-path--right loading__wave-path--${i}`}
                  d={`M100,100 Q${150 + offset},${100 - curveY} ${endX},${100 - endY} Q${150 + offset},${
                    100 - curveY
                  } 100,100`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5 - i * 0.25}
                  opacity={1 - i * 0.12}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
