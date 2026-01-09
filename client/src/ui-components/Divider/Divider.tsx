import { JSX } from 'preact';
import './Divider.scss';

export interface DividerProps extends JSX.HTMLAttributes<HTMLHRElement> {
  variant?: 'fullWidth' | 'inset' | 'middle';
  orientation?: 'horizontal' | 'vertical';
  flexItem?: boolean;
}

export function Divider({
  variant = 'fullWidth',
  orientation = 'horizontal',
  flexItem = false,
  className = '',
  ...props
}: DividerProps) {
  const classes = [
    'divider',
    `divider--${variant}`,
    `divider--${orientation}`,
    flexItem ? 'divider--flexItem' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <hr className={classes} {...props} />;
}
