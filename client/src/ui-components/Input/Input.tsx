import { JSX } from 'preact';
import { useTheme } from '@/core/context/ThemeProvider';
import './Input.scss';

export interface InputProps extends Omit<JSX.HTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: boolean;
  multiline?: boolean;
  fullWidth?: boolean;
  placeholder?: string;
  disabled?: boolean;
  value?: string | number;
  rows?: number;
  type?: string;
  startAdornment?: JSX.Element;
  endAdornment?: JSX.Element;
}

export function Input({
  label,
  helperText,
  error,
  multiline = false,
  fullWidth = true,
  className = '',
  startAdornment,
  endAdornment,
  ...props
}: InputProps) {
  const { theme, contrast } = useTheme();
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const wrapperClasses = ['input-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    multiline ? 'input-textarea' : '',
    error ? 'error' : '',
    startAdornment ? 'has-start' : '',
    endAdornment ? 'has-end' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClasses} data-theme={theme} data-contrast={contrast}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-container">
        {startAdornment && <div className="input-adornment start">{startAdornment}</div>}
        {multiline ? (
          <textarea id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLInputElement>)} />
        )}
        {endAdornment && <div className="input-adornment end">{endAdornment}</div>}
      </div>
      {helperText && <span className={`input-helper-text ${error ? 'error' : ''}`}>{helperText}</span>}
    </div>
  );
}
