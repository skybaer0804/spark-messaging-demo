import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import './Breadcrumbs.scss';

export interface BreadcrumbItem {
  label: preact.ComponentChildren;
  href?: string;
  onClick?: (event: Event) => void;
  disabled?: boolean;
}

export interface BreadcrumbsProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'onChange'> {
  items: BreadcrumbItem[];
  separator?: preact.ComponentChildren; // default '/'
  ariaLabel?: string;
  maxItems?: number;
  itemsBeforeCollapse?: number;
  itemsAfterCollapse?: number;
  expandText?: string;
}

type RenderItem = (BreadcrumbItem & { index: number; isLast: boolean }) | { type: 'ellipsis' };

export function Breadcrumbs({
  items,
  separator = '/',
  ariaLabel = 'breadcrumb',
  maxItems,
  itemsBeforeCollapse = 1,
  itemsAfterCollapse = 1,
  expandText = 'Show path',
  className = '',
  ...props
}: BreadcrumbsProps) {
  const { theme, contrast } = useTheme();
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = !!maxItems && items.length > maxItems && !expanded;

  const renderItems: RenderItem[] = useMemo(() => {
    if (!shouldCollapse) {
      return items.map((it, index) => ({ ...it, index, isLast: index === items.length - 1 }));
    }

    const before = Math.max(0, itemsBeforeCollapse);
    const after = Math.max(0, itemsAfterCollapse);

    const start = items.slice(0, before);
    const end = items.slice(Math.max(items.length - after, before), items.length);

    const out: RenderItem[] = [];
    start.forEach((it, index) => out.push({ ...it, index, isLast: false }));
    out.push({ type: 'ellipsis' });
    end.forEach((it, idx) => {
      const index = items.length - end.length + idx;
      out.push({ ...it, index, isLast: index === items.length - 1 });
    });
    return out;
  }, [items, shouldCollapse, itemsBeforeCollapse, itemsAfterCollapse]);

  const classes = ['breadcrumbs', className].filter(Boolean).join(' ');

  return (
    <nav className={classes} data-theme={theme} data-contrast={contrast} aria-label={ariaLabel} {...props}>
      <ol className="breadcrumbs__list">
        {renderItems.map((item, idx) => {
          const isEllipsis = (item as any).type === 'ellipsis';

          if (isEllipsis) {
            return (
              <li key={`ellipsis-${idx}`} className="breadcrumbs__item">
                <button
                  type="button"
                  className="breadcrumbs__collapse"
                  aria-label={expandText}
                  onClick={() => setExpanded(true)}
                >
                  …
                </button>
                {idx < renderItems.length - 1 && <span className="breadcrumbs__separator">{separator}</span>}
              </li>
            );
          }

          const it = item as BreadcrumbItem & { index: number; isLast: boolean };
          const disabled = !!it.disabled;

          const content = it.isLast ? (
            <span className="breadcrumbs__current" aria-current="page">
              {it.label}
            </span>
          ) : it.href ? (
            <a
              className={`breadcrumbs__link ${disabled ? 'breadcrumbs__link--disabled' : ''}`}
              href={disabled ? undefined : it.href}
              onClick={(e) => {
                if (disabled) {
                  e.preventDefault();
                  return;
                }
                it.onClick?.(e as unknown as Event);
              }}
            >
              {it.label}
            </a>
          ) : (
            <button
              type="button"
              className={`breadcrumbs__link breadcrumbs__link--button ${disabled ? 'breadcrumbs__link--disabled' : ''}`}
              disabled={disabled}
              onClick={(e) => {
                if (disabled) return;
                it.onClick?.(e);
              }}
            >
              {it.label}
            </button>
          );

          return (
            <li key={`item-${it.index}`} className="breadcrumbs__item">
              {content}
              {!it.isLast && <span className="breadcrumbs__separator">{separator}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}







