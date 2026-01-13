import { Box, BoxProps } from './Box';
import './Grid.scss';

export interface GridProps extends BoxProps {
  container?: boolean;
  item?: boolean;
  spacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  rowSpacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  columnSpacing?: number | 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string;
  columns?: string | number;
  rows?: string | number;
  gap?: string;
  flow?: 'row' | 'column' | 'dense';
  xs?: number | 'auto';
  sm?: number | 'auto';
  md?: number | 'auto';
  lg?: number | 'auto';
  xl?: number | 'auto';
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

  return v;
};

export function Grid({
  container,
  item,
  spacing,
  rowSpacing,
  columnSpacing,
  columns,
  rows,
  gap,
  flow,
  xs,
  sm,
  md,
  lg,
  xl,
  className = '',
  style,
  children,
  ...props
}: GridProps) {
  const isContainer = container !== undefined ? container : (item ? false : true);
  const baseSpacing = resolveSpacingValue(spacing ?? gap);
  const resolvedRowSpacing = resolveSpacingValue(rowSpacing);
  const resolvedColumnSpacing = resolveSpacingValue(columnSpacing);

  const gridClasses = [
    'grid',
    isContainer ? 'grid--container' : '',
    item ? 'grid--item' : '',
    xs !== undefined ? `grid--xs-${xs}` : '',
    sm !== undefined ? `grid--sm-${sm}` : '',
    md !== undefined ? `grid--md-${md}` : '',
    lg !== undefined ? `grid--lg-${lg}` : '',
    xl !== undefined ? `grid--xl-${xl}` : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const computedStyle = {
    ...(isContainer
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
    <Box className={gridClasses} style={computedStyle} {...props}>
      {children}
    </Box>
  );
}
