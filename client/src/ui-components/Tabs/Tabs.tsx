import { JSX } from 'preact';
import { useMemo, useRef, useState } from 'preact/hooks';
import { useTheme } from '@/core/context/ThemeProvider';
import './Tabs.scss';

export type TabsValue = string | number;

export interface TabsItem {
  value: TabsValue;
  label: preact.ComponentChildren;
  content: preact.ComponentChildren;
  disabled?: boolean;
}

export interface TabsProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  items: TabsItem[];
  value?: TabsValue;
  defaultValue?: TabsValue;
  onChange?: (value: TabsValue, event: Event) => void;
  ariaLabel?: string;
  orientation?: 'horizontal' | 'vertical';
  variant?: 'standard' | 'scrollable' | 'fullWidth';
  selectionFollowsFocus?: boolean;
  keepMounted?: boolean;
}

const toDomIdPart = (value: TabsValue) =>
  String(value)
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, '-');

export function Tabs({
  items,
  value,
  defaultValue,
  onChange,
  ariaLabel = 'tabs',
  orientation = 'horizontal',
  variant = 'standard',
  selectionFollowsFocus = false,
  keepMounted = false,
  className = '',
  ...props
}: TabsProps) {
  const { theme, contrast } = useTheme();

  const idPrefix = useMemo(() => `tabs-${Math.random().toString(36).slice(2, 9)}`, []);

  const getFirstEnabledValue = () => {
    const firstEnabled = items.find((t) => !t.disabled);
    return firstEnabled?.value ?? items[0]?.value;
  };

  const [uncontrolledValue, setUncontrolledValue] = useState<TabsValue | undefined>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return getFirstEnabledValue();
  });

  const selectedValue = value !== undefined ? value : uncontrolledValue;

  const tabButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const setSelected = (nextValue: TabsValue, event: Event) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue, event);
  };

  const focusTabIndex = (idx: number) => {
    const el = tabButtonRefs.current[idx];
    el?.focus();
  };

  const findNextEnabledIndex = (from: number, delta: 1 | -1) => {
    if (!items.length) return from;
    let idx = from;
    for (let i = 0; i < items.length; i += 1) {
      idx = (idx + delta + items.length) % items.length;
      if (!items[idx]?.disabled) return idx;
    }
    return from;
  };

  const handleKeyDown = (event: KeyboardEvent, currentIdx: number) => {
    const isHorizontal = orientation === 'horizontal';
    const prevKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp';
    const nextKey = isHorizontal ? 'ArrowRight' : 'ArrowDown';

    let nextIdx: number | null = null;

    if (event.key === prevKey) nextIdx = findNextEnabledIndex(currentIdx, -1);
    if (event.key === nextKey) nextIdx = findNextEnabledIndex(currentIdx, 1);
    if (event.key === 'Home') nextIdx = findNextEnabledIndex(-1, 1);
    if (event.key === 'End') nextIdx = findNextEnabledIndex(0, -1);

    if (nextIdx === null) return;

    event.preventDefault();
    focusTabIndex(nextIdx);

    if (selectionFollowsFocus) {
      const nextValue = items[nextIdx]?.value;
      if (nextValue !== undefined) setSelected(nextValue, event as unknown as Event);
    }
  };

  const classes = ['tabs', `tabs--${orientation}`, `tabs--${variant}`, className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      <div className="tabs__list" role="tablist" aria-label={ariaLabel} aria-orientation={orientation}>
        {items.map((item, idx) => {
          const isSelected = item.value === selectedValue;
          const tabId = `${idPrefix}-tab-${toDomIdPart(item.value)}`;
          const panelId = `${idPrefix}-panel-${toDomIdPart(item.value)}`;

          return (
            <button
              key={String(item.value)}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              disabled={item.disabled}
              className={[
                'tabs__tab',
                isSelected ? 'tabs__tab--active' : '',
                item.disabled ? 'tabs__tab--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              ref={(el) => {
                tabButtonRefs.current[idx] = el;
              }}
              onClick={(e) => {
                if (item.disabled) return;
                setSelected(item.value, e);
              }}
              onKeyDown={(e) => handleKeyDown(e as unknown as KeyboardEvent, idx)}
            >
              <span className="tabs__tab-label">{item.label}</span>
              <span className="tabs__indicator" aria-hidden="true" />
            </button>
          );
        })}
      </div>

      <div className="tabs__panels">
        {items.map((item) => {
          const isSelected = item.value === selectedValue;
          const tabId = `${idPrefix}-tab-${toDomIdPart(item.value)}`;
          const panelId = `${idPrefix}-panel-${toDomIdPart(item.value)}`;

          if (!keepMounted && !isSelected) return null;

          return (
            <div
              key={String(item.value)}
              role="tabpanel"
              id={panelId}
              aria-labelledby={tabId}
              className={['tabs__panel', isSelected ? 'tabs__panel--active' : ''].filter(Boolean).join(' ')}
              hidden={!isSelected}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
