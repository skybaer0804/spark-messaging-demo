import { JSX } from 'preact';
import { useTokens } from '../../context/TokenProvider';
import './Badge.scss';

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  badgeContent?: preact.ComponentChildren;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  variant?: 'standard' | 'dot';
  invisible?: boolean;
  children: preact.ComponentChildren;
}

export function Badge({
  badgeContent,
  color = 'primary',
  variant = 'standard',
  invisible = false,
  className = '',
  children,
  ...props
}: BadgeProps) {
  const { theme } = useTokens();

  if (invisible) return <>{children}</>;

  const classes = ['badge-root', className].filter(Boolean).join(' ');

  const badgeClasses = [
    'badge',
    `badge--${color}`,
    `badge--${variant}`,
    variant === 'dot' || badgeContent === undefined || badgeContent === null ? 'badge--dot' : 'badge--standard',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} {...props}>
      {children}
      {!invisible && (
        <span className={badgeClasses} data-theme={theme}>
          {variant !== 'dot' && badgeContent}
        </span>
      )}
    </span>
  );
}
