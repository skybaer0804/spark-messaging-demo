import { Card, CardBody, CardFooter, CardHeader } from '@/ui-component/Card/Card';
import { Button } from '@/ui-component/Button/Button';
import { Typography } from '@/ui-component/Typography/Typography';
import { Stack } from '@/ui-component/Layout/Stack';
import type { DesignSystemExampleDefinition } from './types';

const exampleData = {
  title: 'Card Title',
  body: 'Card는 콘텐츠 묶음을 표현하는 기본 컨테이너입니다.',
};

const usageCode = `import { Card, CardHeader, CardBody, CardFooter } from '@/ui-component/Card/Card';

<Card>
  <CardHeader>...</CardHeader>
  <CardBody>...</CardBody>
  <CardFooter>...</CardFooter>
</Card>
`;

export const cardExample: DesignSystemExampleDefinition = {
  id: 'card',
  label: 'Card',
  description: '헤더/본문/푸터를 갖는 대표적인 Surface 컴포넌트입니다.',
  usageCode,
  Example: () => (
    <Card>
      <CardHeader>
        <Typography variant="h3">{exampleData.title}</Typography>
      </CardHeader>
      <CardBody>
        <Typography variant="body-medium">{exampleData.body}</Typography>
      </CardBody>
      <CardFooter>
        <Stack direction="row" spacing="sm">
          <Button size="sm">Action</Button>
          <Button size="sm" variant="secondary">
            Secondary
          </Button>
        </Stack>
      </CardFooter>
    </Card>
  ),
};


