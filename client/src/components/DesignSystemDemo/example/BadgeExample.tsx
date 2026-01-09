import { Badge } from '@/ui-components/Badge/Badge';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { IconMail, IconBell } from '@tabler/icons-react';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  unread: 4,
  total: 120,
};

const usageCode = `import { Badge } from '@/ui-components/Badge/Badge';
import { IconMail } from '@tabler/icons-react';

<Badge badgeContent={4} color="error">
  <IconMail size={24} />
</Badge>
`;

export const badgeExample: DesignSystemExampleDefinition = {
  id: 'badge',
  label: 'Badge',
  description: '아이콘/요소에 상태(개수/점)를 덧씌워 표시합니다.',
  usageCode,
  Example: () => (
    <Flex gap="lg" align="center" wrap="wrap">
      <Badge badgeContent={exampleData.unread} color="error">
        <IconMail size={24} />
      </Badge>
      <Badge badgeContent={exampleData.total} color="primary">
        <IconMail size={24} />
      </Badge>
      <Badge variant="dot" color="success">
        <IconBell size={24} />
      </Badge>
      <Typography variant="caption" color="text-secondary">
        예시 데이터: unread={exampleData.unread}, total={exampleData.total}
      </Typography>
    </Flex>
  ),
};






