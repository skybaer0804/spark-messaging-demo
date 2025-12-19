import { JSX } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
import './FloatingActionButton.scss';

export interface FloatingActionButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: 'circular' | 'extended';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'default';
  disabled?: boolean;
  icon?: preact.ComponentChildren;
  label?: preact.ComponentChildren; // used for extended
}

export function FloatingActionButton({
  variant = 'circular',
  size = 'md',
  color = 'primary',
  disabled = false,
  icon,
  label,
  className = '',
  children,
  ...props
}: FloatingActionButtonProps) {
  const { theme, contrast } = useTheme();
  const content = children ?? (
    <>
      {icon && <span className="fab__icon">{icon}</span>}
      {(variant === 'extended' || label) && label && <span className="fab__label">{label}</span>}
    </>
  );

  const classes = ['fab', `fab--${variant}`, `fab--${size}`, `fab--${color}`, className].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled} data-theme={theme} data-contrast={contrast} type="button" {...props}>
      {content}
    </button>
  );
}







