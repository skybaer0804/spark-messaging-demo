import { Box, BoxProps } from './Box';

export interface ContainerProps extends BoxProps {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | false;
  fixed?: boolean; // If true, max-width matches the min-width of the current breakpoint
  disableGutters?: boolean;
}

export function Container({
  maxWidth = 'lg',
  fixed = false,
  disableGutters = false,
  className = '',
  style,
  children,
  ...props
}: ContainerProps) {
  // Note: In a real implementation with tokens, we would map maxWidth to var(--layout-container-lg) etc.
  // For now we will use inline style logic or class names mapped to tokens.

  const classes = [
    'container',
    maxWidth ? `container--max-${maxWidth}` : '',
    disableGutters ? 'container--no-gutters' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const computedStyle = {
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: disableGutters ? 0 : 'var(--space-gap-md)',
    paddingRight: disableGutters ? 0 : 'var(--space-gap-md)',
    width: '100%',
    maxWidth: maxWidth ? `var(--layout-container-${maxWidth}, 100%)` : '100%',
    ...((style as object) || {}),
  };

  return (
    <Box className={classes} style={computedStyle} {...props}>
      {children}
    </Box>
  );
}
