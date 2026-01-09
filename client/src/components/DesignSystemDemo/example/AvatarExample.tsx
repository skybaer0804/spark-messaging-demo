import { Avatar } from '@/ui-components/Avatar/Avatar';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  users: [
    { id: 1, name: 'WONJAE', src: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, name: 'ALICE', src: 'https://i.pravatar.cc/150?img=2' },
  ],
};

const usageCode = `import { Avatar } from '@/ui-components/Avatar/Avatar';

<Avatar size="lg" src="..." alt="User" />
<Avatar variant="rounded" size="sm">AB</Avatar>
`;

export const avatarExample: DesignSystemExampleDefinition = {
  id: 'avatar',
  label: 'Avatar',
  description: '사용자/리소스의 대표 이미지를 표현합니다. src가 없으면 children을 렌더링합니다.',
  usageCode,
  Example: () => (
    <Stack direction="row" spacing="md" align="center">
      {exampleData.users.map((u) => (
        <Avatar key={u.id} size="lg" src={u.src} alt={u.name} />
      ))}
      <Avatar size="md">WJ</Avatar>
      <Avatar size="sm" variant="rounded">
        AB
      </Avatar>
      <Typography variant="caption" color="text-secondary">
        예시 데이터: users({exampleData.users.length})
      </Typography>
    </Stack>
  ),
};






