import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import './IconButton.scss';

export interface IconButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  color?: 'primary' | 'secondary' | 'error' | 'default';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: preact.ComponentChildren;
}

export function IconButton({
  color = 'default',
  size = 'medium',
  disabled = false,
  className = '',
  children,
  ...props
}: IconButtonProps) {
  const { theme } = useTheme();

  const classes = ['icon-button', `icon-button--${color}`, `icon-button--${size}`, className].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} data-theme={theme} type="button" {...props}>
      <span className="icon-button__label">{children}</span>
    </button>
  );
}
