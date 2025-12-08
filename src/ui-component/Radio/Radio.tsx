import { JSX } from 'preact';
import './Radio.scss';

export interface RadioProps extends Omit<JSX.HTMLAttributes<HTMLInputElement>, 'onChange'> {
    checked?: boolean;
    disabled?: boolean;
    onChange?: (checked: boolean, event: Event) => void;
    value?: string | number | readonly string[];
    name?: string;
    color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    size?: 'small' | 'medium';
    label?: string;
}

export function Radio({
    checked,
    disabled = false,
    onChange,
    value,
    name,
    color = 'primary',
    size = 'medium',
    label,
    className = '',
    ...props
}: RadioProps) {
    const handleChange = (e: Event) => {
        if (disabled) return;
        const target = e.target as HTMLInputElement;
        onChange?.(target.checked, e);
    };

    return (
        <label className={`radio radio--${color} radio--${size} ${disabled ? 'radio--disabled' : ''} ${className}`}>
            <span className="radio__input-wrapper">
                <input
                    type="radio"
                    className="radio__input"
                    checked={checked}
                    disabled={disabled}
                    onChange={handleChange}
                    value={value}
                    name={name}
                    {...props}
                />
                <span className="radio__control">
                    <span className="radio__dot" />
                </span>
            </span>
            {label && <span className="radio__label">{label}</span>}
        </label>
    );
}
