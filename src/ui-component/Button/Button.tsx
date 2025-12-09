import { JSX } from 'preact';
import { useTokens } from '../../context/TokenProvider';
import './Button.scss';

export interface ButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
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
  const { theme, contrast } = useTokens();

  const classes = ['button', variant, size, fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  return (
    <button className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {children}
    </button>
  );
}
