import type { ComponentChildren } from 'preact';
import { Header } from '../Header/Header';
import './Content.scss';

interface ContentProps {
  children: ComponentChildren;
  headerTitle: string;
  isConnected: boolean;
  socketId: string | null;
  currentView?: string;
  onViewChange?: (view: string) => void;
}

export function Content({ children, headerTitle, isConnected, socketId, currentView, onViewChange }: ContentProps) {
  return (
    <main className="content">
      <div className="content__header">
        <Header 
          title={headerTitle} 
          isConnected={isConnected} 
          socketId={socketId}
          currentView={currentView}
          onViewChange={onViewChange}
        />
      </div>
      <div className="content__body">{children}</div>
    </main>
  );
}
