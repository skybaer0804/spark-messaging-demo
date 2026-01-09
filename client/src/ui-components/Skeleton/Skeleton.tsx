import { JSX } from 'preact';
import './Skeleton.scss';

export interface SkeletonProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: 'text' | 'rectangular' | 'circular' | 'rounded';
  width?: number | string;
  height?: number | string;
  animation?: 'pulse' | 'wave' | false;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const mergedStyle = {
    width,
    height,
    ...(style && typeof style === 'object' && !('value' in style) ? style : {}),
  } as JSX.CSSProperties;

  return (
    <span
      className={`skeleton skeleton--${variant} ${animation ? `skeleton--${animation}` : ''} ${className}`}
      style={mergedStyle}
      {...props}
    />
  );
}
