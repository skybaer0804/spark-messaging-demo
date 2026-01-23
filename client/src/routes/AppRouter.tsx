import Router, { route } from 'preact-router';
import type { RouterOnChangeArgs } from 'preact-router';
import { cloneElement, isValidElement, lazy, Suspense } from 'preact/compat';
import { appRoutes } from './appRoutes';
// import { useRouterState } from './RouterState'; // 사용되지 않음
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';
import { Login, Signup } from '@/domains/Auth';
import { GuestJoin } from '@/domains/VideoMeeting/components/GuestJoin/GuestJoin';
import { useAuth } from '@/core/hooks/useAuth';
import { useEffect } from 'preact/hooks';
import { CircularProgress } from '@/ui-components/CircularProgress/CircularProgress';

// 큰 컴포넌트를 lazy loading으로 최적화
const DesignSystemDemo = lazy(() =>
  import('@/components/DesignSystemDemo/DesignSystemDemo').then((module) => ({
    default: module.DesignSystemDemo,
  })),
);

function RouteNotFound() {
  return <div />;
}

// DesignSystemRoute는 사용되지 않음

function ProtectedRoute({ children, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const pathname = window.location.pathname;
      const search = window.location.search;
      const params = new URLSearchParams(search);
      const isGuestJoin = pathname === '/video-meeting' && params.has('join');

      // 현재 경로가 게스트 참여 경로가 아니고, 화상회의 게스트 입장도 아닌 경우에만 로그인으로 리다이렉트
      if (!pathname.startsWith('/video-meeting/join/') && !isGuestJoin) {
        route('/login', true);
      }
    }
  }, [isAuthenticated, loading]);

  if (loading) return <div>Loading...</div>;

  // 게스트 입장의 경우 인증되지 않아도 children 렌더링 허용
  const pathname = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const isGuestJoin = pathname === '/video-meeting' && params.has('join');

  if (!isAuthenticated && !isGuestJoin) return null;

  if (typeof children === 'function') {
    return children(rest);
  }

  // children이 vnode인 경우 props 주입 (id 등 route params 전달용)
  const childrenWithProps = Array.isArray(children)
    ? children.map((child) => (isValidElement(child) ? cloneElement(child as any, rest) : child))
    : isValidElement(children)
    ? cloneElement(children as any, rest)
    : children;

  return <>{childrenWithProps}</>;
}

export function AppRouter() {
  const handleRouteChange = (_e: RouterOnChangeArgs) => {
    // Route 변경 시 처리 (필요시)
  };

  return (
    <Router onChange={handleRouteChange}>
      {/* @ts-ignore - preact-router v4 allows direct component usage */}
      <Login path="/login" />
      {/* @ts-ignore */}
      <Signup path="/signup" />

      {/* Public Video Meeting Join Route */}
      {/* @ts-ignore */}
      <GuestJoin path="/video-meeting/join/:hash" />

      {appRoutes.map((r) => {
        if (r.id === 'login' || r.id === 'signup') {
          return null;
        }
        return (
          <ProtectedRoute key={r.id} path={r.path}>
            {r.element}
          </ProtectedRoute>
        );
      })}

      <ProtectedRoute path="/design-system">
        <Suspense fallback={<CircularProgress />}>
          <DesignSystemDemo />
        </Suspense>
      </ProtectedRoute>
      <ProtectedRoute path="/design-system/:ui">
        {(props: any) => (
          <Suspense fallback={<CircularProgress />}>
            <DesignSystemDemo focusSection={props.ui} />
          </Suspense>
        )}
      </ProtectedRoute>

      {/* @ts-ignore */}
      <PrivacyPolicy path="/legal/privacy-policy" />

      {/* @ts-ignore */}
      <RouteNotFound default />
    </Router>
  );
}
