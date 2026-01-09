import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Divider } from '@/ui-components/Divider/Divider';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  title: 'Typography',
  samples: [
    { variant: 'display-large', text: 'Display Large' },
    { variant: 'h1', text: 'Heading 1' },
    { variant: 'h2', text: 'Heading 2' },
    { variant: 'h3', text: 'Heading 3' },
    { variant: 'h4', text: 'Heading 4' },
    { variant: 'body-large', text: 'Body Large - 큰 본문 텍스트' },
    { variant: 'body-medium', text: 'Body Medium - 기본 본문 텍스트' },
    { variant: 'body-small', text: 'Body Small - 작은 본문 텍스트' },
    { variant: 'caption', text: 'Caption - 보조 텍스트' },
  ] as Array<{ variant: any; text: string }>,
};

const usageCode = `import { Typography } from '@/ui-components/Typography/Typography';

<Typography variant="h3">제목</Typography>
<Typography variant="body-medium" color="text-secondary">
  보조 설명
</Typography>
`;

export const typographyExample: DesignSystemExampleDefinition = {
  id: 'typography',
  label: 'Typography',
  description: '텍스트의 계층(제목/본문/캡션)을 토큰 기반으로 일관되게 표현합니다.',
  usageCode,
  Example: () => (
    <Stack spacing="sm">
      {exampleData.samples.map((s) => (
        <Typography key={`${s.variant}-${s.text}`} variant={s.variant}>
          {s.text}
        </Typography>
      ))}
      <Divider />
      <Typography variant="caption" color="text-secondary">
        color prop은 semantic 토큰(`var(--color-text-*)`)으로 매핑됩니다.
      </Typography>
    </Stack>
  ),
};






