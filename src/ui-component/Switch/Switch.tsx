import { JSX } from 'preact';
import './Switch.scss';

export interface SwitchProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, event: Event) => void;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  size?: 'small' | 'medium';
}

export function Switch({
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  color = 'primary',
  size = 'medium',
  className = '',
  ...props
}: SwitchProps) {
  const handleChange = (e: Event) => {
    if (disabled) return;
    const target = e.target as HTMLInputElement;
    onChange?.(target.checked, e);
  };

  return (
    <span className={`switch switch--${color} switch--${size} ${disabled ? 'switch--disabled' : ''} ${className}`}>
      <input
        type="checkbox"
        className="switch__input"
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onChange={handleChange}
        {...props}
      />
      <span className="switch__track">
        <span className="switch__thumb" />
      </span>
    </span>
  );
}
