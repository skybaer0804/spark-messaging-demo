import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { AuthProvider } from '@/core/context/AuthContext';
import { ToastProvider } from '@/core/context/ToastContext';
import { ThemeProvider } from '@/core/context/ThemeProvider';
import './index.css';

// Vite PWA 서비스 워커 등록 (Lifecycle 관리 자동화)
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New content available, please refresh.');
  },
  onOfflineReady() {
    console.log('App ready to work offline.');
  },
});

render(
  <ToastProvider>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </ToastProvider>,
  document.getElementById('app')!,
);
