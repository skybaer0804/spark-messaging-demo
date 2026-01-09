import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useContext, useMemo } from 'preact/hooks';

interface RouterState {
  pathname: string;
  navigate: (to: string) => void;
}

const RouterStateContext = createContext<RouterState | undefined>(undefined);

export const useRouterState = () => {
  const ctx = useContext(RouterStateContext);
  if (!ctx) throw new Error('useRouterState must be used within RouterStateProvider');
  return ctx;
};

interface RouterStateProviderProps {
  children: ComponentChildren;
  pathname: string;
  onNavigate: (to: string) => void;
}

export function RouterStateProvider({ children, pathname, onNavigate }: RouterStateProviderProps) {
  const value = useMemo<RouterState>(
    () => ({
      pathname,
      navigate: onNavigate,
    }),
    [pathname, onNavigate],
  );

  return <RouterStateContext.Provider value={value}>{children}</RouterStateContext.Provider>;
}
