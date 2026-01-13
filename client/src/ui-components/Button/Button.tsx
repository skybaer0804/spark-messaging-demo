import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import './Button.scss';

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'lg' | 'md' | 'sm';
  fullWidth?: boolean;
  disabled?: boolean;
  children: preact.ComponentChildren;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const { theme, contrast } = useTheme();

  const classes = ['button', variant, size, fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  return (
    <button className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {children}
    </button>
  );
}
