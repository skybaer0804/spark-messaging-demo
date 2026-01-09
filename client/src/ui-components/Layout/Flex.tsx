import { Box, BoxProps } from './Box';

export interface FlexProps extends BoxProps {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  gap?: string;
}

export function Flex({
  direction = 'row',
  justify = 'flex-start',
  align = 'stretch',
  wrap = 'nowrap',
  gap,
  style,
  children,
  ...props
}: FlexProps) {
  const computedStyle = {
    display: 'flex',
    flexDirection: direction,
    justifyContent: justify,
    alignItems: align,
    flexWrap: wrap,
    ...(gap && { gap: `var(--space-gap-${gap}, ${gap})` }),
    ...((style as object) || {}),
  };

  return (
    <Box style={computedStyle} {...props}>
      {children}
    </Box>
  );
}
