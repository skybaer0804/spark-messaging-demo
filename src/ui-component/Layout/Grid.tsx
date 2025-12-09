import { Box, BoxProps } from './Box';

export interface GridProps extends BoxProps {
  columns?: string | number; // e.g., '1fr 1fr' or 2 (converted to repeat(2, 1fr))
  rows?: string | number;
  gap?: string;
  flow?: 'row' | 'column' | 'dense';
}

export function Grid({ columns, rows, gap, flow, style, children, ...props }: GridProps) {
  const formatGridTemplate = (value?: string | number) => {
    if (typeof value === 'number') {
      return `repeat(${value}, 1fr)`;
    }
    return value;
  };

  const computedStyle = {
    display: 'grid',
    ...(columns && { gridTemplateColumns: formatGridTemplate(columns) }),
    ...(rows && { gridTemplateRows: formatGridTemplate(rows) }),
    ...(gap && { gap: `var(--space-gap-${gap}, ${gap})` }),
    ...(flow && { gridAutoFlow: flow }),
    ...((style as object) || {}),
  };

  return (
    <Box style={computedStyle} {...props}>
      {children}
    </Box>
  );
}
