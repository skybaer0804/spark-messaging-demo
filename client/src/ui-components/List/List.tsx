import { JSX } from 'preact';
import './List.scss';

// Top-level List
export interface ListProps extends JSX.HTMLAttributes<HTMLUListElement> {
  disablePadding?: boolean;
}

export function List({ disablePadding = false, className = '', children, ...props }: ListProps) {
  const classes = ['list', disablePadding ? 'list--padding-off' : '', className].filter(Boolean).join(' ');
  return (
    <ul className={classes} {...props}>
      {children}
    </ul>
  );
}

// ListItem
export interface ListItemProps extends JSX.HTMLAttributes<HTMLLIElement> {
  disableGutters?: boolean;
  divider?: boolean;
  alignItems?: 'center' | 'flex-start';
}

export function ListItem({
  disableGutters = false,
  divider = false,
  alignItems = 'center',
  className = '',
  children,
  ...props
}: ListItemProps) {
  const classes = [
    'list-item',
    disableGutters ? 'list-item--gutters-off' : '',
    divider ? 'list-item--divider' : '',
    `list-item--align-${alignItems}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li className={classes} {...props}>
      {children}
    </li>
  );
}

// ListItemText
export interface ListItemTextProps extends JSX.HTMLAttributes<HTMLDivElement> {
  primary?: preact.ComponentChildren;
  secondary?: preact.ComponentChildren;
}

export function ListItemText({ primary, secondary, className = '', ...props }: ListItemTextProps) {
  return (
    <div className={`list-item-text ${className}`} {...props}>
      {primary && <span className="list-item-text__primary">{primary}</span>}
      {secondary && <p className="list-item-text__secondary">{secondary}</p>}
    </div>
  );
}

// ListItemAvatar
export function ListItemAvatar({ className = '', children, ...props }: JSX.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`list-item-avatar ${className}`} {...props}>
      {children}
    </div>
  );
}
