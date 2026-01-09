import { CircularProgress } from '@/ui-components/CircularProgress/CircularProgress';
import { Flex } from '@/ui-components/Layout/Flex';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `import { CircularProgress } from '@/ui-components/CircularProgress/CircularProgress';

<CircularProgress />
<CircularProgress variant="determinate" value={75} />
`;

export const circularProgressExample: DesignSystemExampleDefinition = {
  id: 'circular-progress',
  label: 'CircularProgress',
  description: '로딩 상태를 원형 진행 표시로 나타냅니다.',
  usageCode,
  Example: () => (
    <Flex gap="lg" align="center" wrap="wrap">
      <CircularProgress />
      <CircularProgress color="secondary" />
      <CircularProgress variant="determinate" value={75} color="success" />
    </Flex>
  ),
};






