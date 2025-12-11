import { JSX } from 'preact';
import { useTheme } from '../../context/ThemeProvider';
import './StatusChip.scss';

export type StatusChipVariant = 'active' | 'pending' | 'badge' | 'default';

export interface StatusChipProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusChipVariant;
  label: string;
}

export function StatusChip({ variant = 'default', label, className = '', ...props }: StatusChipProps) {
  const { theme, contrast } = useTheme();
  const classes = ['status-chip', variant, className].filter(Boolean).join(' ');

  return (
    <span className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {label}
    </span>
  );
}
