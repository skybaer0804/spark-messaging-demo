import { Button } from '@/ui-component/Button/Button';
import { ButtonGroup } from '@/ui-component/ButtonGroup/ButtonGroup';
import { Stack } from '@/ui-component/Layout/Stack';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `import { ButtonGroup } from '@/ui-component/ButtonGroup/ButtonGroup';
import { Button } from '@/ui-component/Button/Button';

<ButtonGroup>
  <Button variant="secondary">Left</Button>
  <Button variant="secondary">Center</Button>
  <Button variant="secondary">Right</Button>
</ButtonGroup>
`;

export const buttonGroupExample: DesignSystemExampleDefinition = {
  id: 'button-group',
  label: 'ButtonGroup',
  description: '연관된 버튼을 하나의 그룹으로 묶어 일관된 UI/접근성을 제공합니다.',
  usageCode,
  Example: () => (
    <Stack spacing="sm">
      <ButtonGroup>
        <Button variant="secondary">Left</Button>
        <Button variant="secondary">Center</Button>
        <Button variant="secondary">Right</Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical" fullWidth>
        <Button variant="secondary" fullWidth>
          One
        </Button>
        <Button variant="secondary" fullWidth>
          Two
        </Button>
        <Button variant="secondary" fullWidth disabled>
          Disabled
        </Button>
      </ButtonGroup>
    </Stack>
  ),
};


