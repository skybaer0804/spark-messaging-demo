import { useState } from 'preact/hooks';
import { Box } from '@/ui-component/Layout/Box';
import { Flex } from '@/ui-component/Layout/Flex';
import { Stack } from '@/ui-component/Layout/Stack';
import { Typography } from '@/ui-component/Typography/Typography';
import { Paper } from '@/ui-component/Paper/Paper';
import { Tabs, TabsItem } from '@/ui-component/Tabs/Tabs';
import { Button } from '@/ui-component/Button/Button';
import { IconMessageCircle, IconBell, IconGavel } from '@tabler/icons-react';
import { useRouterState } from '@/routes/RouterState';
import './HomePage.scss';

export function HomePage() {
  const { navigate } = useRouterState();
  const [activeTab, setActiveTab] = useState<string>('chatapp');

  const appDescriptions: Record<string, { title: string; description: string; features: string[] }> = {
    chatapp: {
      title: '실시간 채팅',
      description: 'Socket.IO 기반의 실시간 채팅 애플리케이션입니다. 여러 채팅방을 생성하고 참여하여 실시간으로 메시지를 주고받을 수 있습니다.',
      features: [
        '실시간 메시지 전송 및 수신',
        '다중 채팅방 지원',
        '파일 및 이미지 공유',
        '연결 상태 표시',
      ],
    },
    notification: {
      title: '알림 시스템',
      description: '실시간 알림을 받고 관리할 수 있는 시스템입니다. 다양한 유형의 알림을 처리하고 우선순위를 설정할 수 있습니다.',
      features: [
        '실시간 알림 수신',
        '알림 우선순위 설정',
        '알림 히스토리 관리',
        '알림 필터링',
      ],
    },
    'reverse-auction': {
      title: '역경매 시스템',
      description: '구매자가 가격을 제시하고 판매자가 응찰하는 역경매 시스템입니다. 실시간으로 경매 진행 상황을 확인할 수 있습니다.',
      features: [
        '실시간 경매 진행',
        '가격 제시 및 응찰',
        '경매 상태 관리',
        '경매 히스토리 조회',
      ],
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
              <Typography variant="body-small" color="text-secondary" style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}>
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
              <Typography variant="body-small" color="text-secondary" style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}>
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
      value: 'reverse-auction',
      label: '역경매',
      content: (
        <Box className="home-page__app-content">
          <Stack spacing="md">
            <Flex align="center" gap="sm">
              <IconGavel size={20} />
              <Typography variant="h3">{appDescriptions['reverse-auction'].title}</Typography>
            </Flex>
            <Typography variant="body-medium" color="text-secondary">
              {appDescriptions['reverse-auction'].description}
            </Typography>
            <Stack spacing="sm">
              <Typography variant="body-small" color="text-secondary" style={{ fontWeight: 'var(--primitive-font-weight-semibold)' }}>
                주요 기능:
              </Typography>
              <ul className="home-page__features-list">
                {appDescriptions['reverse-auction'].features.map((feature, index) => (
                  <li key={index}>
                    <Typography variant="body-small" color="text-secondary">
                      {feature}
                    </Typography>
                  </li>
                ))}
              </ul>
            </Stack>
            <Flex justify="flex-end" style={{ marginTop: 'var(--space-gap-md)' }}>
              <Button variant="primary" onClick={() => navigate('/reverse-auction')}>
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
      <Stack spacing="xl" style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-padding-card-lg)' }}>
        {/* 앱 소개글 */}
        <Paper padding="xl" elevation={2} className="home-page__intro">
          <Stack spacing="md">
            <Typography variant="h1" className="home-page__title">
              Spark Messaging Demo
            </Typography>
            <Typography variant="body-large" color="text-secondary" className="home-page__subtitle">
              실시간 통신을 위한 다양한 애플리케이션을 경험해보세요. Socket.IO 기반의 강력한 메시징 시스템으로
              채팅, 알림, 역경매 등 다양한 기능을 제공합니다.
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

        {/* 프리뷰 섹션 */}
        <Paper padding="lg" elevation={1} className="home-page__preview">
          <Stack spacing="md">
            <Typography variant="h2" className="home-page__section-title">
              미리보기
            </Typography>
            <Box className="home-page__preview-content">
              <Paper padding="md" variant="outlined" style={{ backgroundColor: 'var(--color-background-secondary)' }}>
                <Typography variant="body-medium" color="text-secondary" align="center">
                  {activeTab === 'chatapp' && '💬 실시간 채팅 인터페이스 미리보기'}
                  {activeTab === 'notification' && '🔔 알림 관리 인터페이스 미리보기'}
                  {activeTab === 'reverse-auction' && '🔨 역경매 인터페이스 미리보기'}
                </Typography>
                <Typography variant="body-small" color="text-tertiary" align="center" style={{ marginTop: 'var(--space-gap-sm)' }}>
                  위의 탭에서 "체험해보기" 버튼을 클릭하여 실제 애플리케이션을 사용해보세요.
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

