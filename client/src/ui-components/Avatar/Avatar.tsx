import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import './Avatar.scss';

export interface AvatarProps extends JSX.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  variant?: 'circular' | 'rounded' | 'square';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: preact.ComponentChildren;
}

export function Avatar({
  src,
  alt,
  variant = 'circular',
  size = 'md',
  className = '',
  children,
  style,
  ...props
}: AvatarProps) {
  const { theme, contrast } = useTheme();

  const classes = ['avatar', `avatar--${variant}`, `avatar--${size}`, className].filter(Boolean).join(' ');

  // size에 따른 기본 크기 (px) - SCSS와 일치
  const sizeMap: Record<string, number> = {
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56,
  };

  const avatarSize = sizeMap[size] || 40;

  return (
    <div className={classes} style={style} data-theme={theme} data-contrast={contrast} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="avatar__img"
          loading="lazy"
          width={avatarSize}
          height={avatarSize}
          style={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
        />
      ) : (
        children
      )}
    </div>
  );
}
