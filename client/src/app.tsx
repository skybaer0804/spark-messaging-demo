import { useState, useEffect, useCallback } from 'preact/hooks';
import sparkMessagingClient from './config/sparkMessaging';
import { appRoutes, getDesignSystemComponentFromPath } from './routes/appRoutes';
import { SidebarLayout } from './layouts/SidebarLayout/SidebarLayout';
import { RouterStateProvider } from './routes/RouterState';
import { ensureSparkMessagingConnected } from '@/core/utils/ensureSparkMessagingConnected';
import { useAuth } from '@/core/context/AuthContext';
import { useToast } from '@/core/context/ToastContext';
import { PushService } from '@/core/api/PushService';
import { Login, Signup } from '@/domains/Auth';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';
import { Flex } from '@/ui-components/Layout/Flex';
import { Typography } from '@/ui-components/Typography/Typography';
import { Button } from '@/ui-components/Button/Button';
import { ChatProvider } from './domains/Chat/context/ChatContext';
import './app.scss';
import './index.css';

/**
 * SPA 구조의 App 컴포넌트
 * 상태 기반 네비게이션 적용 (Docs 아키텍처)
 */
export function App() {
  const { isAuthenticated, loading } = useAuth();
  const { showInfo } = useToast();

  // 초기 경로 가져오기
  const getInitialRoute = () => {
    if (typeof window !== 'undefined') {
      return window.location.pathname === '/' ? '/' : window.location.pathname;
    }
    return '/';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialRoute());

  // 브라우저 히스토리와 동기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.history.replaceState({ route: currentRoute }, '', currentRoute);
    }
  }, []);

  // 브라우저 뒤로가기/앞으로가기 지원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.route) {
        setCurrentRoute(e.state.route);
      } else {
        const path = window.location.pathname;
        setCurrentRoute(path || '/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleNavigate = useCallback(
    (path: string, options: { force?: boolean; animate?: boolean; direction?: string } = {}) => {
      if (path === currentRoute && !options.force) {
        return;
      }

      setCurrentRoute(path);
      if (typeof window !== 'undefined') {
        window.history.pushState({ route: path }, '', path);
      }
    },
    [currentRoute],
  );

  useEffect(() => {
    // 인증 상태 확인 및 푸시 등록
    const init = async () => {
      if (isAuthenticated) {
        try {
          // PushService.registerServiceWorker 내부에서 중복 및 개발모드 체크함
          await PushService.registerServiceWorker();
          await PushService.subscribeToPush();
        } catch (error) {
          console.error('Push registration failed:', error);
        }
      }
    };
    init();

    // SDK 연결 초기화
    const initializeConnection = async () => {
      try {
        await ensureSparkMessagingConnected();
      } catch (error) {
        console.error('연결 초기화 실패:', error);
      }
    };

    initializeConnection();

    // 연결 상태 핸들러
    const handleConnected = (_data: any) => {
      // v2.2.0: 개별 컴포넌트에서 상태 관리
    };

    // 연결 상태 변경 핸들러
    const handleConnectionStateChange = (_connected: boolean) => {
      // v2.2.0: 개별 컴포넌트에서 상태 관리
    };

    // 알림 메시지 수신 핸들러
    const handleNotification = (data: any) => {
      try {
        if (data.type === 'notification') {
          let notificationData;
          try {
            notificationData = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          } catch {
            notificationData = { content: data.content };
          }

          const notificationMessage = notificationData.content || data.content || '알림이 도착했습니다.';
          const scheduledTime = notificationData.scheduledTime;

          if (scheduledTime) {
            const scheduledDate = new Date(scheduledTime);
            const now = new Date();
            if (scheduledDate > now) {
              const delay = scheduledDate.getTime() - now.getTime();
              setTimeout(() => {
                showInfo(notificationMessage);
              }, delay);
              return;
            }
          }

          showInfo(notificationMessage);
        }
      } catch (error) {
        console.error('알림 처리 오류:', error);
      }
    };

    const unsubscribeConnected = sparkMessagingClient.onConnected(handleConnected);
    const unsubscribeStateChange = sparkMessagingClient.onConnectionStateChange(handleConnectionStateChange);
    const unsubscribeMessage = sparkMessagingClient.onMessage(handleNotification);

    return () => {
      unsubscribeConnected();
      unsubscribeStateChange();
      unsubscribeMessage();
    };
  }, [isAuthenticated, showInfo]);

  // 경로에 따라 컴포넌트 렌더링
  const renderContent = () => {
    if (loading) return <div>Loading...</div>;

    // 비로그인 상태에서 허용되는 경로
    if (!isAuthenticated) {
      if (currentRoute === '/signup') {
        return <Signup />;
      }
      return <Login />;
    }

    // 워크스페이스 온보딩 체크 (특정 경로는 제외)
    const { user } = useAuth();
    const hasWorkspaces = user?.workspaces && user.workspaces.length > 0;
    const allowedPathsWithoutWorkspace = ['/workspace', '/profile', '/design-system', '/legal/privacy-policy'];
    const isAllowedPath = allowedPathsWithoutWorkspace.some((path) => currentRoute.startsWith(path));

    if (!hasWorkspaces && !isAllowedPath) {
      return (
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{ height: '80vh', textAlign: 'center', padding: '20px' }}
        >
          <Typography variant="h2" style={{ marginBottom: '16px' }}>
            워크스페이스 참여가 필요합니다
          </Typography>
          <Typography variant="body-large" color="text-secondary" style={{ marginBottom: '32px' }}>
            현재 소속된 워크스페이스가 없습니다.
            <br />
            새로운 워크스페이스를 생성하거나 기존 워크스페이스에 초대받아야 합니다.
          </Typography>
          <Button variant="primary" onClick={() => handleNavigate('/workspace')}>
            워크스페이스 생성하러 가기
          </Button>
        </Flex>
      );
    }

    // 디자인 시스템 경로 처리
    if (currentRoute.startsWith('/design-system')) {
      const focusSection = getDesignSystemComponentFromPath(currentRoute);
      return <DesignSystemDemo focusSection={focusSection || undefined} />;
    }

    // 개인정보처리방침
    if (currentRoute === '/legal/privacy-policy') {
      return <PrivacyPolicy />;
    }

    // 등록된 앱 라우트 매칭 (서브 경로 포함)
    const route = appRoutes.find((r) => {
      if (r.path === '/') return currentRoute === '/';
      return currentRoute.startsWith(r.path);
    });
    if (route) {
      return route.element;
    }

    // 기본값 홈
    return appRoutes.find((r) => r.id === 'home')?.element || <div />;
  };

  return (
    <div className="app">
      {isAuthenticated ? (
        <ChatProvider>
          <RouterStateProvider pathname={currentRoute} onNavigate={handleNavigate}>
            <div className="app__main">
              <SidebarLayout>{renderContent()}</SidebarLayout>
            </div>
          </RouterStateProvider>
        </ChatProvider>
      ) : (
        <RouterStateProvider pathname={currentRoute} onNavigate={handleNavigate}>
          <div className="app__main">{renderContent()}</div>
        </RouterStateProvider>
      )}
    </div>
  );
}
