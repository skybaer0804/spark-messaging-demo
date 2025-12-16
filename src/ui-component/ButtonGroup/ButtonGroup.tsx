import { JSX, toChildArray } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
import './ButtonGroup.scss';

export interface ButtonGroupProps extends JSX.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  fullWidth?: boolean;
  attached?: boolean; // if true, buttons touch and share borders
  children: preact.ComponentChildren;
}

export function ButtonGroup({
  orientation = 'horizontal',
  fullWidth = false,
  attached = true,
  className = '',
  children,
  ...props
}: ButtonGroupProps) {
  const { theme, contrast } = useTheme();

  const classes = [
    'button-group',
    `button-group--${orientation}`,
    fullWidth ? 'button-group--full-width' : '',
    attached ? 'button-group--attached' : 'button-group--spaced',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const items = toChildArray(children);

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} role="group" {...props}>
      {items.map((child, idx) => (
        <span key={idx} className="button-group__item">
          {child}
        </span>
      ))}
    </div>
  );
}



