import { Stack } from '@/ui-component/Layout/Stack';
import { Flex } from '@/ui-component/Layout/Flex';
import { Button } from '@/ui-component/Button/Button';
import { IconButton } from '@/ui-component/Button/IconButton';
import { Typography } from '@/ui-component/Typography/Typography';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  variants: ['primary', 'secondary'] as const,
  sizes: ['sm', 'md', 'lg'] as const,
};

const usageCode = `import { Button } from '@/ui-component/Button/Button';
import { IconButton } from '@/ui-component/Button/IconButton';
import { IconSearch } from '@tabler/icons-react';

<Button variant="primary">Primary</Button>
<Button variant="secondary" size="sm">Secondary</Button>
<IconButton color="default" title="검색">
  <IconSearch size={20} />
</IconButton>
`;

export const buttonExample: DesignSystemExampleDefinition = {
  id: 'button',
  label: 'Button',
  description: '기본 버튼/아이콘 버튼의 변형(variant/size)을 제공합니다.',
  usageCode,
  Example: () => (
    <Stack spacing="md">
      <Typography variant="body-small" color="text-secondary">
        데이터: variants({exampleData.variants.join(', ')}), sizes({exampleData.sizes.join(', ')})
      </Typography>
      <Flex gap="sm" wrap="wrap" align="center">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" size="sm">
          <IconPlus size={18} /> Small
        </Button>
        <IconButton color="default" title="검색">
          <IconSearch size={20} />
        </IconButton>
      </Flex>
    </Stack>
  ),
};


