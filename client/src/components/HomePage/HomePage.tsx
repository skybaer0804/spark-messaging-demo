import { Box } from '@/ui-components/Layout/Box';
import { Flex } from '@/ui-components/Layout/Flex';
import { Stack } from '@/ui-components/Layout/Stack';
import { Grid } from '@/ui-components/Layout/Grid';
import { Typography } from '@/ui-components/Typography/Typography';
import { Paper } from '@/ui-components/Paper/Paper';
import { Button } from '@/ui-components/Button/Button';
import { IconMessageCircle, IconBell, IconVideo, IconChevronRight, IconRocket } from '@tabler/icons-preact';
import { useRouterState } from '@/routes/RouterState';
import { useAuth } from '@/core/hooks/useAuth';
import './HomePage.scss';

export function HomePage() {
  const { navigate } = useRouterState();
  const { user } = useAuth();

  const apps = [
    {
      id: 'chatapp',
      title: '실시간 채팅',
      icon: <IconMessageCircle size={32} />,
      description: 'Socket.IO 기반의 실시간 소통 시스템',
      color: '#509EE3',
      path: '/chatapp',
      features: ['실시간 메시징', '파일 공유', '다중 채널'],
    },
    {
      id: 'notification',
      title: '스마트 알림',
      icon: <IconBell size={32} />,
      description: '중요한 업데이트를 놓치지 마세요',
      color: '#E73C7E',
      path: '/notification',
      features: ['푸시 알림', '이력 관리', '우선순위'],
    },
    {
      id: 'video-meeting',
      title: '화상 회의',
      icon: <IconVideo size={32} />,
      description: '얼굴을 마주하며 협업하는 비디오 콜',
      color: '#23D5AB',
      path: '/video-meeting',
      features: ['WebRTC 영상', '화면 공유', '동시 접속'],
    },
  ];

  return (
    <Box className="home-page">
      <div className="home-page__container">
        {/* 히어로 섹션 */}
        <section className="home-page__hero">
          <Stack spacing="sm">
            <Flex align="center" gap="xs" className="home-page__badge">
              <IconRocket size={16} />
              <Typography variant="body-small">Spark Messaging v0.4.3</Typography>
            </Flex>
            <Typography variant="h1" className="home-page__welcome">
              반가워요, <span className="highlight">{user?.username || '사용자'}</span>님!
            </Typography>
            <Typography variant="body-large" color="text-secondary" className="home-page__hero-desc">
              오늘은 어떤 협업을 시작해볼까요? 왼쪽 메뉴 또는 아래 카드를 통해 앱을 실행하세요.
            </Typography>
          </Stack>
        </section>

        {/* 앱 그리드 */}
        <section className="home-page__content">
          <Typography variant="h3" className="home-page__section-title">
            내 애플리케이션
          </Typography>
          <Grid container spacing={3} columns={2} className="home-page__grid">
            {apps.map((app) => (
              <Grid item key={app.id} xs={2} md={1}>
                <Paper
                  className="home-page__card"
                  elevation={2}
                  onClick={() => navigate(app.path)}
                  style={{ '--app-color': app.color } as any}
                >
                  <div className="home-page__card-icon" style={{ backgroundColor: `${app.color}15`, color: app.color }}>
                    {app.icon}
                  </div>
                  <Stack spacing="xs" className="home-page__card-body">
                    <Typography variant="h4">{app.title}</Typography>
                    <Typography variant="body-medium" color="text-secondary">
                      {app.description}
                    </Typography>
                  </Stack>
                  <div className="home-page__card-footer">
                    <Flex gap="xs">
                      {app.features.map((f) => (
                        <span key={f} className="home-page__feature-tag">
                          {f}
                        </span>
                      ))}
                    </Flex>
                    <div className="home-page__card-arrow">
                      <IconChevronRight size={20} />
                    </div>
                  </div>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </section>

        {/* 퀵 액션 / 상태 섹션 (추후 확장용) */}
        <section className="home-page__footer-info">
          <Paper className="home-page__info-banner" elevation={0}>
            <Flex align="center" justify="space-between" wrap="wrap" gap="md">
              <Stack spacing="xs">
                <Typography variant="h4">도움이 필요하신가요?</Typography>
                <Typography variant="body-medium" color="text-secondary">
                  Spark Messaging의 다양한 기능을 마스터하려면 가이드를 확인하세요.
                </Typography>
              </Stack>
              <Button variant="secondary">가이드 보기</Button>
            </Flex>
          </Paper>
        </section>
      </div>
    </Box>
  );
}
