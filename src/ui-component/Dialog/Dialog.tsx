import { JSX } from 'preact';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import { IconX } from '@tabler/icons-react';
import { useTheme } from '../../context/ThemeProvider';
import { IconButton } from '../Button/IconButton';
import './Dialog.scss';

export interface DialogProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'title'> {
  open: boolean;
  onClose: (event?: Event) => void;
  title?: preact.ComponentChildren;
  children: preact.ComponentChildren;
  actions?: preact.ComponentChildren;
  maxWidth?: 'sm' | 'md' | 'lg' | false;
  fullWidth?: boolean;
  disableEscapeKeyDown?: boolean;
  disableBackdropClick?: boolean;
  hideCloseButton?: boolean;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
}

const getFocusableElements = (root: HTMLElement) => {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => !el.hasAttribute('disabled'));
};

export function Dialog({
  open,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'sm',
  fullWidth = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  hideCloseButton = false,
  ariaLabelledby,
  ariaDescribedby,
  className = '',
  ...props
}: DialogProps) {
  const { theme, contrast } = useTheme();
  const idPrefix = useMemo(() => `dialog-${Math.random().toString(36).slice(2, 9)}`, []);
  const titleId = ariaLabelledby ?? (title ? `${idPrefix}-title` : undefined);
  const contentId = ariaDescribedby ?? `${idPrefix}-content`;

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    lastFocused.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Focus dialog or first focusable
    const node = dialogRef.current;
    if (node) {
      const focusables = getFocusableElements(node);
      (focusables[0] ?? node).focus();
    }

    return () => {
      document.body.style.overflow = '';
      lastFocused.current?.focus?.();
      lastFocused.current = null;
    };
  }, [open]);

  if (!open) return null;

  const classes = [
    'dialog',
    maxWidth ? `dialog--max-${maxWidth}` : 'dialog--max-false',
    fullWidth ? 'dialog--full-width' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !disableEscapeKeyDown) {
      e.preventDefault();
      onClose(e as unknown as Event);
      return;
    }

    if (e.key !== 'Tab') return;

    const node = dialogRef.current;
    if (!node) return;

    const focusables = getFocusableElements(node);
    if (focusables.length === 0) {
      e.preventDefault();
      node.focus();
      return;
    }

    const currentIndex = focusables.indexOf(document.activeElement as HTMLElement);
    const lastIndex = focusables.length - 1;

    if (e.shiftKey) {
      if (currentIndex <= 0) {
        e.preventDefault();
        focusables[lastIndex]?.focus();
      }
    } else {
      if (currentIndex === lastIndex) {
        e.preventDefault();
        focusables[0]?.focus();
      }
    }
  };

  return (
    <div className="dialog-root" data-theme={theme} data-contrast={contrast}>
      <div
        className="dialog-root__backdrop"
        onClick={(e) => {
          if (disableBackdropClick) return;
          onClose(e);
        }}
      />

      <div
        className={classes}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={contentId}
        tabIndex={-1}
        ref={dialogRef}
        onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent)}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {(title || !hideCloseButton) && (
          <div className="dialog__header">
            {title && (
              <div className="dialog__title" id={titleId}>
                {title}
              </div>
            )}
            {!hideCloseButton && (
              <IconButton size="small" color="default" onClick={(e) => onClose(e)} title="닫기">
                <IconX size={20} />
              </IconButton>
            )}
          </div>
        )}

        <div className="dialog__content" id={contentId}>
          {children}
        </div>

        {actions && <div className="dialog__actions">{actions}</div>}
      </div>
    </div>
  );
}







