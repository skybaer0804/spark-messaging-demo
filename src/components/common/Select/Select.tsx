import { JSX } from 'preact';
import { useTokens } from '../../../context/TokenProvider';
import './Select.scss';

export interface SelectOption {
    value: string | number;
    label: string;
}

export interface SelectProps extends Omit<JSX.HTMLAttributes<HTMLSelectElement>, 'size'> {
    label?: string;
    options: SelectOption[];
    error?: boolean;
    helperText?: string;
    fullWidth?: boolean;
    value?: string | number;
    disabled?: boolean;
    onChange?: JSX.GenericEventHandler<HTMLSelectElement>;
}

export function Select({ label, options, error, helperText, fullWidth = true, className = '', ...props }: SelectProps) {
    const { theme, contrast } = useTokens();
    const selectId = props.id || `select-${Math.random().toString(36).substr(2, 9)}`;

    const wrapperClasses = ['select-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');
    const selectClasses = ['select', error ? 'error' : ''].filter(Boolean).join(' ');

    return (
        <div className={wrapperClasses} data-theme={theme} data-contrast={contrast}>
            {label && (
                <label htmlFor={selectId} className="select-label">
                    {label}
                </label>
            )}
            <div className="select-wrapper">
                <select id={selectId} className={selectClasses} {...props}>
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {/* Custom arrow icon can be added here if needed via CSS or SVG */}
            </div>
            {helperText && <span className={`select-helper-text ${error ? 'error' : ''}`}>{helperText}</span>}
        </div>
    );
}
