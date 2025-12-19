import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import './BottomNavigation.scss';

export type BottomNavigationValue = string | number;

export interface BottomNavigationItem {
  value: BottomNavigationValue;
  label: preact.ComponentChildren;
  icon?: preact.ComponentChildren;
  disabled?: boolean;
}

export interface BottomNavigationProps extends Omit<JSX.HTMLAttributes<HTMLElement>, 'onChange'> {
  items: BottomNavigationItem[];
  value?: BottomNavigationValue;
  defaultValue?: BottomNavigationValue;
  onChange?: (value: BottomNavigationValue, event: Event) => void;
  showLabels?: boolean;
  position?: 'fixed' | 'static';
  ariaLabel?: string;
}

export function BottomNavigation({
  items,
  value,
  defaultValue,
  onChange,
  showLabels = true,
  position = 'static',
  ariaLabel = 'bottom navigation',
  className = '',
  ...props
}: BottomNavigationProps) {
  const { theme, contrast } = useTheme();
  const idPrefix = useMemo(() => `bottom-nav-${Math.random().toString(36).slice(2, 9)}`, []);

  const getFirstEnabledValue = () => {
    const first = items.find((i) => !i.disabled);
    return first?.value ?? items[0]?.value;
  };

  const [uncontrolledValue, setUncontrolledValue] = useState<BottomNavigationValue | undefined>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return getFirstEnabledValue();
  });

  const selectedValue = value !== undefined ? value : uncontrolledValue;

  const setSelected = (next: BottomNavigationValue, event: Event) => {
    if (value === undefined) setUncontrolledValue(next);
    onChange?.(next, event);
  };

  const classes = [
    'bottom-navigation',
    position === 'fixed' ? 'bottom-navigation--fixed' : '',
    showLabels ? 'bottom-navigation--show-labels' : 'bottom-navigation--hide-labels',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <nav className={classes} data-theme={theme} data-contrast={contrast} aria-label={ariaLabel} {...props}>
      <div className="bottom-navigation__list" role="tablist" aria-label={ariaLabel}>
        {items.map((item, idx) => {
          const isSelected = item.value === selectedValue;
          const isDisabled = !!item.disabled;
          const tabId = `${idPrefix}-tab-${idx}`;

          return (
            <button
              key={String(item.value)}
              id={tabId}
              type="button"
              className={[
                'bottom-navigation__item',
                isSelected ? 'bottom-navigation__item--active' : '',
                isDisabled ? 'bottom-navigation__item--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={isDisabled}
              onClick={(e) => {
                if (isDisabled) return;
                setSelected(item.value, e);
              }}
            >
              {item.icon && <span className="bottom-navigation__icon">{item.icon}</span>}
              <span className="bottom-navigation__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}







