import { Box, BoxProps } from './Box';
import './Grid.scss';

export interface GridProps extends BoxProps {
  container?: boolean;
  spacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  rowSpacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  columnSpacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  columns?: string | number; // e.g., '1fr 1fr' or 2 (converted to repeat(2, minmax(0, 1fr)))
  rows?: string | number;
  gap?: string; // legacy alias of spacing
  flow?: 'row' | 'column' | 'dense';
}

const formatGridTemplate = (value?: string | number) => {
  if (typeof value === 'number') {
    return `repeat(${value}, minmax(0, 1fr))`;
  }
  return value;
};

const resolveSpacingValue = (value?: GridProps['spacing']) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return `calc(var(--grid-spacing-unit) * ${value})`;

  const v = String(value);
  const named = ['none', 'xs', 'sm', 'md', 'lg', 'xl'];
  if (named.includes(v)) return `var(--grid-spacing-${v})`;

  // Allow raw CSS values (e.g. '12px', '1rem', 'var(--some-token)')
  return v;
};

export function Grid({
  container = true,
  spacing,
  rowSpacing,
  columnSpacing,
  columns,
  rows,
  gap,
  flow,
  className = '',
  style,
  children,
  ...props
}: GridProps) {
  const baseSpacing = resolveSpacingValue(spacing ?? gap);
  const resolvedRowSpacing = resolveSpacingValue(rowSpacing);
  const resolvedColumnSpacing = resolveSpacingValue(columnSpacing);

  const computedStyle = {
    ...(container
      ? {
          '--grid-template-columns': formatGridTemplate(columns),
          '--grid-template-rows': formatGridTemplate(rows),
          '--grid-gap': baseSpacing,
          '--grid-row-gap': resolvedRowSpacing,
          '--grid-column-gap': resolvedColumnSpacing,
          '--grid-auto-flow': flow,
        }
      : {}),
    ...((style as object) || {}),
  } as any;

  return (
    <Box className={`grid ${container ? 'grid--container' : ''} ${className}`} style={computedStyle} {...props}>
      {children}
    </Box>
  );
}
