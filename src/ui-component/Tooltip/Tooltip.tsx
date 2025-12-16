import { JSX, cloneElement } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import './Tooltip.scss';

export interface TooltipProps extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, 'title'> {
  title: preact.ComponentChildren;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  open?: boolean;
  defaultOpen?: boolean;
  onOpen?: (event: Event) => void;
  onClose?: (event: Event) => void;
  enterDelay?: number;
  leaveDelay?: number;
  disableHoverListener?: boolean;
  disableFocusListener?: boolean;
  disabled?: boolean;
  children: JSX.Element;
}

export function Tooltip({
  title,
  placement = 'top',
  open,
  defaultOpen = false,
  onOpen,
  onClose,
  enterDelay = 0,
  leaveDelay = 100,
  disableHoverListener = false,
  disableFocusListener = false,
  disabled = false,
  className = '',
  children,
  ...props
}: TooltipProps) {
  const { theme, contrast } = useTheme();
  const idPrefix = useMemo(() => `tooltip-${Math.random().toString(36).slice(2, 9)}`, []);
  const tooltipId = `${idPrefix}-content`;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isOpen = open !== undefined ? open : uncontrolledOpen;

  const enterTimer = useRef<number | undefined>(undefined);
  const leaveTimer = useRef<number | undefined>(undefined);

  const clearTimers = () => {
    if (enterTimer.current) window.clearTimeout(enterTimer.current);
    if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    enterTimer.current = undefined;
    leaveTimer.current = undefined;
  };

  useEffect(() => () => clearTimers(), []);

  const setOpen = (next: boolean, event: Event) => {
    if (disabled) return;
    if (open === undefined) setUncontrolledOpen(next);
    if (next) onOpen?.(event);
    else onClose?.(event);
  };

  const scheduleOpen = (event: Event) => {
    clearTimers();
    enterTimer.current = window.setTimeout(() => setOpen(true, event), Math.max(0, enterDelay));
  };

  const scheduleClose = (event: Event) => {
    clearTimers();
    leaveTimer.current = window.setTimeout(() => setOpen(false, event), Math.max(0, leaveDelay));
  };

  const trigger = cloneElement(children, {
    ...(children.props || {}),
    'aria-describedby': isOpen ? tooltipId : undefined,
    onMouseEnter: (e: MouseEvent) => {
      children.props?.onMouseEnter?.(e);
      if (disabled || disableHoverListener) return;
      scheduleOpen(e as unknown as Event);
    },
    onMouseLeave: (e: MouseEvent) => {
      children.props?.onMouseLeave?.(e);
      if (disabled || disableHoverListener) return;
      scheduleClose(e as unknown as Event);
    },
    onFocus: (e: FocusEvent) => {
      children.props?.onFocus?.(e);
      if (disabled || disableFocusListener) return;
      scheduleOpen(e as unknown as Event);
    },
    onBlur: (e: FocusEvent) => {
      children.props?.onBlur?.(e);
      if (disabled || disableFocusListener) return;
      scheduleClose(e as unknown as Event);
    },
  });

  const classes = ['tooltip', `tooltip--${placement}`, isOpen ? 'tooltip--open' : '', className].filter(Boolean).join(' ');

  return (
    <span className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {trigger}
      <span id={tooltipId} className="tooltip__content" role="tooltip" aria-hidden={!isOpen}>
        {title}
      </span>
    </span>
  );
}



