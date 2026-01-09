import { Paper } from '@/ui-components/Paper/Paper';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Divider } from '@/ui-components/Divider/Divider';
import type { DesignSystemExampleDefinition } from './types';

const usageCode = `// 좌측 사이드바(디자인 하위 메뉴)에서 항목을 선택하면
// /design-system/:ui 라우트로 이동하며 해당 예시만 렌더링됩니다.

// 예시 파일 위치
// src/components/DesignSystemDemo/example/<Component>Example.tsx
`;

export const overviewExample: DesignSystemExampleDefinition = {
  id: 'overview',
  label: 'Overview',
  description:
    '이 페이지는 예시 렌더링을 ui-component별 파일로 분리해 유지보수성을 높인 구조의 안내입니다. 사이드바에서 컴포넌트를 선택해 예시/데이터/코드를 확인하세요.',
  usageCode,
  Example: () => (
    <Paper padding="lg">
      <Stack spacing="md">
        <Typography variant="h3">Design System Demo 구조</Typography>
        <Typography variant="body-medium" color="text-secondary">
          각 ui-component는 `example/` 폴더 아래 개별 파일로 분리되어 있고, 해당 파일에는 “예시 데이터 + 설명 + 사용법 코드”
          가 함께 포함됩니다.
        </Typography>
        <Divider />
        <Typography variant="body-small">
          권장 흐름: <strong>Sidebar → 디자인 하위 메뉴</strong>에서 컴포넌트를 선택 → 예시 확인 → 코드 복사/적용
        </Typography>
      </Stack>
    </Paper>
  ),
};






