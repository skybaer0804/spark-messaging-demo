import { Breadcrumbs } from '@/ui-components/Breadcrumbs/Breadcrumbs';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  items: [{ label: 'Home' }, { label: 'Library' }, { label: 'Data' }, { label: 'Current Page' }],
};

const usageCode = `import { Breadcrumbs } from '@/ui-components/Breadcrumbs/Breadcrumbs';

<Breadcrumbs
  items={[{ label: 'Home', onClick: () => {} }, { label: 'Current' }]}
/>
`;

export const breadcrumbsExample: DesignSystemExampleDefinition = {
  id: 'breadcrumbs',
  label: 'Breadcrumbs',
  description: '현재 위치의 경로를 계층적으로 표시합니다. maxItems로 축약 가능합니다.',
  usageCode,
  Example: () => (
    <Breadcrumbs
      ariaLabel="breadcrumbs example"
      maxItems={3}
      items={exampleData.items.map((i) => ({ label: i.label, onClick: i.label !== 'Current Page' ? () => {} : undefined }))}
    />
  ),
};






