import { Checkbox } from '@/ui-components/Checkbox/Checkbox';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `import { Checkbox } from '@/ui-components/Checkbox/Checkbox';

<Checkbox defaultChecked />
<Checkbox disabled />
`;

export const checkboxExample: DesignSystemExampleDefinition = {
  id: 'checkbox',
  label: 'Checkbox',
  description: '복수 선택에 사용하는 선택 컨트롤입니다.',
  usageCode,
  Example: () => (
    <Flex gap="md" align="center" wrap="wrap">
      <Checkbox defaultChecked />
      <Checkbox />
      <Checkbox disabled defaultChecked />
      <Checkbox color="error" defaultChecked />
      <Typography variant="caption" color="text-secondary">
        defaultChecked/disabled/color 등으로 상태를 표현합니다.
      </Typography>
    </Flex>
  ),
};






