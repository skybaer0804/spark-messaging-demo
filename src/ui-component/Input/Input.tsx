import { JSX } from 'preact';
import { useTokens } from '../../context/TokenProvider';
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
}

export function Input({
  label,
  helperText,
  error,
  multiline = false,
  fullWidth = true,
  className = '',
  ...props
}: InputProps) {
  const { theme, contrast } = useTokens();
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const wrapperClasses = ['input-group', fullWidth ? 'fullWidth' : '', className].filter(Boolean).join(' ');

  const inputClasses = ['input', multiline ? 'input-textarea' : '', error ? 'error' : ''].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses} data-theme={theme} data-contrast={contrast}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {multiline ? (
          <textarea id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLTextAreaElement>)} />
        ) : (
          <input id={inputId} className={inputClasses} {...(props as JSX.HTMLAttributes<HTMLInputElement>)} />
        )}
      </div>
      {helperText && <span className={`input-helper-text ${error ? 'error' : ''}`}>{helperText}</span>}
    </div>
  );
}
