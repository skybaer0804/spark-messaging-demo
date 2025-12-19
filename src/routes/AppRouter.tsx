import { useEffect } from 'preact/hooks';
import Router, { Route, route as navigateTo } from 'preact-router';
import type { RouterOnChangeArgs } from 'preact-router';
import { appRoutes } from './appRoutes';
import { useRouterState } from './RouterState';
import { DesignSystemDemo } from '@/components/DesignSystemDemo/DesignSystemDemo';
import { PrivacyPolicy } from '@/components/PrivacyPolicy/PrivacyPolicy';

function RouteNotFound() {
  return <div />;
}

function DesignSystemRoute(props: { ui?: string }) {
  return <DesignSystemDemo focusSection={props.ui} />;
}

function RedirectToChatApp() {
  useEffect(() => {
    navigateTo('/chatapp', true);
  }, []);
  return <div />;
}

export function AppRouter() {
  const { setPathname } = useRouterState();

  const handleRouteChange = (e: RouterOnChangeArgs) => {
    setPathname(e.url || '/chatapp');
  };

  return (
    <Router onChange={handleRouteChange}>
      <Route path="/" component={RedirectToChatApp} />

      {appRoutes
        .filter((r) => r.id !== 'design-system')
        .map((r) => (
          <Route key={r.id} path={r.path} component={() => r.element} />
        ))}

      <Route path="/design-system" component={DesignSystemRoute} />
      <Route path="/design-system/:ui" component={DesignSystemRoute} />

      <Route path="/legal/privacy-policy" component={PrivacyPolicy} />

      <Route default component={RouteNotFound} />
    </Router>
  );
}
