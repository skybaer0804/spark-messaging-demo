import type { ComponentChildren } from 'preact';
import { Header } from '../Header/Header';
import './Content.scss';

interface ContentProps {
  children: ComponentChildren;
  headerTitle: string;
  isConnected: boolean;
  socketId: string | null;
}

export function Content({ children, headerTitle, isConnected, socketId }: ContentProps) {
  return (
    <main className="content">
      <div className="content__header">
        <Header title={headerTitle} isConnected={isConnected} socketId={socketId} />
      </div>
      <div className="content__body">{children}</div>
    </main>
  );
}
