import { JSX } from 'preact';
import { IconX } from '@tabler/icons-preact';
import { useTheme } from '@/core/context/ThemeProvider';
import './Chip.scss';

export interface ChipProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, 'size'> {
  label: string;
  onDelete?: () => void;
  variant?: 'default' | 'primary' | 'secondary';
  size?: 'sm' | 'md';
  disabled?: boolean;
  avatar?: preact.ComponentChildren;
}

export function Chip({
  label,
  onDelete,
  variant = 'default',
  size = 'md',
  disabled = false,
  avatar,
  className = '',
  ...props
}: ChipProps) {
  const { theme, contrast } = useTheme();

  const classes = [
    'chip',
    `chip--${variant}`,
    `chip--${size}`,
    disabled ? 'chip--disabled' : '',
    onDelete ? 'chip--deletable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} data-theme={theme} data-contrast={contrast} {...props}>
      {avatar && <span className="chip__avatar">{avatar}</span>}
      <span className="chip__label">{label}</span>
      {onDelete && !disabled && (
        <button
          type="button"
          className="chip__delete"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`${label} 제거`}
        >
          <IconX size={14} />
        </button>
      )}
    </div>
  );
}
