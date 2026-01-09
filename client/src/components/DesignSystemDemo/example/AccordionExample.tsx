import { Accordion } from '@/ui-components/Accordion/Accordion';
import { Typography } from '@/ui-components/Typography/Typography';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  items: [
    { value: 'panel-1', summary: 'Accordion 1', details: '첫 번째 패널 내용입니다.' },
    { value: 'panel-2', summary: 'Accordion 2', details: '두 번째 패널 내용입니다.' },
    { value: 'panel-3', summary: 'Disabled', details: '비활성화된 패널입니다.', disabled: true },
  ] as const,
};

const usageCode = `import { Accordion } from '@/ui-components/Accordion/Accordion';

<Accordion
  allowMultiple
  defaultExpanded={['panel-1']}
  items={[
    { value: 'panel-1', summary: 'Accordion 1', details: <div>...</div> },
  ]}
/>
`;

export const accordionExample: DesignSystemExampleDefinition = {
  id: 'accordion',
  label: 'Accordion',
  description: '접고 펼칠 수 있는 콘텐츠 영역입니다. 키보드/ARIA를 고려한 기본 구조를 제공합니다.',
  usageCode,
  Example: () => (
    <Accordion
      ariaLabel="accordion example"
      allowMultiple
      defaultExpanded={['panel-1']}
      items={exampleData.items.map((i) => ({
        value: i.value,
        summary: i.summary,
        disabled: (i as any).disabled,
        details: <Typography variant="body-medium">{i.details}</Typography>,
      }))}
    />
  ),
};






