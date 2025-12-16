import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { IconChevronDown } from '@tabler/icons-react';
import { useTheme } from '../../context/ThemeProvider';
import './Accordion.scss';

export type AccordionValue = string | number;

export interface AccordionItem {
  value: AccordionValue;
  summary: preact.ComponentChildren;
  details: preact.ComponentChildren;
  disabled?: boolean;
}

export interface AccordionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: AccordionItem[];
  expanded?: AccordionValue | AccordionValue[] | null;
  defaultExpanded?: AccordionValue | AccordionValue[] | null;
  onChange?: (expanded: AccordionValue | AccordionValue[] | null, event: Event) => void;
  allowMultiple?: boolean;
  ariaLabel?: string;
  disableGutters?: boolean;
}

const normalizeExpanded = (expanded: AccordionProps['expanded'], allowMultiple: boolean): AccordionValue[] => {
  if (expanded == null) return [];
  if (Array.isArray(expanded)) return allowMultiple ? expanded : expanded.slice(0, 1);
  return [expanded];
};

export function Accordion({
  items,
  expanded,
  defaultExpanded = null,
  onChange,
  allowMultiple = false,
  ariaLabel = 'accordion',
  disableGutters = false,
  className = '',
  ...props
}: AccordionProps) {
  const { theme, contrast } = useTheme();
  const idPrefix = useMemo(() => `accordion-${Math.random().toString(36).slice(2, 9)}`, []);

  const [uncontrolledExpanded, setUncontrolledExpanded] = useState<AccordionValue[]>(
    normalizeExpanded(defaultExpanded, allowMultiple),
  );

  const currentExpanded = expanded !== undefined ? normalizeExpanded(expanded, allowMultiple) : uncontrolledExpanded;

  const setExpanded = (next: AccordionValue[] | null, event: Event) => {
    const normalized = next ?? [];
    if (expanded === undefined) setUncontrolledExpanded(normalized);
    onChange?.(allowMultiple ? normalized : normalized[0] ?? null, event);
  };

  const toggle = (value: AccordionValue, event: Event) => {
    const isOpen = currentExpanded.includes(value);
    if (allowMultiple) {
      const next = isOpen ? currentExpanded.filter((v) => v !== value) : [...currentExpanded, value];
      setExpanded(next, event);
      return;
    }
    setExpanded(isOpen ? [] : [value], event);
  };

  const classes = [
    'accordion',
    disableGutters ? 'accordion--no-gutters' : '',
    allowMultiple ? 'accordion--multiple' : 'accordion--single',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} aria-label={ariaLabel} {...props}>
      {items.map((item, index) => {
        const isOpen = currentExpanded.includes(item.value);
        const isDisabled = !!item.disabled;
        const summaryId = `${idPrefix}-summary-${index}`;
        const detailsId = `${idPrefix}-details-${index}`;

        return (
          <div
            key={String(item.value)}
            className={[
              'accordion__item',
              isOpen ? 'accordion__item--expanded' : '',
              isDisabled ? 'accordion__item--disabled' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className="accordion__summary"
              id={summaryId}
              aria-expanded={isOpen}
              aria-controls={detailsId}
              disabled={isDisabled}
              onClick={(e) => {
                if (isDisabled) return;
                toggle(item.value, e);
              }}
            >
              <span className="accordion__summary-text">{item.summary}</span>
              <span className="accordion__icon" aria-hidden="true">
                <IconChevronDown size={18} />
              </span>
            </button>

            <div
              id={detailsId}
              className="accordion__details"
              role="region"
              aria-labelledby={summaryId}
              hidden={!isOpen}
            >
              {item.details}
            </div>
          </div>
        );
      })}
    </div>
  );
}



