import { JSX } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
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

  return (
    <div className={classes} style={style} data-theme={theme} data-contrast={contrast} {...props}>
      {src ? <img src={src} alt={alt} className="avatar__img" /> : children}
    </div>
  );
}
