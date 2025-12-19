import type { ComponentChildren } from 'preact';
import { createContext } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';

export interface SidebarLayoutContextValue {
  isMobileSidebarOpen: boolean;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const SidebarLayoutContext = createContext<SidebarLayoutContextValue | null>(null);

export function SidebarLayoutProvider({ children }: { children: ComponentChildren }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const value = useMemo<SidebarLayoutContextValue>(
    () => ({
      isMobileSidebarOpen,
      openMobileSidebar: () => setIsMobileSidebarOpen(true),
      closeMobileSidebar: () => setIsMobileSidebarOpen(false),
    }),
    [isMobileSidebarOpen],
  );

  return <SidebarLayoutContext.Provider value={value}>{children}</SidebarLayoutContext.Provider>;
}

export function useSidebarLayout() {
  const ctx = useContext(SidebarLayoutContext);
  if (!ctx) throw new Error('useSidebarLayout must be used within SidebarLayoutProvider');
  return ctx;
}

export function useSidebarLayoutOptional() {
  return useContext(SidebarLayoutContext);
}






