import { JSX } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
import './Paper.scss';

export interface PaperProps extends JSX.HTMLAttributes<HTMLDivElement> {
  elevation?: number; // 0 to 5
  variant?: 'elevation' | 'outlined';
  square?: boolean;
  padding?: string; // 'sm', 'md', 'lg'
  children: preact.ComponentChildren;
}

export function Paper({
  elevation = 1,
  variant = 'elevation',
  square = false,
  padding = 'md',
  className = '',
  children,
  style,
  ...props
}: PaperProps) {
  const { theme, contrast } = useTheme();

  const classes = [
    'paper',
    `paper--${variant}`,
    variant === 'elevation' ? `paper--elevation-${elevation}` : '',
    square ? 'paper--square' : '',
    padding ? `paper--padding-${padding}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={style} data-theme={theme} data-contrast={contrast} {...props}>
      {children}
    </div>
  );
}
