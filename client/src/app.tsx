import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import sparkMessagingClient from './config/sparkMessaging';
import { appRoutes, findRouteTitleByPath, getDesignSystemComponentFromPath } from './routes/appRoutes';
import { SidebarLayout } from './layouts/SidebarLayout/SidebarLayout';
import { RouterStateProvider } from './routes/RouterState';
import { ensureSparkMessagingConnected } from '@/utils/ensureSparkMessagingConnected';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { PushService } from '@/services/PushService';
import { AuthPage } from '@/components/Auth/AuthPage';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';
import './app.scss';
import './index.css';

/**
 * SPA 구조의 App 컴포넌트
 * 상태 기반 네비게이션 적용 (Docs 아키텍처)
 */
export function App() {
  const { isAuthenticated, loading } = useAuth();
  const { showInfo } = useToast();

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const socketIdRef = useRef<string | null>(null);

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
        const status = await ensureSparkMessagingConnected();
        if (status.isConnected) {
          setIsConnected(true);
          setSocketId(status.socketId);
          socketIdRef.current = status.socketId;
        }
      } catch (error) {
        console.error('연결 초기화 실패:', error);
      }
    };

    initializeConnection();

    // 연결 상태 핸들러
    const handleConnected = (data: any) => {
      setIsConnected(true);
      setSocketId(data.socketId);
      socketIdRef.current = data.socketId;
    };

    // 연결 상태 변경 핸들러
    const handleConnectionStateChange = (connected: boolean) => {
      setIsConnected(connected);
      if (connected) {
        const status = sparkMessagingClient.getConnectionStatus();
        setSocketId(status.socketId);
        socketIdRef.current = status.socketId;
      } else {
        setSocketId(null);
        socketIdRef.current = null;
      }
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
      if (currentRoute === '/register') {
        // RegisterPage가 따로 있다면 여기에 추가 (현재 demo엔 AuthPage가 통합)
        return <AuthPage />;
      }
      return <AuthPage />;
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

    // 등록된 앱 라우트 매칭
    const route = appRoutes.find((r) => r.path === currentRoute);
    if (route) {
      return route.element;
    }

    // 기본값 홈
    return appRoutes.find((r) => r.id === 'home')?.element || <div />;
  };

  const headerTitle = findRouteTitleByPath(currentRoute);

  return (
    <div className="app">
      <RouterStateProvider pathname={currentRoute} onNavigate={handleNavigate}>
        <div className="app__main">
          <SidebarLayout headerTitle={headerTitle} isConnected={isConnected} socketId={socketId}>
            {renderContent()}
          </SidebarLayout>
        </div>
      </RouterStateProvider>
    </div>
  );
}
