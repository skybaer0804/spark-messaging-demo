import { Input, InputProps } from '../Input/Input';
import './TextField.scss';

export interface TextFieldProps extends InputProps {
  variant?: 'outlined' | 'standard' | 'filled';
  name?: string;
  required?: boolean;
}

export function TextField({ variant = 'outlined', className = '', ...props }: TextFieldProps) {
  const classes = [`text-field--${variant}`, className].filter(Boolean).join(' ');

  return <Input className={classes} {...props} />;
}
