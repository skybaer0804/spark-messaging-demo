import { Alert } from '@/ui-component/Alert/Alert';
import { Stack } from '@/ui-component/Layout/Stack';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  items: [
    { severity: 'success', text: '성공 알림입니다.' },
    { severity: 'info', text: '정보 알림입니다.', variant: 'outlined' as const },
    { severity: 'warning', text: '주의 알림입니다.', variant: 'filled' as const },
    { severity: 'error', text: '에러 알림입니다.' },
  ] as const,
};

const usageCode = `import { Alert } from '@/ui-component/Alert/Alert';

<Alert severity="success">성공</Alert>
<Alert severity="info" variant="outlined">정보</Alert>
`;

export const alertExample: DesignSystemExampleDefinition = {
  id: 'alert',
  label: 'Alert',
  description: '상태/피드백 메시지를 강조 표시합니다. variant로 스타일을 선택할 수 있습니다.',
  usageCode,
  Example: () => (
    <Stack spacing="sm">
      {exampleData.items.map((i) => (
        <Alert key={`${i.severity}-${i.text}`} severity={i.severity as any} variant={(i as any).variant}>
          {i.text}
        </Alert>
      ))}
    </Stack>
  ),
};


