import Router, { Route, route } from 'preact-router';
import type { RouterOnChangeArgs } from 'preact-router';
import { cloneElement, isValidElement } from 'preact';
import { appRoutes } from './appRoutes';
import { useRouterState } from './RouterState';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';
import { Login, Signup } from '@/domains/Auth';
import { useAuth } from '@/core/hooks/useAuth';
import { useEffect } from 'preact/hooks';

function RouteNotFound() {
  return <div />;
}

function DesignSystemRoute(props: { ui?: string }) {
  return <DesignSystemDemo focusSection={props.ui} />;
}

function ProtectedRoute({ children, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading.value && !isAuthenticated.value) {
      route('/login', true);
    }
  }, [isAuthenticated.value, loading.value]);

  if (loading.value) return <div>Loading...</div>;
  if (!isAuthenticated.value) return null;

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
  const { setPathname } = useRouterState();

  const handleRouteChange = (e: RouterOnChangeArgs) => {
    setPathname(e.url || '/');
  };

  return (
    <Router onChange={handleRouteChange}>
      <Login path="/login" />
      <Signup path="/signup" />

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
        <DesignSystemDemo />
      </ProtectedRoute>
      <ProtectedRoute path="/design-system/:ui">
        {(props: any) => <DesignSystemDemo focusSection={props.ui} />}
      </ProtectedRoute>

      <PrivacyPolicy path="/legal/privacy-policy" />

      <RouteNotFound default />
    </Router>
  );
}
