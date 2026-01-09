import { Container } from '@/ui-components/Layout/Container';
import { Stack } from '@/ui-components/Layout/Stack';
import { Paper } from '@/ui-components/Paper/Paper';
import { Typography } from '@/ui-components/Typography/Typography';
import { Divider } from '@/ui-components/Divider/Divider';
import { getDesignSystemExampleById } from './example';
import './DesignSystemDemo.scss';

interface DesignSystemDemoProps {
  focusSection?: string;
}

export function DesignSystemDemo({ focusSection }: DesignSystemDemoProps) {
  const selectedId = focusSection ?? 'overview';
  const example = getDesignSystemExampleById(selectedId);

  return (
    <div className="design-system-demo">
      <Container maxWidth="lg">
        <Stack spacing="lg">
          <Paper padding="lg" className="design-system-demo__header">
            <Stack spacing="xs">
              <Typography variant="body-medium" color="text-secondary">
                ui-component별 예시를 파일 단위로 분리했습니다. 사이드바의 “디자인” 하위 메뉴에서 항목을 선택하세요.
              </Typography>
            </Stack>
          </Paper>

          {!example ? (
            <Paper padding="lg" className="design-system-demo__section">
              <Typography variant="h3">예시를 찾을 수 없습니다.</Typography>
              <Typography variant="body-small" color="text-secondary">
                요청한 id: {selectedId}
              </Typography>
          </Paper>
          ) : (
            <Paper padding="lg" className="design-system-demo__section">
              <Stack spacing="md">
                <Typography variant="h3">{example.label}</Typography>
                <Typography variant="body-small" color="text-secondary">
                  {example.description}
                </Typography>
                <Divider />
                <div className="design-system-demo__preview">{example.Example()}</div>
                <Divider />
                <Typography variant="h4">사용법</Typography>
                <pre className="design-system-demo__code">
                  <code>{example.usageCode}</code>
                </pre>
            </Stack>
          </Paper>
          )}
        </Stack>
      </Container>
    </div>
  );
}
