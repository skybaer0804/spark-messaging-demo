import { JSX } from 'preact';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import './Checkbox.scss';

export interface CheckboxProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
  label?: string;
}

export function Checkbox({
  checked,
  defaultChecked,
  indeterminate = false,
  disabled = false,
  onChange,
  color = 'primary',
  size = 'medium',
  label,
  className = '',
  ...props
}: CheckboxProps) {
  const handleChange = (e: Event) => {
    if (disabled) return;
    const target = e.target as HTMLInputElement;
    onChange?.(target.checked, e);
  };

  return (
    <label
      className={`checkbox checkbox--${color} checkbox--${size} ${disabled ? 'checkbox--disabled' : ''} ${className}`}
    >
      <span className="checkbox__input-wrapper">
        <input
          type="checkbox"
          className="checkbox__input"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          onChange={handleChange}
          {...props}
        />
        <span className="checkbox__control">
          {indeterminate ? (
            <IconMinus size={size === 'small' ? 14 : 18} stroke={3} />
          ) : (
            <IconCheck size={size === 'small' ? 14 : 18} stroke={3} />
          )}
        </span>
      </span>
      {label && <span className="checkbox__label">{label}</span>}
    </label>
  );
}
