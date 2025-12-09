import { Flex, FlexProps } from './Flex';

export interface StackProps extends FlexProps {
  spacing?: string; // Gap
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
}

export function Stack({ spacing = 'md', direction = 'column', children, ...props }: StackProps) {
  return (
    <Flex direction={direction} gap={spacing} {...props}>
      {children}
    </Flex>
  );
}
