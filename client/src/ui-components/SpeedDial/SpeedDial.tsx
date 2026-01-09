import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import './SpeedDial.scss';

export interface SpeedDialAction {
  name: string;
  icon: preact.ComponentChildren;
  onClick?: (event: Event) => void;
  disabled?: boolean;
}

export interface SpeedDialProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  ariaLabel: string;
  actions: SpeedDialAction[];
  icon?: preact.ComponentChildren;
  openIcon?: preact.ComponentChildren;
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  direction?: 'up' | 'down' | 'left' | 'right';
  anchor?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  closeOnSelect?: boolean;
  openOnHover?: boolean;
  tooltipPlacement?: 'left' | 'right' | 'top' | 'bottom';
  showBackdrop?: boolean;
}

export function SpeedDial({
  ariaLabel,
  actions,
  icon,
  openIcon,
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  direction = 'up',
  anchor = 'bottom-right',
  closeOnSelect = true,
  openOnHover = false,
  tooltipPlacement,
  showBackdrop = false,
  className = '',
  ...props
}: SpeedDialProps) {
  const { theme, contrast } = useTheme();
  const idPrefix = useMemo(() => `speed-dial-${Math.random().toString(36).slice(2, 9)}`, []);

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const setOpen = (next: boolean, event: Event) => {
    if (open === undefined) setUncontrolledOpen(next);
    if (next) onOpen?.(event);
    else onClose?.(event);
  };

  const computedTooltipPlacement =
    tooltipPlacement ?? (direction === 'left' ? 'right' : direction === 'right' ? 'left' : 'left');

  const classes = [
    'speed-dial',
    `speed-dial--${direction}`,
    `speed-dial--${anchor}`,
    isOpen ? 'speed-dial--open' : '',
    showBackdrop ? 'speed-dial--backdrop' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      data-theme={theme}
      data-contrast={contrast}
      onKeyDown={(e) => {
        if ((e as unknown as KeyboardEvent).key === 'Escape') {
          setOpen(false, e as unknown as Event);
        }
      }}
      onMouseEnter={(e) => {
        if (!openOnHover) return;
        setOpen(true, e);
      }}
      onMouseLeave={(e) => {
        if (!openOnHover) return;
        setOpen(false, e);
      }}
      {...props}
    >
      {showBackdrop && (
        <button
          type="button"
          className="speed-dial__backdrop"
          aria-hidden={!isOpen}
          tabIndex={-1}
          onClick={(e) => setOpen(false, e)}
        />
      )}

      <div className="speed-dial__actions" aria-hidden={!isOpen}>
        {actions.map((action, idx) => {
          const isDisabled = !!action.disabled;
          const actionId = `${idPrefix}-action-${idx}`;
          return (
            <button
              key={actionId}
              type="button"
              className={`speed-dial__action ${isDisabled ? 'speed-dial__action--disabled' : ''}`}
              disabled={isDisabled}
              tabIndex={isOpen ? 0 : -1}
              aria-label={action.name}
              onClick={(e) => {
                action.onClick?.(e);
                if (closeOnSelect) setOpen(false, e);
              }}
            >
              <span className={`speed-dial__tooltip speed-dial__tooltip--${computedTooltipPlacement}`}>
                {action.name}
              </span>
              <span className="speed-dial__action-icon" aria-hidden="true">
                {action.icon}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="speed-dial__fab"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={(e) => setOpen(!isOpen, e)}
      >
        <span className="speed-dial__fab-icon" aria-hidden="true">
          {isOpen ? openIcon ?? icon : icon}
        </span>
      </button>
    </div>
  );
}
