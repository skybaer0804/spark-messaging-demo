import { useState } from 'preact/hooks';
import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { Tabs, TabsItem } from '@/ui-components/Tabs/Tabs';
import { Button } from '@/ui-components/Button/Button';
import { IconMessageCircle, IconBell, IconVideo } from '@tabler/icons-react';
import { useRouterState } from '@/routes/RouterState';
import './HomePage.scss';

export function HomePage() {
  const { navigate } = useRouterState();
  const [activeTab, setActiveTab] = useState<string>('chatapp');

  const appDescriptions: Record<string, { title: string; description: string; features: string[] }> = {
    chatapp: {
      title: '실시간 채팅',
      description:
        'Socket.IO 기반의 실시간 채팅 애플리케이션입니다. 여러 채팅방을 생성하고 참여하여 실시간으로 메시지를 주고받을 수 있습니다.',
      features: ['실시간 메시지 전송 및 수신', '다중 채팅방 지원', '파일 및 이미지 공유', '연결 상태 표시'],
    },
    notification: {
      title: '알림 시스템',
      description:
        '실시간 알림을 받고 관리할 수 있는 시스템입니다. 다양한 유형의 알림을 처리하고 우선순위를 설정할 수 있습니다.',
      features: ['실시간 알림 수신', '알림 우선순위 설정', '알림 히스토리 관리', '알림 필터링'],
    },
    'video-meeting': {
      title: '화상회의 시스템',
      description:
        'WebRTC 기술을 활용한 고성능 화상회의 솔루션입니다. 실시간 비디오 및 오디오 통신을 통해 원격 협업을 지원합니다.',
      features: ['고화질 실시간 영상 통화', '화면 공유 및 협업 도구', '채팅 및 파일 전송', '다양한 회의 모드 지원'],
    },
  };

  const appTabs: TabsItem[] = [
    {
      value: 'chatapp',
      label: '채팅',
      content: (
        <Box className="home-page__app-content">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconMessageCircle size={20} />
              <Typography variant="h3">{appDescriptions.chatapp.title}</Typography>
            </Flex>
            <Typography variant="body-medium" color="text-secondary">
              {appDescriptions.chatapp.description}
            </Typography>
            <Stack spacing="sm">
              <Typography
                variant="body-small"
                color="text-secondary"
                style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}
              >
                주요 기능:
              </Typography>
              <ul className="home-page__features-list">
                {appDescriptions.chatapp.features.map((feature, index) => (
                  <li key={index}>
                    <Typography variant="body-small" color="text-secondary">
                      {feature}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>
            <Flex justify="flex-end" style={{ marginTop: 'var(--space-gap-md)' }}>
              <Button variant="primary" onClick={() => navigate('/chatapp')}>
                체험해보기
              </Button>
            </Flex>
          </Stack>
        </Box>
      ),
    },
    {
      value: 'notification',
      label: '알림',
      content: (
        <Box className="home-page__app-content">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconBell size={20} />
              <Typography variant="h3">{appDescriptions.notification.title}</Typography>
            </Flex>
            <Typography variant="body-medium" color="text-secondary">
              {appDescriptions.notification.description}
            </Typography>
            <Stack spacing="sm">
              <Typography
                variant="body-small"
                color="text-secondary"
                style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}
              >
                주요 기능:
              </Typography>
              <ul className="home-page__features-list">
                {appDescriptions.notification.features.map((feature, index) => (
                  <li key={index}>
                    <Typography variant="body-small" color="text-secondary">
                      {feature}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>
            <Flex justify="flex-end" style={{ marginTop: 'var(--space-gap-md)' }}>
              <Button variant="primary" onClick={() => navigate('/notification')}>
                체험해보기
              </Button>
            </Flex>
          </Stack>
        </Box>
      ),
    },
    {
      value: 'video-meeting',
      label: '회의',
      content: (
        <Box className="home-page__app-content">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconVideo size={20} />
              <Typography variant="h3">{appDescriptions['video-meeting'].title}</Typography>
            </Flex>
            <Typography variant="body-medium" color="text-secondary">
              {appDescriptions['video-meeting'].description}
            </Typography>
            <Stack spacing="sm">
              <Typography
                variant="body-small"
                color="text-secondary"
                style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}
              >
                주요 기능:
              </Typography>
              <ul className="home-page__features-list">
                {appDescriptions['video-meeting'].features.map((feature, index) => (
                  <li key={index}>
                    <Typography variant="body-small" color="text-secondary">
                      {feature}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>
            <Flex justify="flex-end" style={{ marginTop: 'var(--space-gap-md)' }}>
              <Button variant="primary" onClick={() => navigate('/video-meeting')}>
                체험해보기
              </Button>
            </Flex>
          </Stack>
        </Box>
      ),
    },
  ];

  const handleTabChange = (value: string | number) => {
    setActiveTab(String(value));
  };

  return (
    <Box className="home-page">
      <Stack spacing="xl" style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 앱 소개글 */}
        <Paper padding="lg" elevation={1} className="home-page__intro">
          <Stack spacing="md">
            <Typography variant="body-large" color="text-secondary" className="home-page__subtitle">
              실시간 통신을 위한 다양한 애플리케이션을 경험해보세요. Socket.IO 기반의 강력한 메시징 시스템으로 채팅,
              알림, 화상회의 등 다양한 기능을 제공합니다.
            </Typography>
          </Stack>
        </Paper>

        {/* 지원하는 앱 탭 */}
        <Paper padding="lg" elevation={1} className="home-page__apps">
          <Stack spacing="lg">
            <Typography variant="h2" className="home-page__section-title">
              지원하는 앱
            </Typography>
            <Tabs items={appTabs} value={activeTab} onChange={handleTabChange} variant="fullWidth" />
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}
