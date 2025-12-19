import { JSX } from 'preact';
import { useMemo, useState } from 'preact/hooks';
import { useTheme } from '../../context/ThemeProvider';
import { Radio } from '../Radio/Radio';
import './RadioGroup.scss';

export type RadioGroupValue = string | number;

export interface RadioGroupOption {
  value: RadioGroupValue;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: string;
  helperText?: string;
  name?: string;
  options: RadioGroupOption[];
  value?: RadioGroupValue;
  defaultValue?: RadioGroupValue;
  onChange?: (value: RadioGroupValue, event: Event) => void;
  direction?: 'row' | 'column';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export function RadioGroup({
  label,
  helperText,
  name,
  options,
  value,
  defaultValue,
  onChange,
  direction = 'column',
  color = 'primary',
  size = 'medium',
  disabled = false,
  className = '',
  ...props
}: RadioGroupProps) {
  const { theme, contrast } = useTheme();

  const generatedName = useMemo(() => `radio-group-${Math.random().toString(36).slice(2, 9)}`, []);
  const groupName = name ?? generatedName;

  const getFirstEnabledValue = () => {
    const first = options.find((o) => !(disabled || o.disabled));
    return first?.value ?? options[0]?.value;
  };

  const [uncontrolledValue, setUncontrolledValue] = useState<RadioGroupValue | undefined>(() => {
    if (defaultValue !== undefined) return defaultValue;
    return getFirstEnabledValue();
  });

  const selectedValue = value !== undefined ? value : uncontrolledValue;

  const setSelected = (next: RadioGroupValue, event: Event) => {
    if (disabled) return;
    if (value === undefined) setUncontrolledValue(next);
    onChange?.(next, event);
  };

  const classes = ['radio-group', `radio-group--${direction}`, disabled ? 'radio-group--disabled' : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} role="radiogroup" {...props}>
      {label && <div className="radio-group__label">{label}</div>}
      <div className="radio-group__options">
        {options.map((opt) => {
          const optDisabled = disabled || !!opt.disabled;
          const isChecked = opt.value === selectedValue;

          return (
            <Radio
              key={String(opt.value)}
              name={groupName}
              value={opt.value}
              label={opt.label}
              disabled={optDisabled}
              color={color}
              size={size}
              checked={isChecked}
              onChange={(checked, e) => {
                if (!checked) return;
                setSelected(opt.value, e);
              }}
            />
          );
        })}
      </div>
      {helperText && <div className="radio-group__helper">{helperText}</div>}
    </div>
  );
}







